import { and, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits } from "@/lib/db/schema";
import { orgIdCondition, resolveOrgFromRequest } from "@/lib/org-filter";

export async function GET(request: Request) {
	try {
		const org = await resolveOrgFromRequest(request);
		const orgFilter = orgIdCondition(commits.orgId, org?.id ?? null);

		// Start from January 1, 2026
		const startDate = new Date(2026, 0, 1);

		const dailyCommits = await db
			.select({
				date: sql<string>`date(${commits.pushedAt})`,
				count: sql<number>`count(*)::int`,
			})
			.from(commits)
			.where(and(gte(commits.pushedAt, startDate), orgFilter))
			.groupBy(sql`date(${commits.pushedAt})`)
			.orderBy(sql`date(${commits.pushedAt})`);

		const heatmapData: Record<string, number> = {};
		dailyCommits.forEach((day) => {
			heatmapData[day.date] = day.count;
		});

		const allDates: Array<{ date: string; count: number }> = [];
		const endDate = new Date(2026, 11, 31);
		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const dateStr = currentDate.toISOString().split("T")[0];
			allDates.push({
				date: dateStr,
				count: heatmapData[dateStr] || 0,
			});
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return NextResponse.json(allDates);
	} catch (error) {
		console.error("Heatmap API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch heatmap" },
			{ status: 500 },
		);
	}
}
