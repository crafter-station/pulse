"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils/format";

interface Activity {
	repo: string;
	author: string;
	message: string;
	time: string;
	additions: number;
	deletions: number;
	commitUrl: string;
}

export function ActivityFeed() {
	const [activity, setActivity] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const fetchActivity = async () => {
			try {
				const res = await fetch("/api/activity");
				if (!res.ok) throw new Error("Failed to fetch");
				const data = await res.json();
				setActivity(data);
				setError(false);
			} catch (err) {
				console.error("Error fetching activity:", err);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		fetchActivity();

		const interval = setInterval(fetchActivity, 30000);
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return (
			<section id="activity" className="py-20 px-6">
				<div className="mx-auto max-w-6xl">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-2xl font-bold text-white">Recent Activity</h2>
						<div className="flex items-center gap-2 text-sm text-[#737373]">
							<span className="w-2 h-2 bg-gray-500 rounded-full" />
							Loading...
						</div>
					</div>
					<div className="space-y-3">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="h-20 bg-[#171717] border border-[#262626] animate-pulse" />
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section id="activity" className="py-20 px-6">
			<div className="mx-auto max-w-6xl">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-2xl font-bold text-white">Recent Activity</h2>
					<div className="flex items-center gap-2 text-sm text-[#737373]">
						<span className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
						{error ? "Error" : "Live"}
					</div>
				</div>
				{activity.length === 0 ? (
					<div className="text-center py-12 text-[#737373]">
						No activity yet. Push to main to see it here!
					</div>
				) : (
					<div className="space-y-3">
						{activity.map((item, i) => (
							<div
								key={i}
								className="flex items-center gap-4 p-4 bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors"
							>
								<div className="w-10 h-10 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-sm">
									{item.author[0]?.toUpperCase() || "?"}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-semibold text-white">{item.author}</span>
										<span className="text-[#737373]">pushed to</span>
										<span className="px-2 py-0.5 text-xs font-medium bg-[#FFD800]/10 text-[#FFD800] border border-[#FFD800]/20">
											{item.repo}
										</span>
									</div>
									<p className="text-sm text-[#A3A3A3] font-mono truncate">{item.message}</p>
								</div>
								<div className="flex items-center gap-4 text-xs">
									<span className="text-green-500">+{formatNumber(item.additions)}</span>
									<span className="text-red-500">-{formatNumber(item.deletions)}</span>
									<span className="text-[#737373]">{item.time}</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
