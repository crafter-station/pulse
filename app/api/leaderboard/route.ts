import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits } from "@/lib/db/schema";
import { sql, gte, desc } from "drizzle-orm";

export async function GET() {
	try {
		const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		const leaderboard = await db
			.select({
				username: commits.authorUsername,
				avatarUrl: commits.authorAvatarUrl,
				commits: sql<number>`count(*)::int`,
			})
			.from(commits)
			.where(gte(commits.pushedAt, weekAgo))
			.groupBy(commits.authorUsername, commits.authorAvatarUrl)
			.orderBy(desc(sql`count(*)`))
			.limit(10);

		const formatted = leaderboard.map((member) => ({
			name: member.username,
			commits: member.commits,
			avatarUrl: member.avatarUrl,
		}));

		return NextResponse.json(formatted);
	} catch (error) {
		console.error("Leaderboard API error:", error);
		return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
	}
}
