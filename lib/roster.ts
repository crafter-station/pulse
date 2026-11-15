import { and, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { commits } from "./db/schema";
import { orgIdCondition } from "./org-filter";

export type Member = {
	login: string;
	name: string;
	role: string;
	aliases?: string[];
};

/** Active core team. Source of truth: https://crafter.run/team */
export const CORE_MEMBERS: Member[] = [
	{ login: "Railly", name: "Railly Hugo", role: "Founder" },
	{ login: "carlosdtn", name: "Carlos Tarmeño", role: "Co-founder, frontend" },
	{
		login: "EdwardR0507",
		name: "Edward Ramos",
		role: "Co-founder, senior frontend",
	},
	{ login: "LizethRiveros", name: "Liz Riveros", role: "Project manager" },
	{
		login: "TheVeller",
		name: "Ignacio Velásquez",
		role: "Growth & automation",
	},
	{ login: "Jibaru", name: "Ignacio Rueda", role: "Backend" },
	{
		login: "CristianOlivera1",
		name: "Cristian Olivera Chávez",
		role: "Software engineer",
	},
	{ login: "camilocbarrera", name: "Cristian Correa", role: "Data & software" },
	{ login: "MrUprizing", name: "Nicolas Vargas", role: "AI engineer" },
	{ login: "henryjing96", name: "Henry Jing", role: "China community lead" },
];

/** Former members: never shown by name. Their commits still count toward org totals. */
export const FORMER_MEMBER_LOGINS = [
	"shiarauzo",
	"cuevaio",
	"estparcae",
	"antunesgabriel",
	"juanortega10",
];

/** Automation and unattributable authors, excluded from every metric. */
export const BOT_LOGINS = [
	"crafternauta",
	"kekito-crafter",
	"cursoragent",
	"claude",
	"invalid-email-address",
	"quipu-bot",
	"astrobot-houston",
];

const lower = (values: string[]) => values.map((v) => v.toLowerCase());

const memberByAlias = new Map<string, Member>();
for (const member of CORE_MEMBERS) {
	for (const alias of [member.login, ...(member.aliases ?? [])]) {
		memberByAlias.set(alias.toLowerCase(), member);
	}
}

export const CORE_ALIASES = [...memberByAlias.keys()];
const BOTS = lower(BOT_LOGINS);
const FORMER = lower(FORMER_MEMBER_LOGINS);

export function getMember(login: string | null | undefined): Member | null {
	if (!login) return null;
	return memberByAlias.get(login.toLowerCase()) ?? null;
}

export function isBotLogin(login: string): boolean {
	const l = login.toLowerCase();
	return l.endsWith("[bot]") || BOTS.includes(l);
}

export function isHiddenLogin(login: string): boolean {
	return isBotLogin(login) || FORMER.includes(login.toLowerCase());
}

function inList(column: AnyColumn | SQL, values: string[]): SQL {
	return sql`lower(${column}) in (${sql.join(
		values.map((v) => sql`${v}`),
		sql`, `,
	)})`;
}

/** Author is a real person (not a bot). */
export function humanAuthor(column: AnyColumn | SQL = commits.authorUsername): SQL {
	return sql`(not ${inList(column, BOTS)} and ${column} not like '%[bot]')`;
}

/** Author may be shown by name: not a bot and not a former member. */
export function visibleAuthor(column: AnyColumn | SQL = commits.authorUsername): SQL {
	return sql`(${humanAuthor(column)} and not ${inList(column, FORMER)})`;
}

/** Author belongs to the active core team. */
export function coreAuthor(column: AnyColumn | SQL = commits.authorUsername): SQL {
	return inList(column, CORE_ALIASES);
}

/**
 * Commits that count toward metrics: org filter, human authors, and no
 * future-dated commits (imported history can carry arbitrary dates).
 */
export function countedCommits(orgId: number | null | undefined): SQL {
	return and(
		orgIdCondition(commits.orgId, orgId),
		humanAuthor(),
		sql`${commits.pushedAt} <= now()`,
	) as SQL;
}

/** Same as countedCommits, as a raw SQL fragment for hand-written queries on `commits`. */
export function countedCommitsRaw(orgId: number | null | undefined): SQL {
	const bots = sql.join(
		BOTS.map((v) => sql`${v}`),
		sql`, `,
	);
	return sql`(${orgId ?? null}::int is null or org_id = ${orgId ?? null}::int)
		and lower(author_username) not in (${bots})
		and author_username not like '%[bot]'
		and pushed_at <= now()`;
}
