import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { sql, and, gte, desc } from "drizzle-orm";

export async function GET() {
	try {
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const [commitsToday] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(commits)
			.where(gte(commits.pushedAt, todayStart));

		const [activeRepos] = await db
			.select({ count: sql<number>`count(distinct ${repos.name})::int` })
			.from(repos)
			.where(and(gte(repos.lastPushAt, weekAgo)));

		const allCommits = await db
			.select({
				date: sql<string>`date(${commits.pushedAt})`,
			})
			.from(commits)
			.where(gte(commits.pushedAt, sql`current_date - interval '90 days'`))
			.orderBy(desc(sql`date(${commits.pushedAt})`));

		let streak = 0;
		const today = now.toISOString().split("T")[0];
		let checkDate = today;

		const commitDates = new Set(allCommits.map((c) => c.date));

		while (commitDates.has(checkDate)) {
			streak++;
			const date = new Date(checkDate);
			date.setDate(date.getDate() - 1);
			checkDate = date.toISOString().split("T")[0];
		}

		return NextResponse.json({
			commitsToday: commitsToday.count || 0,
			activeRepos: activeRepos.count || 0,
			teamStreak: streak,
		});
	} catch (error) {
		console.error("Stats API error:", error);
		return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
	}
}
