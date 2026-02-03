import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { getPeruWeekStart } from "@/lib/utils/time";
import { desc, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const MAX_REPOS = 12;

/**
 * GET /api/repos
 * List the most recently active repos (by last push), with commits this week and top contributor.
 */
export async function GET() {
	try {
		const weekStart = getPeruWeekStart();

		const repoList = await db
			.select({
				name: repos.name,
				fullName: repos.fullName,
				lastPushAt: repos.lastPushAt,
			})
			.from(repos)
			.where(eq(repos.isActive, true))
			.orderBy(desc(repos.lastPushAt))
			.limit(MAX_REPOS);

		// Commits this week per repo per author (for count + top contributor)
		// Order by repo, then count desc so per-repo "top" is deterministic (tie-break: most commits, then first by name)
		const commitsThisWeek = await db
			.select({
				repoName: commits.repoName,
				authorUsername: commits.authorUsername,
				authorAvatarUrl: commits.authorAvatarUrl,
				commits: sql<number>`count(*)::int`,
			})
			.from(commits)
			.where(gte(commits.pushedAt, weekStart))
			.groupBy(commits.repoName, commits.authorUsername, commits.authorAvatarUrl)
			.orderBy(commits.repoName, desc(sql`count(*)`), commits.authorUsername);

		// Aggregate: total commits per repo + top author per repo
		const repoStats = new Map<
			string,
			{ commitsThisWeek: number; topContributor: { username: string; avatarUrl: string | null; commits: number } | null }
		>();

		for (const row of commitsThisWeek) {
			const existing = repoStats.get(row.repoName);
			const authorCommits = row.commits;

			if (!existing) {
				repoStats.set(row.repoName, {
					commitsThisWeek: authorCommits,
					topContributor: {
						username: row.authorUsername,
						avatarUrl: row.authorAvatarUrl,
						commits: authorCommits,
					},
				});
			} else {
				existing.commitsThisWeek += authorCommits;
				if (
					!existing.topContributor ||
					authorCommits > existing.topContributor.commits
				) {
					existing.topContributor = {
						username: row.authorUsername,
						avatarUrl: row.authorAvatarUrl,
						commits: authorCommits,
					};
				}
			}
		}

		const result = repoList.map((repo) => {
			const stats = repoStats.get(repo.name);
			return {
				name: repo.name,
				fullName: repo.fullName,
				lastPushAt: repo.lastPushAt,
				commitsThisWeek: stats?.commitsThisWeek ?? 0,
				topContributorThisWeek: stats?.topContributor ?? null,
			};
		});

		return NextResponse.json(result, {
			headers: {
				"Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
			},
		});
	} catch (error) {
		console.error("Repos API error:", error);
		return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
	}
}
