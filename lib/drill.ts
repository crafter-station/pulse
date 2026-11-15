import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { PERIODS, type PeriodKey } from "./overview";
import { CORE_ALIASES, getMember } from "./roster";

export type DrillKind = "repos" | "ships" | "commits" | "packages";

export type DrillQuery = {
	kind: DrillKind;
	orgId: number | null;
	period: PeriodKey;
	login?: string | null;
	month?: string | null;
};

export type DrillItem = {
	id: string;
	title: string;
	isPrivate: boolean;
	meta: string[];
	href: string | null;
	date: string | null;
	value?: string;
};

const SHIPPED = sql`(r.homepage is not null or exists (
	select 1 from packages p where p.is_active and lower(p.github_repo) = lower(r.full_name)
))`;

const mask = (value: string) =>
	createHash("sha256").update(value).digest("hex").slice(0, 10);

function aliasesFor(login: string | null | undefined): string[] | null {
	if (!login) return null;
	const member = getMember(login);
	if (!member) return [login.toLowerCase()];
	return [member.login, ...(member.aliases ?? [])].map((a) => a.toLowerCase());
}

function inList(values: string[]) {
	return sql.join(
		values.map((v) => sql`${v}`),
		sql`, `,
	);
}

function range(query: DrillQuery) {
	if (query.month && /^\d{4}-\d{2}$/.test(query.month)) {
		const start = new Date(`${query.month}-01T05:00:00Z`);
		const end = new Date(start);
		end.setUTCMonth(end.getUTCMonth() + 1);
		return { start, end };
	}
	const end = new Date();
	return {
		start: new Date(end.getTime() - PERIODS[query.period].days * 86_400_000),
		end,
	};
}

export async function getDrill(query: DrillQuery): Promise<DrillItem[]> {
	const { start, end } = range(query);
	const orgCond = sql`(${query.orgId}::int is null or r.org_id = ${query.orgId}::int)`;
	const aliases = aliasesFor(query.login);

	if (query.kind === "repos" || query.kind === "ships") {
		const result = await db.execute(sql`
			select r.name, r.full_name, r.is_private, r.homepage, r.stars, r.github_created_at,
				r.creator_login, o.display_name as org
			from repos r join orgs o on o.id = r.org_id
			where r.is_fork = false and ${orgCond}
				and r.github_created_at >= ${start} and r.github_created_at < ${end}
				${query.kind === "ships" ? sql`and ${SHIPPED}` : sql``}
				${aliases ? sql`and lower(r.creator_login) in (${inList(aliases)})` : sql``}
			order by r.github_created_at desc
		`);
		return (result.rows as Record<string, unknown>[]).map((r) => {
			const isPrivate = Boolean(r.is_private);
			const creator = getMember(r.creator_login as string | null);
			const homepage = isPrivate ? null : (r.homepage as string | null);
			const meta = [String(r.org), creator?.name ?? "Unattributed"];
			if (homepage) meta.push(homepage.replace(/^https?:\/\//, "").replace(/\/$/, ""));
			if (!isPrivate && Number(r.stars) > 0) meta.push(`${r.stars} ${Number(r.stars) === 1 ? "star" : "stars"}`);
			return {
				id: String(r.full_name),
				title: isPrivate ? `Private ${mask(String(r.full_name))}` : String(r.name),
				isPrivate,
				meta,
				href: isPrivate ? null : `https://github.com/${r.full_name}`,
				date: new Date(r.github_created_at as string).toISOString(),
			};
		});
	}

	if (query.kind === "commits") {
		const who = aliases ?? CORE_ALIASES;
		const result = await db.execute(sql`
			select c.id, c.repo_name, c.message, c.additions, c.deletions, c.commit_url, c.pushed_at,
				c.author_username, coalesce(r.is_private, false) as is_private
			from commits c
			left join repos r on r.org_id = c.org_id and r.name = c.repo_name
			where (${query.orgId}::int is null or c.org_id = ${query.orgId}::int)
				and c.pushed_at >= ${start} and c.pushed_at < ${end} and c.pushed_at <= now()
				and lower(c.author_username) in (${inList(who)})
			order by c.pushed_at desc
			limit 300
		`);
		return (result.rows as Record<string, unknown>[]).map((c) => {
			const isPrivate = Boolean(c.is_private);
			const firstLine = String(c.message).split("\n")[0];
			const member = getMember(c.author_username as string);
			return {
				id: String(c.id),
				title: isPrivate ? "Commit in a private repo" : firstLine,
				isPrivate,
				meta: [
					isPrivate ? `Private ${mask(String(c.repo_name))}` : String(c.repo_name),
					...(aliases ? [] : [member?.name ?? String(c.author_username)]),
					`+${Number(c.additions ?? 0).toLocaleString("en-US")} −${Number(c.deletions ?? 0).toLocaleString("en-US")}`,
				],
				href: isPrivate ? null : String(c.commit_url),
				date: new Date(c.pushed_at as string).toISOString(),
			};
		});
	}

	const result = await db.execute(sql`
		select p.slug, p.display_name, p.npm_name, p.github_repo, o.display_name as org,
			max(ls.value) filter (where ls.metric = 'downloads_last_month') as npm_month,
			max(ls.value) filter (where ls.metric = 'installs_total') as installs
		from packages p
		join orgs o on o.id = p.org_id
		left join lateral (
			select distinct on (ps.source, ps.metric) ps.metric, ps.value
			from package_stats ps where ps.package_id = p.id
			order by ps.source, ps.metric, ps.captured_at desc
		) ls on true
		where p.is_active and (${query.orgId}::int is null or p.org_id = ${query.orgId}::int)
		group by p.id, o.display_name
		order by coalesce(max(ls.value) filter (where ls.metric = 'downloads_last_month'), 0) desc
	`);
	return (result.rows as Record<string, unknown>[]).map((p) => {
		const npm = Number(p.npm_month ?? 0);
		const installs = Number(p.installs ?? 0);
		const meta = [String(p.org)];
		if (p.npm_name) meta.push(String(p.npm_name));
		if (installs) meta.push(`${installs.toLocaleString("en-US")} skill installs`);
		return {
			id: String(p.slug),
			title: String(p.display_name),
			isPrivate: false,
			meta,
			href: p.npm_name
				? `https://www.npmjs.com/package/${p.npm_name}`
				: p.github_repo
					? `https://github.com/${p.github_repo}`
					: null,
			date: null,
			value: `${npm.toLocaleString("en-US")} / mo`,
		};
	});
}
