"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils/format";

interface Activity {
	repo: string;
	author: string;
	avatarUrl: string | null;
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
			<section id="activity" className="py-20 px-6 bg-[#0A0A0A]">
				<div className="mx-auto max-w-7xl">
					<div className="flex items-center justify-between mb-8">
						<div>
							<h2 className="text-3xl font-black text-white mb-2">Recent Activity</h2>
							<p className="text-[#737373]">Live feed of all commits to main</p>
						</div>
						<div className="flex items-center gap-2 px-4 py-2 bg-[#171717] border border-[#262626]">
							<span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
							<span className="text-sm text-[#737373]">Loading...</span>
						</div>
					</div>
					<div className="space-y-2">
						{[...Array(8)].map((_, i) => (
							<div key={i} className="h-24 bg-[#171717]/50 border border-[#262626] animate-pulse" />
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section id="activity" className="py-20 px-6 bg-[#0A0A0A]">
			<div className="mx-auto max-w-7xl">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h2 className="text-3xl font-black text-white mb-2">Recent Activity</h2>
						<p className="text-[#737373]">Live feed of all commits to main</p>
					</div>
					<div className="flex items-center gap-2 px-4 py-2 bg-[#171717] border border-[#262626]">
						<span className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
						<span className="text-sm text-[#737373]">{error ? "Error" : "Live"}</span>
					</div>
				</div>
				{activity.length === 0 ? (
					<div className="text-center py-20 border border-[#262626] bg-[#171717]/30">
						<div className="text-6xl mb-4">🚀</div>
						<div className="text-xl text-white font-bold mb-2">No activity yet</div>
						<div className="text-[#737373]">Push to main to see it here!</div>
					</div>
				) : (
					<div className="space-y-2">
						{activity.map((item, i) => (
							<a
								key={i}
								href={item.commitUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-start gap-4 p-5 bg-[#171717] border border-[#262626] hover:border-[#FFD800]/30 hover:bg-[#171717] transition-all"
							>
								<div className="flex-shrink-0 pt-1">
									{item.avatarUrl ? (
										<img
											src={item.avatarUrl}
											alt={item.author}
											className="w-12 h-12 rounded-full ring-2 ring-[#262626] group-hover:ring-[#FFD800]/30 transition-all"
										/>
									) : (
										<div className="w-12 h-12 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-lg rounded-full ring-2 ring-[#262626] group-hover:ring-[#FFD800]/30 transition-all">
											{item.author[0]?.toUpperCase() || "?"}
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-2 flex-wrap">
										<span className="font-bold text-white">{item.author}</span>
										<span className="text-[#737373]">pushed to</span>
										<span className="px-2 py-1 text-xs font-bold bg-[#FFD800]/10 text-[#FFD800] border border-[#FFD800]/20 font-mono">
											{item.repo}
										</span>
										<span className="text-[#737373] text-sm ml-auto">{item.time}</span>
									</div>
									<p className="text-[#A3A3A3] font-mono text-sm mb-3 line-clamp-2">
										{item.message}
									</p>
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20">
											<span className="text-xs font-bold text-green-500">+{formatNumber(item.additions)}</span>
										</div>
										<div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20">
											<span className="text-xs font-bold text-red-500">-{formatNumber(item.deletions)}</span>
										</div>
										<div className="ml-auto text-xs text-[#737373] group-hover:text-[#FFD800] transition-colors">
											View commit →
										</div>
									</div>
								</div>
							</a>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
