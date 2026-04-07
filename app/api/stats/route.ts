import { and, desc, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits, repos } from "@/lib/db/schema";
import { orgIdCondition, resolveOrgFromRequest } from "@/lib/org-filter";
import {
	getPeruISOWeek,
	getPeruNow,
	getPeruTodayStart,
	getPeruWeekStart,
} from "@/lib/utils/time";

export async function GET(request: Request) {
	try {
		const org = await resolveOrgFromRequest(request);
		const orgId = org?.id ?? null;
		const commitsOrgFilter = orgIdCondition(commits.orgId, orgId);
		const reposOrgFilter = orgIdCondition(repos.orgId, orgId);

		const now = getPeruNow();
		const todayStart = getPeruTodayStart();
		const weekStart = getPeruWeekStart();
		const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const { year, week } = getPeruISOWeek();

		const [commitsToday] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(commits)
			.where(and(gte(commits.pushedAt, todayStart), commitsOrgFilter));

		const [activeRepos] = await db
			.select({ count: sql<number>`count(distinct ${repos.name})::int` })
			.from(repos)
			.where(and(gte(repos.lastPushAt, weekStart), reposOrgFilter));

		const [totalCommits] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(commits)
			.where(commitsOrgFilter);

		const [weekStats] = await db
			.select({
				commits: sql<number>`count(*)::int`,
				additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
				deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
			})
			.from(commits)
			.where(and(gte(commits.pushedAt, weekStart), commitsOrgFilter));

		const [monthStats] = await db
			.select({
				commits: sql<number>`count(*)::int`,
				additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
				deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
			})
			.from(commits)
			.where(and(gte(commits.pushedAt, monthAgo), commitsOrgFilter));

		const [activeContributors] = await db
			.select({
				count: sql<number>`count(distinct ${commits.authorUsername})::int`,
			})
			.from(commits)
			.where(and(gte(commits.pushedAt, weekStart), commitsOrgFilter));

		const allCommits = await db
			.select({
				date: sql<string>`date(${commits.pushedAt})`,
			})
			.from(commits)
			.where(
				and(
					gte(commits.pushedAt, sql`current_date - interval '90 days'`),
					commitsOrgFilter,
				),
			)
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
			org: org?.slug ?? "all",
			commitsToday: commitsToday.count || 0,
			activeRepos: activeRepos.count || 0,
			teamStreak: streak,
			totalCommits: totalCommits.count || 0,
			currentWeek: { year, week },
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
		return NextResponse.json(
			{ error: "Failed to fetch stats" },
			{ status: 500 },
		);
	}
}
