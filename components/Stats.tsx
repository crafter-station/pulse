"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils/format";
import { Heatmap } from "./Heatmap";

interface StatsData {
	commitsToday: number;
	activeRepos: number;
	teamStreak: number;
	totalCommits: number;
	weekStats: {
		commits: number;
		additions: number;
		deletions: number;
	};
	monthStats: {
		commits: number;
		additions: number;
		deletions: number;
	};
	activeContributors: number;
}

export function Stats() {
	const [stats, setStats] = useState<StatsData>({
		commitsToday: 0,
		activeRepos: 0,
		teamStreak: 0,
		totalCommits: 0,
		weekStats: { commits: 0, additions: 0, deletions: 0 },
		monthStats: { commits: 0, additions: 0, deletions: 0 },
		activeContributors: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const res = await fetch("/api/stats");
				if (!res.ok) throw new Error("Failed to fetch");
				const data = await res.json();
				setStats(data);
			} catch (err) {
				console.error("Error fetching stats:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();

		const interval = setInterval(fetchStats, 60000);
		return () => clearInterval(interval);
	}, []);

	return (
		<section className="py-12 md:py-16 px-4 md:px-6">
			<div className="mx-auto max-w-7xl">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
					<div className="relative overflow-hidden bg-gradient-to-br from-[#FFD800]/10 to-[#FFD800]/5 border border-[#FFD800]/20 p-4 md:p-6">
						<div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
						<div className="relative">
							<div className="text-xs md:text-sm text-[#FFD800] font-medium uppercase tracking-wider mb-2">Today</div>
							<div className="text-2xl md:text-4xl font-black text-white mb-1">
								{loading ? "—" : formatNumber(stats.commitsToday)}
							</div>
							<div className="text-xs md:text-sm text-[#A3A3A3]">Commits shipped</div>
						</div>
					</div>

					<div className="bg-[#171717] border border-[#262626] p-4 md:p-6 hover:border-[#333] transition-colors">
						<div className="text-xs md:text-sm text-[#737373] font-medium uppercase tracking-wider mb-2">Streak</div>
						<div className="text-2xl md:text-4xl font-black text-white mb-1">
							{loading ? "—" : `${formatNumber(stats.teamStreak)}`}
						</div>
						<div className="text-xs md:text-sm text-[#A3A3A3]">Days shipping</div>
					</div>

					<div className="bg-[#171717] border border-[#262626] p-4 md:p-6 hover:border-[#333] transition-colors">
						<div className="text-xs md:text-sm text-[#737373] font-medium uppercase tracking-wider mb-2">Active</div>
						<div className="text-2xl md:text-4xl font-black text-white mb-1">
							{loading ? "—" : formatNumber(stats.activeRepos)}
						</div>
						<div className="text-xs md:text-sm text-[#A3A3A3]">Repos this week</div>
					</div>

					<div className="bg-[#171717] border border-[#262626] p-4 md:p-6 hover:border-[#333] transition-colors">
						<div className="text-xs md:text-sm text-[#737373] font-medium uppercase tracking-wider mb-2">Contributors</div>
						<div className="text-2xl md:text-4xl font-black text-white mb-1">
							{loading ? "—" : formatNumber(stats.activeContributors)}
						</div>
						<div className="text-xs md:text-sm text-[#A3A3A3]">Active this week</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
					<div className="bg-[#171717] border border-[#262626] p-4 md:p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-base md:text-lg font-bold text-white">Last 7 Days</h3>
							<span className="text-xs md:text-sm text-[#737373] font-mono">{formatNumber(stats.weekStats.commits)} commits</span>
						</div>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm text-[#A3A3A3]">Lines added</span>
								<span className="text-base md:text-lg font-bold text-green-500">+{formatNumber(stats.weekStats.additions)}</span>
							</div>
							<div className="h-px bg-[#262626]" />
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm text-[#A3A3A3]">Lines removed</span>
								<span className="text-base md:text-lg font-bold text-red-500">-{formatNumber(stats.weekStats.deletions)}</span>
							</div>
							<div className="h-px bg-[#262626]" />
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm text-[#A3A3A3]">Net change</span>
								<span className="text-base md:text-lg font-bold text-white">
									{formatNumber(stats.weekStats.additions - stats.weekStats.deletions)}
								</span>
							</div>
						</div>
					</div>

					<div className="bg-[#171717] border border-[#262626] p-4 md:p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-base md:text-lg font-bold text-white">Last 30 Days</h3>
							<span className="text-xs md:text-sm text-[#737373] font-mono">{formatNumber(stats.monthStats.commits)} commits</span>
						</div>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm text-[#A3A3A3]">Lines added</span>
								<span className="text-base md:text-lg font-bold text-green-500">+{formatNumber(stats.monthStats.additions)}</span>
							</div>
							<div className="h-px bg-[#262626]" />
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm text-[#A3A3A3]">Lines removed</span>
								<span className="text-base md:text-lg font-bold text-red-500">-{formatNumber(stats.monthStats.deletions)}</span>
							</div>
							<div className="h-px bg-[#262626]" />
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm text-[#A3A3A3]">Net change</span>
								<span className="text-base md:text-lg font-bold text-white">
									{formatNumber(stats.monthStats.additions - stats.monthStats.deletions)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-3 md:mt-4">
					<Heatmap />
				</div>

				<div className="mt-3 md:mt-4 bg-[#0A0A0A] border border-[#262626] p-4 md:p-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
						<div>
							<div className="text-xs md:text-sm text-[#737373] mb-1">All-time commits</div>
							<div className="text-2xl md:text-3xl font-black text-white font-mono">{loading ? "—" : formatNumber(stats.totalCommits)}</div>
						</div>
						<div className="text-xs text-[#737373]">
							Since inception
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
