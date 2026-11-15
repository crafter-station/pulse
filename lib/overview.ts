import { sql } from "drizzle-orm";
import { db } from "./db";
import { CORE_MEMBERS, getMember } from "./roster";
import { getTeamLeaderboard } from "./team-leaderboard";

export const PERIODS = {
	week: { days: 7, label: "Last 7 days", previous: "previous 7 days" },
	month: { days: 30, label: "Last 30 days", previous: "previous 30 days" },
	quarter: { days: 90, label: "Last 90 days", previous: "previous 90 days" },
} as const;

export type PeriodKey = keyof typeof PERIODS;

export function parsePeriod(value: string | undefined): PeriodKey {
	return value && value in PERIODS ? (value as PeriodKey) : "month";
}

export type Ship = {
	name: string;
	isPrivate: boolean;
	org: string;
	homepage: string | null;
	stars: number;
	createdAt: string;
	creator: { login: string; name: string } | null;
	url: string | null;
};

export type TeamStat = {
	login: string;
	name: string;
	role: string;
	avatarUrl: string;
	ships: number;
	repos: number;
	commits: number;
};

export type Overview = {
	period: PeriodKey;
	shipped: { current: number; previous: number };
	created: { current: number; previous: number };
	npmMonth: number;
	skillsInstalls: number;
	totalStars: number;
	ships: Ship[];
	team: TeamStat[];
	mostStarred: { name: string; org: string; stars: number; url: string }[];
	createdByMonth: { month: string; count: number }[];
};

// A repo is shipped when it has a homepage or a published package.
const SHIPPED = sql`(r.homepage is not null or exists (
	select 1 from packages p where p.is_active and lower(p.github_repo) = lower(r.full_name)
))`;

type Row = Record<string, unknown>;
const rowsOf = (result: { rows: unknown[] }) => result.rows as Row[];

export async function getOverview(
	orgId: number | null,
	period: PeriodKey,
): Promise<Overview> {
	const days = PERIODS[period].days;
	const now = new Date();
	const start = new Date(now.getTime() - days * 86_400_000);
	const prevStart = new Date(now.getTime() - 2 * days * 86_400_000);
	const orgCond = sql`(${orgId}::int is null or r.org_id = ${orgId}::int)`;
	const base = sql`r.is_fork = false and ${orgCond}`;

	const [counts, ships, creators, starred, months, dist, commitRows] =
		await Promise.all([
			db.execute(sql`
				select
					count(*) filter (where r.github_created_at >= ${start})::int as created,
					count(*) filter (where r.github_created_at >= ${prevStart} and r.github_created_at < ${start})::int as created_prev,
					count(*) filter (where r.github_created_at >= ${start} and ${SHIPPED})::int as shipped,
					count(*) filter (where r.github_created_at >= ${prevStart} and r.github_created_at < ${start} and ${SHIPPED})::int as shipped_prev,
					coalesce(sum(r.stars) filter (where not r.is_private), 0)::int as stars
				from repos r where ${base}
			`),
			db.execute(sql`
				select r.name, r.full_name, r.is_private, r.homepage, r.stars, r.github_created_at, r.creator_login, o.display_name as org
				from repos r join orgs o on o.id = r.org_id
				where ${base} and r.github_created_at >= ${start} and ${SHIPPED}
				order by r.github_created_at desc
				limit 8
			`),
			db.execute(sql`
				select lower(r.creator_login) as login,
					count(*)::int as repos,
					count(*) filter (where ${SHIPPED})::int as ships
				from repos r
				where ${base} and r.github_created_at >= ${start} and r.creator_login is not null
				group by 1
			`),
			db.execute(sql`
				select r.name, r.full_name, r.stars, o.display_name as org
				from repos r join orgs o on o.id = r.org_id
				where ${base} and not r.is_private and r.stars > 0
				order by r.stars desc
				limit 7
			`),
			db.execute(sql`
				select to_char(date_trunc('month', r.github_created_at at time zone 'America/Lima'), 'YYYY-MM') as month,
					count(*)::int as count
				from repos r
				where ${base} and r.github_created_at >= date_trunc('year', now() at time zone 'America/Lima')
				group by 1 order by 1
			`),
			db.execute(sql`
				select ps.metric, coalesce(sum(ps.value), 0)::int as value
				from (
					select distinct on (ps.package_id, ps.source, ps.metric) ps.package_id, ps.source, ps.metric, ps.value
					from package_stats ps
					join packages p on p.id = ps.package_id
					where p.is_active and (${orgId}::int is null or p.org_id = ${orgId}::int)
					order by ps.package_id, ps.source, ps.metric, ps.captured_at desc
				) ps
				where ps.metric in ('downloads_last_month', 'installs_total')
				group by 1
			`),
			getTeamLeaderboard(start, orgId),
		]);

	const c = rowsOf(counts)[0] ?? {};
	const distBy = new Map(
		rowsOf(dist).map((r) => [String(r.metric), Number(r.value)]),
	);

	const byMember = new Map<string, { repos: number; ships: number }>();
	for (const row of rowsOf(creators)) {
		const member = getMember(String(row.login));
		if (!member) continue;
		const entry = byMember.get(member.login) ?? { repos: 0, ships: 0 };
		entry.repos += Number(row.repos);
		entry.ships += Number(row.ships);
		byMember.set(member.login, entry);
	}
	const commitsBy = new Map(commitRows.map((r) => [r.login, r.commits]));

	const team: TeamStat[] = CORE_MEMBERS.map((m) => ({
		login: m.login,
		name: m.name,
		role: m.role,
		avatarUrl: `https://github.com/${m.login}.png?size=96`,
		ships: byMember.get(m.login)?.ships ?? 0,
		repos: byMember.get(m.login)?.repos ?? 0,
		commits: commitsBy.get(m.login) ?? 0,
	})).sort(
		(a, b) =>
			b.ships - a.ships ||
			b.repos - a.repos ||
			b.commits - a.commits ||
			a.name.localeCompare(b.name),
	);

	return {
		period,
		shipped: { current: Number(c.shipped ?? 0), previous: Number(c.shipped_prev ?? 0) },
		created: { current: Number(c.created ?? 0), previous: Number(c.created_prev ?? 0) },
		npmMonth: distBy.get("downloads_last_month") ?? 0,
		skillsInstalls: distBy.get("installs_total") ?? 0,
		totalStars: Number(c.stars ?? 0),
		ships: rowsOf(ships).map((r) => {
			const member = getMember(r.creator_login as string | null);
			const isPrivate = Boolean(r.is_private);
			return {
				name: isPrivate ? "Private project" : String(r.name),
				isPrivate,
				org: String(r.org),
				homepage: isPrivate ? null : ((r.homepage as string | null) ?? null),
				stars: Number(r.stars ?? 0),
				createdAt: new Date(r.github_created_at as string).toISOString(),
				creator: member ? { login: member.login, name: member.name } : null,
				url: isPrivate ? null : `https://github.com/${r.full_name}`,
			};
		}),
		team,
		mostStarred: rowsOf(starred).map((r) => ({
			name: String(r.name),
			org: String(r.org),
			stars: Number(r.stars),
			url: `https://github.com/${r.full_name}`,
		})),
		createdByMonth: rowsOf(months).map((r) => ({
			month: String(r.month),
			count: Number(r.count),
		})),
	};
}
