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

	const getMedalEmoji = (index: number) => {
		if (index === 0) return "🥇";
		if (index === 1) return "🥈";
		if (index === 2) return "🥉";
		return null;
	};

	return (
		<section id="leaderboard" className="py-20 px-6 bg-[#171717]/20">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8">
					<h2 className="text-3xl font-black text-white mb-2">Weekly Leaderboard</h2>
					<p className="text-[#737373]">Top shippers in the last 7 days</p>
				</div>
				{loading ? (
					<div className="space-y-4">
						<div className="h-32 bg-[#171717] border border-[#262626] animate-pulse" />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{[...Array(2)].map((_, i) => (
								<div key={i} className="h-32 bg-[#171717] border border-[#262626] animate-pulse" />
							))}
						</div>
					</div>
				) : leaderboard.length === 0 ? (
					<div className="text-center py-20 border border-[#262626] bg-[#171717]/30">
						<div className="text-6xl mb-4">🏆</div>
						<div className="text-xl text-white font-bold mb-2">No data yet</div>
						<div className="text-[#737373]">Start shipping to appear on the leaderboard!</div>
					</div>
				) : (
					<>
						<div className="relative overflow-hidden p-8 border bg-gradient-to-br from-[#FFD800]/10 to-[#FFD800]/5 border-[#FFD800]/30 mb-4">
							<div className="absolute top-0 right-0 w-40 h-40 bg-[#FFD800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
							<div className="relative flex items-center gap-6">
								<div className="text-5xl">🥇</div>
								{leaderboard[0].avatarUrl ? (
									<img
										src={leaderboard[0].avatarUrl}
										alt={leaderboard[0].name}
										className="w-24 h-24 rounded-full ring-4 ring-[#FFD800]/20"
									/>
								) : (
									<div className="w-24 h-24 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-3xl rounded-full">
										{leaderboard[0].name[0]?.toUpperCase() || "?"}
									</div>
								)}
								<div className="flex-1">
									<div className="text-3xl font-black text-white mb-2">{leaderboard[0].name}</div>
									<div className="flex items-center gap-6 text-lg">
										<span className="font-bold text-[#FFD800]">{leaderboard[0].commits} commits</span>
										<span className="text-[#FFD800] font-mono">+{formatNumber(leaderboard[0].additions)}</span>
										<span className="text-red-500 font-mono">-{formatNumber(leaderboard[0].deletions)}</span>
									</div>
								</div>
								<div className="absolute top-6 right-6 px-4 py-2 bg-[#FFD800] text-[#0A0A0A] text-sm font-black uppercase tracking-wider">
									Top Shipper
								</div>
							</div>
						</div>

						{leaderboard.length > 1 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								{leaderboard.slice(1, 3).map((member, i) => {
									const position = i + 2;
									const medal = getMedalEmoji(position - 1);

									return (
										<div
											key={member.name}
											className="relative overflow-hidden p-6 bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors"
										>
											<div className="flex items-center gap-4">
												<div className="text-4xl">{medal}</div>
												{member.avatarUrl ? (
													<img
														src={member.avatarUrl}
														alt={member.name}
														className="w-16 h-16 rounded-full ring-2 ring-[#262626]"
													/>
												) : (
													<div className="w-16 h-16 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-xl rounded-full">
														{member.name[0]?.toUpperCase() || "?"}
													</div>
												)}
												<div className="flex-1">
													<div className="text-xl font-black text-white mb-1">{member.name}</div>
													<div className="flex items-center gap-3 text-sm">
														<span className="font-bold text-white">{member.commits} commits</span>
														<span className="text-[#FFD800] font-mono">+{formatNumber(member.additions)}</span>
														<span className="text-red-500 font-mono">-{formatNumber(member.deletions)}</span>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}

						{leaderboard.length > 3 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{leaderboard.slice(3).map((member, i) => {
									const position = i + 4;
									return (
										<div
											key={member.name}
											className="flex items-center gap-4 p-4 bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors"
										>
											<div className="w-10 h-10 flex items-center justify-center bg-[#262626] text-[#737373] font-bold">
												{position}
											</div>
											{member.avatarUrl ? (
												<img
													src={member.avatarUrl}
													alt={member.name}
													className="w-12 h-12 rounded-full ring-2 ring-[#262626]"
												/>
											) : (
												<div className="w-12 h-12 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold rounded-full">
													{member.name[0]?.toUpperCase() || "?"}
												</div>
											)}
											<div className="flex-1">
												<div className="font-bold text-white">{member.name}</div>
												<div className="text-sm text-[#737373]">
													{member.commits} commits • <span className="text-[#FFD800]">+{formatNumber(member.additions)}</span> <span className="text-red-500">-{formatNumber(member.deletions)}</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</>
				)}
			</div>
		</section>
	);
}
