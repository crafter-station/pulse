import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { formatRelativeTime } from "@/lib/utils/time";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
		const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

		const [recentCommits, allRepos, [{ count: total }]] = await Promise.all([
			db
				.select()
				.from(commits)
				.orderBy(desc(commits.pushedAt))
				.limit(limit)
				.offset(offset),
			db
				.select({ name: repos.name, isPrivate: repos.isPrivate })
				.from(repos),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(commits),
		]);

		const repoMap = new Map(allRepos.map((r) => [r.name, r.isPrivate ?? false]));

		const formatted = recentCommits.map((commit) => {
			const isPrivate = repoMap.get(commit.repoName) ?? false;

			// Remove Co-Authored-By lines from commit messages
			const cleanMessage = commit.message
				.split("\n")
				.filter((line) => !line.includes("Co-Authored-By:"))
				.join("\n")
				.trim();

			return {
				repo: commit.repoName,
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
			items: formatted,
			total: Math.min(total, MAX_LIMIT),
			hasMore: offset + limit < Math.min(total, MAX_LIMIT),
		});
	} catch (error) {
		console.error("Activity API error:", error);
		return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
	}
}
