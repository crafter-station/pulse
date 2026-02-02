import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { sql, and, gte, desc } from "drizzle-orm";
import {
	getPeruNow,
	getPeruTodayStart,
	getPeruWeekStart,
	getPeruISOWeek,
} from "@/lib/utils/time";

export async function GET() {
	try {
		const now = getPeruNow();
		const todayStart = getPeruTodayStart();
		const weekStart = getPeruWeekStart();
		const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const { year, week } = getPeruISOWeek();

		const [commitsToday] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(commits)
			.where(gte(commits.pushedAt, todayStart));

		const [activeRepos] = await db
			.select({ count: sql<number>`count(distinct ${repos.name})::int` })
			.from(repos)
			.where(and(gte(repos.lastPushAt, weekStart)));

		const [totalCommits] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(commits);

		const [weekStats] = await db
			.select({
				commits: sql<number>`count(*)::int`,
				additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
				deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
			})
			.from(commits)
			.where(gte(commits.pushedAt, weekStart));

		const [monthStats] = await db
			.select({
				commits: sql<number>`count(*)::int`,
				additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
				deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
			})
			.from(commits)
			.where(gte(commits.pushedAt, monthAgo));

		const [activeContributors] = await db
			.select({ count: sql<number>`count(distinct ${commits.authorUsername})::int` })
			.from(commits)
			.where(gte(commits.pushedAt, weekStart));

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
			totalCommits: totalCommits.count || 0,
			currentWeek: {
				year,
				week,
			},
			weekStats: {
				commits: weekStats.commits || 0,
				additions: weekStats.additions || 0,
				deletions: weekStats.deletions || 0,
			},
			monthStats: {
				commits: monthStats.commits || 0,
				additions: monthStats.additions || 0,
				deletions: monthStats.deletions || 0,
			},
			activeContributors: activeContributors.count || 0,
		});
	} catch (error) {
		console.error("Stats API error:", error);
		return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
	}
}
