"use client";

import { useEffect, useState } from "react";

interface StatsData {
	commitsToday: number;
	activeRepos: number;
	teamStreak: number;
}

export function Stats() {
	const [stats, setStats] = useState<StatsData>({
		commitsToday: 0,
		activeRepos: 0,
		teamStreak: 0,
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

	const statItems = [
		{ label: "Commits today", value: stats.commitsToday.toString() },
		{ label: "Active repos", value: stats.activeRepos.toString() },
		{ label: "Team streak", value: `${stats.teamStreak} days` },
	];

	return (
		<section className="py-12 px-6 border-y border-[#262626] bg-[#171717]/50">
			<div className="mx-auto max-w-6xl">
				<div className="grid grid-cols-3 gap-8">
					{statItems.map((stat) => (
						<div key={stat.label} className="text-center">
							<div className="text-4xl font-black text-white mb-2">
								{loading ? "—" : stat.value}
							</div>
							<div className="text-sm text-[#737373] uppercase tracking-wide">{stat.label}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
