"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils/format";

interface LeaderboardMember {
	name: string;
	commits: number;
	additions: number;
	deletions: number;
	avatarUrl?: string;
}

export function Leaderboard() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchLeaderboard = async () => {
			try {
				const res = await fetch("/api/leaderboard");
				if (!res.ok) throw new Error("Failed to fetch");
				const data = await res.json();
				setLeaderboard(data);
			} catch (err) {
				console.error("Error fetching leaderboard:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchLeaderboard();

		const interval = setInterval(fetchLeaderboard, 60000);
		return () => clearInterval(interval);
	}, []);

	return (
		<section id="leaderboard" className="py-20 px-6 bg-[#171717]/30">
			<div className="mx-auto max-w-6xl">
				<h2 className="text-2xl font-bold text-white mb-8">Weekly Leaderboard</h2>
				{loading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-20 bg-[#171717] border border-[#262626] animate-pulse" />
						))}
					</div>
				) : leaderboard.length === 0 ? (
					<div className="text-center py-12 text-[#737373]">
						No data yet. Start shipping to appear on the leaderboard!
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{leaderboard.map((member, i) => (
							<div
								key={member.name}
								className={`flex items-center gap-4 p-5 border ${
									i === 0
										? "bg-[#FFD800]/5 border-[#FFD800]/30"
										: "bg-[#171717] border-[#262626]"
								}`}
							>
								<div
									className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${
										i === 0
											? "bg-[#FFD800] text-[#0A0A0A]"
											: "bg-[#262626] text-[#737373]"
									}`}
								>
									{i + 1}
								</div>
								{member.avatarUrl ? (
									<img
										src={member.avatarUrl}
										alt={member.name}
										className="w-12 h-12 rounded-full"
									/>
								) : (
									<div className="w-12 h-12 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold">
										{member.name[0]?.toUpperCase() || "?"}
									</div>
								)}
								<div className="flex-1">
									<div className="font-semibold text-white">{member.name}</div>
									<div className="text-sm text-[#737373]">
										{member.commits} commits • <span className="text-green-500">+{formatNumber(member.additions)}</span> <span className="text-red-500">-{formatNumber(member.deletions)}</span>
									</div>
								</div>
								{i === 0 && (
									<span className="px-3 py-1 text-xs font-semibold bg-[#FFD800] text-[#0A0A0A]">
										TOP SHIPPER
									</span>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
