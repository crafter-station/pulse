import { createHash } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { PERIODS, type PeriodKey } from "./overview";
import { getMember, visibleAuthor } from "./roster";

export const SHIPPED_SQL = sql`(r.homepage is not null or exists (
	select 1 from packages p where p.is_active and lower(p.github_repo) = lower(r.full_name)
))`;

/** Stars a repo had at the end of `day`, from the daily snapshots. */
export const starsAt = (day: Date) => sql`coalesce((
	select rs.value from repo_stats rs
	where rs.repo_id = r.id and rs.metric = 'stars' and rs.captured_on <= ${day.toISOString().slice(0, 10)}::date
	order by rs.captured_on desc limit 1
), 0)`;

export const maskName = (fullName: string) =>
	`Private ${createHash("sha256").update(fullName).digest("hex").slice(0, 10)}`;

export function periodStart(period: PeriodKey) {
	return new Date(Date.now() - PERIODS[period].days * 86_400_000);
}

export type ProjectRow = {
	org: string;
	orgSlug: string;
	name: string;
	slugName: string | null;
	isPrivate: boolean;
	creator: { login: string; name: string } | null;
	createdAt: string | null;
	lastPushAt: string | null;
	stars: number;
	starsGained: number;
	homepage: string | null;
	shipped: boolean;
	archived: boolean;
};

export type ProjectSort = "created" | "stars" | "gained" | "pushed";
export type ProjectStatus = "all" | "shipped" | "created";

export async function listProjects(opts: {
	orgId: number | null;
	period: PeriodKey;
	q?: string;
	creator?: string | null;
	status?: ProjectStatus;
	sort?: ProjectSort;
}): Promise<ProjectRow[]> {
	const start = periodStart(opts.period);
	const where: SQL[] = [sql`r.is_fork = false`, sql`(${opts.orgId}::int is null or r.org_id = ${opts.orgId}::int)`];
	if (opts.q) where.push(sql`(not r.is_private and r.name ilike ${`%${opts.q}%`})`);
	if (opts.creator) {
		const member = getMember(opts.creator);
		const aliases = member ? [member.login, ...(member.aliases ?? [])] : [opts.creator];
		where.push(
			sql`lower(r.creator_login) in (${sql.join(
				aliases.map((a) => sql`${a.toLowerCase()}`),
				sql`, `,
			)})`,
		);
	}
	if (opts.status === "shipped") where.push(sql`r.github_created_at >= ${start} and ${SHIPPED_SQL}`);
	if (opts.status === "created") where.push(sql`r.github_created_at >= ${start}`);

	const order = {
		created: sql`r.github_created_at desc nulls last`,
		stars: sql`r.stars desc, r.github_created_at desc`,
		gained: sql`stars_gained desc, r.stars desc`,
		pushed: sql`r.last_push_at desc nulls last`,
	}[opts.sort ?? "created"];

	const result = await db.execute(sql`
		select r.name, r.full_name, r.is_private, r.is_archived, r.homepage, r.stars, r.github_created_at,
			r.last_push_at, r.creator_login, o.display_name as org, o.slug as org_slug,
			${SHIPPED_SQL} as shipped,
			(r.stars - ${starsAt(start)})::int as stars_gained
		from repos r join orgs o on o.id = r.org_id
		where ${sql.join(where, sql` and `)}
		order by ${order}
	`);

	return (result.rows as Record<string, unknown>[]).map((r) => {
		const isPrivate = Boolean(r.is_private);
		const member = getMember(r.creator_login as string | null);
		return {
			org: String(r.org),
			orgSlug: String(r.org_slug),
			name: isPrivate ? maskName(String(r.full_name)) : String(r.name),
			slugName: isPrivate ? null : String(r.name),
			isPrivate,
			creator: member ? { login: member.login, name: member.name } : null,
			createdAt: r.github_created_at ? new Date(r.github_created_at as string).toISOString() : null,
			lastPushAt: r.last_push_at ? new Date(r.last_push_at as string).toISOString() : null,
			stars: isPrivate ? 0 : Number(r.stars ?? 0),
			starsGained: isPrivate ? 0 : Number(r.stars_gained ?? 0),
			homepage: isPrivate ? null : ((r.homepage as string | null) ?? null),
			shipped: Boolean(r.shipped),
			archived: Boolean(r.is_archived),
		};
	});
}

