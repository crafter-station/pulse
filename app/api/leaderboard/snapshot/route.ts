import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits, weeklyLeaderboards } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";
import { getPeruWeekStart, getPeruISOWeek } from "@/lib/utils/time";

/**
 * POST /api/leaderboard/snapshot
 * Save current week's leaderboard to history.
 * Protected: requires `Authorization: Bearer $CRON_SECRET` (fail-closed —
 * if CRON_SECRET is unset, every request is rejected). Vercel Cron sends this
 * header automatically when CRON_SECRET is configured.
 */
export async function POST(request: Request) {
	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	try {
		const weekStart = getPeruWeekStart();
		const { year, week } = getPeruISOWeek();

		// Get current week's leaderboard
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
			.orderBy(sql`count(*) desc`)
			.limit(10);

		if (leaderboard.length === 0) {
			return NextResponse.json({ message: "No commits this week" }, { status: 200 });
		}

		// Save each member to weekly_leaderboards with rank
		const snapshots = leaderboard.map((member, index) => ({
			year,
			week,
			username: member.username,
			avatarUrl: member.avatarUrl,
			commits: member.commits,
			additions: member.additions,
			deletions: member.deletions,
			rank: index + 1,
		}));

		await db.insert(weeklyLeaderboards).values(snapshots);

		return NextResponse.json({
			message: `Saved ${snapshots.length} members for week ${week} of ${year}`,
			year,
			week,
			members: snapshots.length,
		});
	} catch (error) {
		console.error("Snapshot API error:", error);
		return NextResponse.json({ error: "Failed to save snapshot" }, { status: 500 });
	}
}
