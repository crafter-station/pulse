import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits } from "@/lib/db/schema";
import { sql, gte, desc } from "drizzle-orm";
import { getPeruWeekStart } from "@/lib/utils/time";

export async function GET() {
	try {
		const weekStart = getPeruWeekStart();

		const leaderboard = await db
			.select({
				username: commits.authorUsername,
				avatarUrl: commits.authorAvatarUrl,
				commits: sql<number>`count(*)::int`,
				additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
				deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
			})
			.from(commits)
			.where(gte(commits.pushedAt, weekStart))
			.groupBy(commits.authorUsername, commits.authorAvatarUrl)
			.orderBy(desc(sql`count(*)`))
			.limit(10);

		const formatted = leaderboard.map((member) => ({
			name: member.username,
			commits: member.commits,
			additions: member.additions,
			deletions: member.deletions,
			avatarUrl: member.avatarUrl,
		}));

		return NextResponse.json(formatted);
	} catch (error) {
		console.error("Leaderboard API error:", error);
		return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
	}
}