export type ProjectDetail = {
	org: string;
	orgSlug: string;
	name: string;
	fullName: string;
	description: string | null;
	homepage: string | null;
	stars: number;
	forks: number;
	starsGained: number;
	createdAt: string | null;
	lastPushAt: string | null;
	creator: { login: string; name: string } | null;
	shipped: boolean;
	archived: boolean;
	starSeries: { day: string; value: number }[];
	commits: { id: string; title: string; author: string; date: string; url: string; additions: number; deletions: number }[];
	contributors: { login: string; name: string; commits: number }[];
};

export async function getProject(
	orgSlug: string,
	name: string,
	period: PeriodKey,
): Promise<ProjectDetail | null> {
	const start = periodStart(period);
	const repoResult = await db.execute(sql`
		select r.id, r.org_id, r.name, r.full_name, r.description, r.homepage, r.stars, r.forks, r.github_created_at,
			r.last_push_at, r.creator_login, r.is_archived, o.display_name as org, o.slug as org_slug,
			${SHIPPED_SQL} as shipped, (r.stars - ${starsAt(start)})::int as stars_gained
		from repos r join orgs o on o.id = r.org_id
		where o.slug = ${orgSlug} and r.name = ${name} and r.is_private = false
		limit 1
	`);
	const r = repoResult.rows[0] as Record<string, unknown> | undefined;
	if (!r) return null;

	const author = visibleAuthor(sql.raw("c.author_username"));
	const [series, commitRows, contributorRows] = await Promise.all([
		db.execute(sql`
			select captured_on::text as day, value from repo_stats
			where repo_id = ${r.id} and metric = 'stars' order by captured_on
		`),
		db.execute(sql`
			select c.id, c.message, c.author_username, c.pushed_at, c.commit_url, c.additions, c.deletions
			from commits c
			where c.org_id = ${r.org_id} and c.repo_name = ${r.name} and c.pushed_at <= now() and ${author}
			order by c.pushed_at desc limit 30
		`),
		db.execute(sql`
			select c.author_username, count(*)::int as commits
			from commits c
			where c.org_id = ${r.org_id} and c.repo_name = ${r.name} and c.pushed_at <= now() and ${author}
			group by 1 order by 2 desc limit 12
		`),
	]);

	const member = getMember(r.creator_login as string | null);
	return {
		org: String(r.org),
		orgSlug: String(r.org_slug),
		name: String(r.name),
		fullName: String(r.full_name),
		description: (r.description as string | null) ?? null,
		homepage: (r.homepage as string | null) ?? null,
		stars: Number(r.stars ?? 0),
		forks: Number(r.forks ?? 0),
		starsGained: Number(r.stars_gained ?? 0),
		createdAt: r.github_created_at ? new Date(r.github_created_at as string).toISOString() : null,
		lastPushAt: r.last_push_at ? new Date(r.last_push_at as string).toISOString() : null,
		creator: member ? { login: member.login, name: member.name } : null,
		shipped: Boolean(r.shipped),
		archived: Boolean(r.is_archived),
		starSeries: (series.rows as { day: string; value: number }[]).map((s) => ({
			day: s.day,
			value: Number(s.value),
		})),
		commits: (commitRows.rows as Record<string, unknown>[]).map((c) => {
			const m = getMember(c.author_username as string);
			return {
				id: String(c.id),
				title: String(c.message).split("\n")[0],
				author: m?.name ?? String(c.author_username),
				date: new Date(c.pushed_at as string).toISOString(),
				url: String(c.commit_url),
				additions: Number(c.additions ?? 0),
				deletions: Number(c.deletions ?? 0),
			};
		}),
		contributors: (contributorRows.rows as Record<string, unknown>[]).map((c) => {
			const m = getMember(c.author_username as string);
			return {
				login: String(c.author_username),
				name: m?.name ?? String(c.author_username),
				commits: Number(c.commits),
			};
		}),
	};
}
