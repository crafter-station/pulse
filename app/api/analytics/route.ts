import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commits } from "@/lib/db/schema";
import { sql, gte, and, lt } from "drizzle-orm";
import { getPeruWeekStart, PERU_UTC_OFFSET } from "@/lib/utils/time";

function getPeruPrevWeekStart(): Date {
	const weekStart = getPeruWeekStart();
	return new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
}

function pctChange(current: number, previous: number): number {
	if (previous === 0) return current > 0 ? 100 : 0;
	return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
	try {
		const weekStart = getPeruWeekStart();
		const prevWeekStart = getPeruPrevWeekStart();

		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

		// YTD start: Jan 1 2026, 00:00 Peru time -> UTC
		const ytdPeruMidnight = new Date(2026, 0, 1, 0, 0, 0, 0);
		const ytdStart = new Date(ytdPeruMidnight.getTime() - PERU_UTC_OFFSET * 60 * 60 * 1000);

		const [
			currentWeekStats,
			prevWeekStats,
			currentMonthStats,
			prevMonthStats,
			ytdStats,
			weeklyChartData,
			currentWeekContributors,
			prevWeekContributors,
			newContributorsThisMonth,
			topGrowingRepos,
			cumulativeMonthly,
		] = await Promise.all([
			// Current week stats
			db
				.select({
					commits: sql<number>`count(*)::int`,
					additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
					deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
					contributors: sql<number>`count(distinct ${commits.authorUsername})::int`,
				})
				.from(commits)
				.where(gte(commits.pushedAt, weekStart))
				.then((r) => r[0]),

			// Previous week stats
			db
				.select({
					commits: sql<number>`count(*)::int`,
					additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
					deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
					contributors: sql<number>`count(distinct ${commits.authorUsername})::int`,
				})
				.from(commits)
				.where(and(gte(commits.pushedAt, prevWeekStart), lt(commits.pushedAt, weekStart)))
				.then((r) => r[0]),

			// Current 30 days
			db
				.select({
					commits: sql<number>`count(*)::int`,
					additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
					deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
				})
				.from(commits)
				.where(gte(commits.pushedAt, thirtyDaysAgo))
				.then((r) => r[0]),

			// Previous 30 days
			db
				.select({
					commits: sql<number>`count(*)::int`,
					additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
					deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
				})
				.from(commits)
				.where(and(gte(commits.pushedAt, sixtyDaysAgo), lt(commits.pushedAt, thirtyDaysAgo)))
				.then((r) => r[0]),

			// YTD totals
			db
				.select({
					commits: sql<number>`count(*)::int`,
					additions: sql<number>`coalesce(sum(${commits.additions}), 0)::int`,
					deletions: sql<number>`coalesce(sum(${commits.deletions}), 0)::int`,
				})
				.from(commits)
				.where(gte(commits.pushedAt, ytdStart))
				.then((r) => r[0]),

			// Weekly chart data: last 12 weeks
			db
				.select({
					week: sql<string>`to_char(date_trunc('week', ${commits.pushedAt} AT TIME ZONE 'America/Lima'), 'YYYY-MM-DD')`,
					commits: sql<number>`count(*)::int`,
				})
				.from(commits)
				.where(
					gte(
						commits.pushedAt,
						new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000),
					),
				)
				.groupBy(
					sql`date_trunc('week', ${commits.pushedAt} AT TIME ZONE 'America/Lima')`,
				)
				.orderBy(
					sql`date_trunc('week', ${commits.pushedAt} AT TIME ZONE 'America/Lima')`,
				),

			// Current week contributors (distinct)
			db
				.select({
					count: sql<number>`count(distinct ${commits.authorUsername})::int`,
				})
				.from(commits)
				.where(gte(commits.pushedAt, weekStart))
				.then((r) => r[0]),

			// Previous week contributors (distinct)
			db
				.select({
					count: sql<number>`count(distinct ${commits.authorUsername})::int`,
				})
				.from(commits)
				.where(and(gte(commits.pushedAt, prevWeekStart), lt(commits.pushedAt, weekStart)))
				.then((r) => r[0]),

			// New contributors this month (first commit in the last 30 days)
			db
				.execute(
					sql`SELECT count(*)::int as count FROM (
						SELECT ${commits.authorUsername}, min(${commits.pushedAt}) as first_commit
						FROM ${commits}
						GROUP BY ${commits.authorUsername}
					) sub WHERE sub.first_commit >= ${thirtyDaysAgo}`,
				)
				.then((r) => ({ count: Number((r.rows[0] as { count: number })?.count ?? 0) })),

			// Top 3 growing repos by WoW commit increase
			db.execute(sql`
				WITH current_week AS (
					SELECT repo_name, count(*)::int as commits
					FROM commits
					WHERE pushed_at >= ${weekStart}
					GROUP BY repo_name
				),
				prev_week AS (
					SELECT repo_name, count(*)::int as commits
					FROM commits
					WHERE pushed_at >= ${prevWeekStart} AND pushed_at < ${weekStart}
					GROUP BY repo_name
				)
				SELECT
					coalesce(c.repo_name, p.repo_name) as repo_name,
					coalesce(c.commits, 0) as current_commits,
					coalesce(p.commits, 0) as prev_commits,
					coalesce(c.commits, 0) - coalesce(p.commits, 0) as growth
				FROM current_week c
				FULL OUTER JOIN prev_week p ON c.repo_name = p.repo_name
				ORDER BY growth DESC
				LIMIT 3
			`),

			// Cumulative monthly commits YTD
			db
				.select({
					month: sql<string>`to_char(date_trunc('month', ${commits.pushedAt} AT TIME ZONE 'America/Lima'), 'YYYY-MM')`,
					commits: sql<number>`count(*)::int`,
				})
				.from(commits)
				.where(gte(commits.pushedAt, ytdStart))
				.groupBy(
					sql`date_trunc('month', ${commits.pushedAt} AT TIME ZONE 'America/Lima')`,
				)
				.orderBy(
					sql`date_trunc('month', ${commits.pushedAt} AT TIME ZONE 'America/Lima')`,
				),
		]);

		const currentNetLines =
			(currentWeekStats.additions || 0) - (currentWeekStats.deletions || 0);
		const prevNetLines =
			(prevWeekStats.additions || 0) - (prevWeekStats.deletions || 0);

		const avgCommitsPerContributor =
			currentWeekContributors.count > 0
				? Math.round((currentWeekStats.commits || 0) / currentWeekContributors.count)
				: 0;

		// Format weekly chart labels
		const chartData = weeklyChartData.map((w) => {
			const d = new Date(w.week);
			const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
			return { week: label, commits: w.commits };
		});

		// Format top growing repos
		const topRepos = (topGrowingRepos.rows as Array<{
			repo_name: string;
			current_commits: number;
			prev_commits: number;
			growth: number;
		}>).map((r) => ({
			name: r.repo_name,
			currentCommits: Number(r.current_commits),
			prevCommits: Number(r.prev_commits),
			growth: Number(r.growth),
		}));

		// Cumulative monthly data
		let runningTotal = 0;
		const cumulativeData = cumulativeMonthly.map((m) => {
			runningTotal += m.commits;
			const d = new Date(m.month + "-01");
			const label = d.toLocaleDateString("en-US", { month: "short" });
			return { month: label, commits: m.commits, cumulative: runningTotal };
		});

		return NextResponse.json({
			wow: {
				commits: {
					current: currentWeekStats.commits || 0,
					previous: prevWeekStats.commits || 0,
					change: pctChange(currentWeekStats.commits || 0, prevWeekStats.commits || 0),
				},
				additions: {
					current: currentWeekStats.additions || 0,
					previous: prevWeekStats.additions || 0,
					change: pctChange(
						currentWeekStats.additions || 0,
						prevWeekStats.additions || 0,
					),
				},
				deletions: {
					current: currentWeekStats.deletions || 0,
					previous: prevWeekStats.deletions || 0,
					change: pctChange(
						currentWeekStats.deletions || 0,
						prevWeekStats.deletions || 0,
					),
				},
				contributors: {
					current: currentWeekContributors.count || 0,
					previous: prevWeekContributors.count || 0,
					change: pctChange(
						currentWeekContributors.count || 0,
						prevWeekContributors.count || 0,
					),
				},
			},
			mom: {
				commits: {
					current: currentMonthStats.commits || 0,
					previous: prevMonthStats.commits || 0,
					change: pctChange(
						currentMonthStats.commits || 0,
						prevMonthStats.commits || 0,
					),
				},
				additions: {
					current: currentMonthStats.additions || 0,
					previous: prevMonthStats.additions || 0,
					change: pctChange(
						currentMonthStats.additions || 0,
						prevMonthStats.additions || 0,
					),
				},
				deletions: {
					current: currentMonthStats.deletions || 0,
					previous: prevMonthStats.deletions || 0,
					change: pctChange(
						currentMonthStats.deletions || 0,
						prevMonthStats.deletions || 0,
					),
				},
			},
			ytd: {
				commits: ytdStats.commits || 0,
				additions: ytdStats.additions || 0,
				deletions: ytdStats.deletions || 0,
			},
			weeklyChart: chartData,
			velocity: {
				netLines: currentNetLines,
				prevNetLines: prevNetLines,
				change: pctChange(currentNetLines, prevNetLines),
				avgCommitsPerContributor,
			},
			contributorTrends: {
				activeWoWChange: pctChange(
					currentWeekContributors.count || 0,
					prevWeekContributors.count || 0,
				),
				newThisMonth: newContributorsThisMonth.count || 0,
			},
			topGrowingRepos: topRepos,
			cumulativeMonthly: cumulativeData,
		});
	} catch (error) {
		console.error("Analytics API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 },
		);
	}
}
