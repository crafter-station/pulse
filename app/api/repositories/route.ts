import { createHash } from "crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { orgIdCondition, resolveOrgFromRequest } from "@/lib/org-filter";
import { getPeruWeekStart } from "@/lib/utils/time";

const MAX_REPOS = 12;

/**
 * GET /api/repositories?org=<slug|all>
 * List the most recently active repositories (by last push), with commits this week and top contributor.
 */
export async function GET(request: Request) {
	try {
		const weekStart = getPeruWeekStart();

		const org = await resolveOrgFromRequest(request);
		const reposOrgFilter = orgIdCondition(repos.orgId, org?.id ?? null);
		const commitsOrgFilter = orgIdCondition(commits.orgId, org?.id ?? null);

		const repoList = await db
			.select({
				name: repos.name,
				fullName: repos.fullName,
				lastPushAt: repos.lastPushAt,
				isPrivate: repos.isPrivate,
				orgId: repos.orgId,
			})
			.from(repos)
			.where(and(eq(repos.isActive, true), reposOrgFilter))
			.orderBy(desc(repos.lastPushAt))
			.limit(MAX_REPOS);

		const commitsThisWeek = await db
			.select({
				repoName: commits.repoName,
				orgId: commits.orgId,
				authorUsername: commits.authorUsername,
				authorAvatarUrl: commits.authorAvatarUrl,
				commits: sql<number>`count(*)::int`,
			})
			.from(commits)
			.where(and(gte(commits.pushedAt, weekStart), commitsOrgFilter))
			.groupBy(
				commits.repoName,
				commits.orgId,
				commits.authorUsername,
				commits.authorAvatarUrl,
			)
			.orderBy(commits.repoName, desc(sql`count(*)`), commits.authorUsername);

		// Key by `orgId:repoName` to avoid colliding same-name repos across orgs
		const repoStats = new Map<
			string,
			{
				commitsThisWeek: number;
				topContributor: {
					username: string;
					avatarUrl: string | null;
					commits: number;
				} | null;
			}
		>();

		for (const row of commitsThisWeek) {
			const key = `${row.orgId ?? 0}:${row.repoName}`;
			const existing = repoStats.get(key);
			const authorCommits = row.commits;

			if (!existing) {
				repoStats.set(key, {
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
			const stats = repoStats.get(`${repo.orgId ?? 0}:${repo.name}`);
			const isPrivate = repo.isPrivate ?? false;
			const name = isPrivate
				? createHash("sha256").update(repo.name).digest("hex").slice(0, 16)
				: repo.name;
			const fullName = isPrivate
				? createHash("sha256").update(repo.fullName).digest("hex").slice(0, 16)
				: repo.fullName;
			return {
				name,
				fullName,
				lastPushAt: repo.lastPushAt,
				isPrivate,
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
		console.error("Repositories API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch repositories" },
			{ status: 500 },
		);
	}
}
