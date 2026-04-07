import { createHash } from "crypto";
import { desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { orgIdCondition, resolveOrgFromRequest } from "@/lib/org-filter";
import { formatRelativeTime } from "@/lib/utils/time";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const offset = Math.max(
			0,
			parseInt(searchParams.get("offset") || "0", 10) || 0,
		);
		const limit = Math.min(
			MAX_LIMIT,
			Math.max(
				1,
				parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) ||
					DEFAULT_LIMIT,
			),
		);

		const org = await resolveOrgFromRequest(request);
		const orgId = org?.id ?? null;
		const commitsOrgFilter = orgIdCondition(commits.orgId, orgId);
		const reposOrgFilter = orgIdCondition(repos.orgId, orgId);

		const [recentCommits, allRepos, [{ count: total }]] = await Promise.all([
			db
				.select()
				.from(commits)
				.where(commitsOrgFilter)
				.orderBy(desc(commits.pushedAt))
				.limit(limit)
				.offset(offset),
			db
				.select({
					name: repos.name,
					orgId: repos.orgId,
					isPrivate: repos.isPrivate,
				})
				.from(repos)
				.where(reposOrgFilter),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(commits)
				.where(commitsOrgFilter),
		]);

		// Build a (orgId, name) -> isPrivate map so repos with the same name across orgs don't collide
		const repoMap = new Map<string, boolean>();
		for (const r of allRepos) {
			repoMap.set(`${r.orgId ?? 0}:${r.name}`, r.isPrivate ?? false);
		}

		const formatted = recentCommits.map((commit) => {
			const isPrivate =
				repoMap.get(`${commit.orgId ?? 0}:${commit.repoName}`) ?? false;

			const cleanMessage = commit.message
				.split("\n")
				.filter((line) => !line.includes("Co-Authored-By:"))
				.join("\n")
				.trim();

			return {
				repo: isPrivate
					? createHash("sha256")
							.update(commit.repoName)
							.digest("hex")
							.slice(0, 16)
					: commit.repoName,
				author: commit.authorUsername,
				avatarUrl: commit.authorAvatarUrl,
				message: isPrivate
					? createHash("sha256").update(cleanMessage).digest("hex")
					: cleanMessage,
				time: formatRelativeTime(commit.pushedAt),
				additions: commit.additions || 0,
				deletions: commit.deletions || 0,
				commitUrl: isPrivate ? "#" : commit.commitUrl,
				isPrivate,
			};
		});

		return NextResponse.json({
			org: org?.slug ?? "all",
			items: formatted,
			total: Math.min(total, MAX_LIMIT),
			hasMore: offset + limit < Math.min(total, MAX_LIMIT),
		});
	} catch (error) {
		console.error("Activity API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch activity" },
			{ status: 500 },
		);
	}
}
