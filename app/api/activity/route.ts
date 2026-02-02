import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { formatRelativeTime } from "@/lib/utils/time";

export async function GET() {
	try {
		const recentCommits = await db
			.select()
			.from(commits)
			.orderBy(desc(commits.pushedAt))
			.limit(50);

		const formatted = recentCommits.map((commit) => ({
			repo: commit.repoName,
			author: commit.authorUsername,
			message: commit.message,
			time: formatRelativeTime(commit.pushedAt),
			additions: commit.additions || 0,
			deletions: commit.deletions || 0,
			commitUrl: commit.commitUrl,
		}));

		return NextResponse.json(formatted);
	} catch (error) {
		console.error("Activity API error:", error);
		return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
	}
}
