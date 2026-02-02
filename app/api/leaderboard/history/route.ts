import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weeklyLeaderboards } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * GET /api/leaderboard/history?year=2026&week=5
 * Get historical leaderboard for a specific week
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const year = searchParams.get("year");
		const week = searchParams.get("week");

		// If no params, return list of all available weeks
		if (!year || !week) {
			const availableWeeks = await db
				.selectDistinct({
					year: weeklyLeaderboards.year,
					week: weeklyLeaderboards.week,
				})
				.from(weeklyLeaderboards)
				.orderBy(sql`${weeklyLeaderboards.year} desc, ${weeklyLeaderboards.week} desc`)
				.limit(20);

			return NextResponse.json(availableWeeks);
		}

		// Get specific week
		const leaderboard = await db
			.select()
			.from(weeklyLeaderboards)
			.where(
				and(
					eq(weeklyLeaderboards.year, parseInt(year)),
					eq(weeklyLeaderboards.week, parseInt(week)),
				),
			)
			.orderBy(weeklyLeaderboards.rank);

		if (leaderboard.length === 0) {
			return NextResponse.json({ error: "No data for this week" }, { status: 404 });
		}

		return NextResponse.json({
			year: parseInt(year),
			week: parseInt(week),
			members: leaderboard,
		});
	} catch (error) {
		console.error("History API error:", error);
		return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
	}
}
