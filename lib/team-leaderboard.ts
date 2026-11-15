import { and, gte, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { commits } from "./db/schema";
import { CORE_MEMBERS, coreAuthor, countedCommits, getMember } from "./roster";

export type TeamRow = {
	login: string;
	name: string;
	role: string;
	avatarUrl: string;
	commits: number;
	additions: number;
	deletions: number;
};

/** Every active core member with their counted commits since `since`, most commits first. */
export async function getTeamLeaderboard(
	since: Date,
	orgId: number | null,
	extra?: SQL,
): Promise<TeamRow[]> {
	const rows = await db
		.select({
			username: commits.authorUsername,
			commits: sql<number>`count(*)::int`,
			additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
			deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
		})
		.from(commits)
		.where(
			and(gte(commits.pushedAt, since), countedCommits(orgId), coreAuthor(), extra),
		)
		.groupBy(commits.authorUsername);

	const byLogin = new Map<string, TeamRow>(
		CORE_MEMBERS.map((m) => [
			m.login,
			{
				login: m.login,
				name: m.name,
				role: m.role,
				avatarUrl: `https://github.com/${m.login}.png?size=96`,
				commits: 0,
				additions: 0,
				deletions: 0,
			},
		]),
	);
	for (const row of rows) {
		const member = getMember(row.username);
		const entry = member && byLogin.get(member.login);
		if (!entry) continue;
		entry.commits += row.commits;
		entry.additions += row.additions;
		entry.deletions += row.deletions;
	}
	return [...byLogin.values()].sort(
		(a, b) => b.commits - a.commits || a.name.localeCompare(b.name),
	);
}
