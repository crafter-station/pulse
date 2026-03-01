import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { formatRelativeTime } from "@/lib/utils/time";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/repositories/[name]
 * Repository detail: info, recent commits, top contributors (all time for this repo).
 */
export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ name: string }> },
) {
	try {
		const { name } = await context.params;
		const repoName = decodeURIComponent(name);

		const [repo] = await db
			.select({
				name: repos.name,
				fullName: repos.fullName,
				lastPushAt: repos.lastPushAt,
				isPrivate: repos.isPrivate,
			})
			.from(repos)
			.where(eq(repos.name, repoName));

		if (!repo) {
			return NextResponse.json({ error: "Repository not found" }, { status: 404 });
		}

		const isPrivate = repo.isPrivate ?? false;

		const [recentCommits, topContributors] = await Promise.all([
			isPrivate
				? []
				: db
						.select()
						.from(commits)
						.where(eq(commits.repoName, repoName))
						.orderBy(desc(commits.pushedAt))
						.limit(30),
			db
				.select({
					username: commits.authorUsername,
					avatarUrl: sql<string | null>`max(${commits.authorAvatarUrl})`.as("avatarUrl"),
					commits: sql<number>`count(*)::int`,
					additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
					deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
				})
				.from(commits)
				.where(eq(commits.repoName, repoName))
				.groupBy(commits.authorUsername)
				.orderBy(desc(sql`count(*)`))
				.limit(10),
		]);

		const formattedCommits = Array.isArray(recentCommits)
			? recentCommits.map((c) => {
					const cleanMessage = c.message
						.split("\n")
						.filter((line) => !line.includes("Co-Authored-By:"))
						.join("\n")
						.trim();
					return {
						repo: c.repoName,
						author: c.authorUsername,
						avatarUrl: c.authorAvatarUrl,
						message: cleanMessage,
						time: formatRelativeTime(c.pushedAt),
						additions: c.additions ?? 0,
						deletions: c.deletions ?? 0,
						commitUrl: c.commitUrl,
					};
				})
			: [];

		return NextResponse.json(
			{
				repo: {
					name: repo.name,
					fullName: repo.fullName,
					lastPushAt: repo.lastPushAt,
					isPrivate,
				},
				recentCommits: formattedCommits,
				topContributors: topContributors.map((c) => ({
					username: c.username,
					avatarUrl: c.avatarUrl,
					commits: c.commits,
					additions: c.additions,
					deletions: c.deletions,
				})),
			},
			{
				headers: {
					"Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
				},
			},
		);
	} catch (error) {
		console.error("Repository detail API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch repository" },
			{ status: 500 },
		);
	}
}
