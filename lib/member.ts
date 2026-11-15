import { sql } from "drizzle-orm";
import { db } from "./db";
import { type PeriodKey } from "./overview";
import { listProjects, periodStart, type ProjectRow } from "./projects";
import { getMember, type Member } from "./roster";

export type MemberPage = {
	member: Member;
	ships: number;
	repos: number;
	commits: number;
	starsGained: number;
	created: ProjectRow[];
	activity: { day: string; count: number }[];
	commitList: { id: string; title: string; repo: string; isPrivate: boolean; date: string; url: string | null; additions: number; deletions: number }[];
};

export async function getMemberPage(
	login: string,
	orgId: number | null,
	period: PeriodKey,
): Promise<MemberPage | null> {
	const member = getMember(login);
	if (!member) return null;
	const start = periodStart(period);
	const aliases = [member.login, ...(member.aliases ?? [])].map((a) => a.toLowerCase());
	const inAliases = sql.join(
		aliases.map((a) => sql`${a}`),
		sql`, `,
	);
	const orgCond = sql`(${orgId}::int is null or c.org_id = ${orgId}::int)`;

	const [allCreated, activityRows, commitRows] = await Promise.all([
		listProjects({ orgId, period, creator: member.login, sort: "created" }),
		db.execute(sql`
			select to_char(c.pushed_at at time zone 'America/Lima', 'YYYY-MM-DD') as day, count(*)::int as count
			from commits c
			where ${orgCond} and lower(c.author_username) in (${inAliases})
				and c.pushed_at >= now() - interval '84 days' and c.pushed_at <= now()
			group by 1
		`),
		db.execute(sql`
			select c.id, c.message, c.repo_name, c.pushed_at, c.commit_url, c.additions, c.deletions,
				coalesce(r.is_private, false) as is_private
			from commits c
			left join repos r on r.org_id = c.org_id and r.name = c.repo_name
			where ${orgCond} and lower(c.author_username) in (${inAliases})
				and c.pushed_at >= ${start} and c.pushed_at <= now()
			order by c.pushed_at desc
		`),
	]);

	const created = allCreated.filter((p) => p.createdAt && new Date(p.createdAt) >= start);
	const byDay = new Map((activityRows.rows as { day: string; count: number }[]).map((r) => [r.day, Number(r.count)]));
	const activity: { day: string; count: number }[] = [];
	const today = new Date();
	for (let i = 83; i >= 0; i--) {
		const d = new Date(today.getTime() - i * 86_400_000);
		const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(d);
		activity.push({ day, count: byDay.get(day) ?? 0 });
	}

	const commits = commitRows.rows as Record<string, unknown>[];
	return {
		member,
		ships: created.filter((p) => p.shipped).length,
		repos: created.length,
		commits: commits.length,
		starsGained: allCreated.reduce((sum, p) => sum + p.starsGained, 0),
		created: allCreated,
		activity,
		commitList: commits.slice(0, 40).map((c) => {
			const isPrivate = Boolean(c.is_private);
			return {
				id: String(c.id),
				title: isPrivate ? "Commit in a private repo" : String(c.message).split("\n")[0],
				repo: isPrivate ? "Private repo" : String(c.repo_name),
				isPrivate,
				date: new Date(c.pushed_at as string).toISOString(),
				url: isPrivate ? null : String(c.commit_url),
				additions: Number(c.additions ?? 0),
				deletions: Number(c.deletions ?? 0),
			};
		}),
	};
}
