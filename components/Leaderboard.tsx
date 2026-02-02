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
	const [weekInfo, setWeekInfo] = useState<{ year: number; week: number } | null>(null);

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

		const fetchStats = async () => {
			try {
				const res = await fetch("/api/stats");
				if (!res.ok) throw new Error("Failed to fetch");
				const data = await res.json();
				if (data.currentWeek) {
					setWeekInfo(data.currentWeek);
				}
			} catch (err) {
				console.error("Error fetching stats:", err);
			}
		};

		fetchLeaderboard();
		fetchStats();

		const interval = setInterval(() => {
			fetchLeaderboard();
			fetchStats();
		}, 60000);
		return () => clearInterval(interval);
	}, []);

	const getMedalEmoji = (index: number) => {
		if (index === 0) return "🥇";
		if (index === 1) return "🥈";
		if (index === 2) return "🥉";
		return null;
	};

	return (
		<section id="leaderboard" className="py-12 md:py-20 px-4 md:px-6 bg-[#171717]/20">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 md:mb-8">
					<h2 className="text-2xl md:text-3xl font-black text-white mb-2">Weekly Leaderboard</h2>
					<p className="text-sm md:text-base text-[#737373]">
						{weekInfo
							? `This week's top shippers (Week ${weekInfo.week}, ${weekInfo.year})`
							: "This week's top shippers"}
					</p>
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
						<div className="relative overflow-hidden p-4 md:p-8 border bg-gradient-to-br from-[#FFD800]/10 to-[#FFD800]/5 border-[#FFD800]/30 mb-4">
							<div className="absolute top-0 right-0 w-40 h-40 bg-[#FFD800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
							<div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
								<div className="text-4xl md:text-5xl">🥇</div>
								{leaderboard[0].avatarUrl ? (
									<img
										src={leaderboard[0].avatarUrl}
										alt={leaderboard[0].name}
										className="w-20 h-20 md:w-24 md:h-24 rounded-full ring-4 ring-[#FFD800]/20"
									/>
								) : (
									<div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-2xl md:text-3xl rounded-full">
										{leaderboard[0].name[0]?.toUpperCase() || "?"}
									</div>
								)}
								<div className="flex-1 text-center sm:text-left">
									<div className="text-2xl md:text-3xl font-black text-white mb-2">{leaderboard[0].name}</div>
									<div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-6 text-base md:text-lg">
										<span className="font-bold text-[#FFD800]">{leaderboard[0].commits} commits</span>
										<div className="flex items-center gap-3 md:gap-4">
											<span className="text-green-500 font-mono text-sm md:text-base">+{formatNumber(leaderboard[0].additions)}</span>
											<span className="text-red-500 font-mono text-sm md:text-base">-{formatNumber(leaderboard[0].deletions)}</span>
										</div>
									</div>
								</div>
								<div className="sm:absolute top-4 md:top-6 right-4 md:right-6 px-3 md:px-4 py-1.5 md:py-2 bg-[#FFD800] text-[#0A0A0A] text-xs md:text-sm font-black uppercase tracking-wider">
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
											className="relative overflow-hidden p-4 md:p-6 bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors"
										>
											<div className="flex items-center gap-3 md:gap-4">
												<div className="text-3xl md:text-4xl flex-shrink-0">{medal}</div>
												{member.avatarUrl ? (
													<img
														src={member.avatarUrl}
														alt={member.name}
														className="w-14 h-14 md:w-16 md:h-16 rounded-full ring-2 ring-[#262626] flex-shrink-0"
													/>
												) : (
													<div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-lg md:text-xl rounded-full flex-shrink-0">
														{member.name[0]?.toUpperCase() || "?"}
													</div>
												)}
												<div className="flex-1 min-w-0">
													<div className="text-lg md:text-xl font-black text-white mb-1 truncate">{member.name}</div>
													<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs md:text-sm">
														<span className="font-bold text-white">{member.commits} commits</span>
														<div className="flex items-center gap-2 md:gap-3">
															<span className="text-green-500 font-mono">+{formatNumber(member.additions)}</span>
															<span className="text-red-500 font-mono">-{formatNumber(member.deletions)}</span>
														</div>
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
											className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors"
										>
											<div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-[#262626] text-[#737373] font-bold text-sm md:text-base flex-shrink-0">
												{position}
											</div>
											{member.avatarUrl ? (
												<img
													src={member.avatarUrl}
													alt={member.name}
													className="w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 ring-[#262626] flex-shrink-0"
												/>
											) : (
												<div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-sm md:text-base rounded-full flex-shrink-0">
													{member.name[0]?.toUpperCase() || "?"}
												</div>
											)}
											<div className="flex-1 min-w-0">
												<div className="font-bold text-white text-sm md:text-base truncate">{member.name}</div>
												<div className="text-xs md:text-sm text-[#737373]">
													{member.commits} commits • <span className="text-green-500">+{formatNumber(member.additions)}</span> <span className="text-red-500">-{formatNumber(member.deletions)}</span>
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
