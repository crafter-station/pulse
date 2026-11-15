import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weeklyLeaderboards } from "@/lib/db/schema";
import { getTeamLeaderboard } from "@/lib/team-leaderboard";
import { getPeruWeekStart, getPeruISOWeek } from "@/lib/utils/time";

/**
 * POST /api/leaderboard/snapshot
 * Save current week's leaderboard to history
 */
export async function POST() {
	try {
		const weekStart = getPeruWeekStart();
		const { year, week } = getPeruISOWeek();

		const leaderboard = (await getTeamLeaderboard(weekStart, null)).filter(
			(member) => member.commits > 0,
		);

		if (leaderboard.length === 0) {
			return NextResponse.json({ message: "No commits this week" }, { status: 200 });
		}

		// Save each member to weekly_leaderboards with rank
		const snapshots = leaderboard.map((member, index) => ({
			year,
			week,
			username: member.login,
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
