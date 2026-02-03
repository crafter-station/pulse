"use client";

import { formatNumber } from "@/lib/utils/format";
import { useEffect, useState } from "react";

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

type ViewMode = "compact" | "detailed";

export function ActivityFeed() {
	const [activity, setActivity] = useState<Activity[]>([]);
	const [filteredActivity, setFilteredActivity] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("compact");
	const [selectedRepo, setSelectedRepo] = useState<string>("all");
	const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchActivity = async () => {
			try {
				const res = await fetch("/api/activity");
				if (!res.ok) throw new Error("Failed to fetch");
				const data = await res.json();
				setActivity(data);
				setFilteredActivity(data);
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

	useEffect(() => {
		let filtered = activity;

		if (selectedRepo !== "all") {
			filtered = filtered.filter((item) => item.repo === selectedRepo);
		}

		if (selectedAuthor !== "all") {
			filtered = filtered.filter((item) => item.author === selectedAuthor);
		}

		if (searchQuery) {
			filtered = filtered.filter((item) =>
				item.message.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		setFilteredActivity(filtered);
	}, [activity, selectedRepo, selectedAuthor, searchQuery]);

	const repos = ["all", ...Array.from(new Set(activity.map((item) => item.repo)))];
	const authors = ["all", ...Array.from(new Set(activity.map((item) => item.author)))];

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
							<div key={i} className="h-16 bg-[#171717]/50 border border-[#262626] animate-pulse" />
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section id="activity" className="py-12 md:py-20 px-4 md:px-6 bg-[#0A0A0A] scroll-mt-8">
			<div className="mx-auto max-w-7xl">
				<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
					<div>
						<h2 className="text-2xl md:text-3xl font-black text-white mb-2">Recent Activity</h2>
						<p className="text-sm md:text-base text-[#737373]">
							{filteredActivity.length} {filteredActivity.length === 1 ? "commit" : "commits"}
						</p>
					</div>
					<div className="flex items-center gap-2 md:gap-3">
						<div className="flex gap-1 md:gap-2 bg-[#171717] border border-[#262626] p-1">
							<button
								onClick={() => setViewMode("compact")}
								className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold transition-colors ${
									viewMode === "compact"
										? "bg-[#FFD800] text-[#0A0A0A]"
										: "text-[#737373] hover:text-white"
								}`}
							>
								COMPACT
							</button>
							<button
								onClick={() => setViewMode("detailed")}
								className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold transition-colors ${
									viewMode === "detailed"
										? "bg-[#FFD800] text-[#0A0A0A]"
										: "text-[#737373] hover:text-white"
								}`}
							>
								DETAILED
							</button>
						</div>
						<div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#171717] border border-[#262626]">
							<span className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
							<span className="text-xs md:text-sm text-[#737373]">{error ? "Error" : "Live"}</span>
						</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-6">
					<input
						type="text"
						placeholder="Search commits..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1 min-w-[200px] px-4 py-2 bg-[#171717] border border-[#262626] text-white placeholder-[#737373] focus:border-[#FFD800] focus:outline-none font-mono text-sm"
					/>
					<select
						value={selectedRepo}
						onChange={(e) => setSelectedRepo(e.target.value)}
						className="px-4 py-2 bg-[#171717] border border-[#262626] text-white focus:border-[#FFD800] focus:outline-none font-mono text-sm"
					>
						{repos.map((repo) => (
							<option key={repo} value={repo}>
								{repo === "all" ? "All repos" : repo}
							</option>
						))}
					</select>
					<select
						value={selectedAuthor}
						onChange={(e) => setSelectedAuthor(e.target.value)}
						className="px-4 py-2 bg-[#171717] border border-[#262626] text-white focus:border-[#FFD800] focus:outline-none font-mono text-sm"
					>
						{authors.map((author) => (
							<option key={author} value={author}>
								{author === "all" ? "All authors" : author}
							</option>
						))}
					</select>
					{(selectedRepo !== "all" || selectedAuthor !== "all" || searchQuery) && (
						<button
							onClick={() => {
								setSelectedRepo("all");
								setSelectedAuthor("all");
								setSearchQuery("");
							}}
							className="px-4 py-2 border border-[#FFD800]/30 text-[#FFD800] hover:bg-[#FFD800]/10 transition-colors text-sm font-bold"
						>
							CLEAR
						</button>
					)}
				</div>

				{filteredActivity.length === 0 ? (
					<div className="text-center py-20 border border-[#262626] bg-[#171717]/30">
						<div className="text-6xl mb-4">🔍</div>
						<div className="text-xl text-white font-bold mb-2">No commits found</div>
						<div className="text-[#737373]">Try adjusting your filters</div>
					</div>
				) : viewMode === "compact" ? (
					<div className="space-y-1">
						{filteredActivity.map((item, i) => (
							<a
								key={i}
								href={item.commitUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 bg-[#171717] border border-[#262626] hover:border-[#FFD800]/30 transition-all"
							>
								{item.avatarUrl ? (
									<img
										src={item.avatarUrl}
										alt={item.author}
										className="w-7 h-7 md:w-8 md:h-8 rounded-full ring-1 ring-[#262626] flex-shrink-0"
									/>
								) : (
									<div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-xs rounded-full flex-shrink-0">
										{item.author[0]?.toUpperCase() || "?"}
									</div>
								)}
								<div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
									<div className="flex items-center gap-2 flex-shrink-0">
										<span className="font-bold text-white text-xs md:text-sm">{item.author}</span>
										<span className="px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-bold bg-[#FFD800]/10 text-[#FFD800] border border-[#FFD800]/20 font-mono">
											{item.repo}
										</span>
									</div>
									<span className="text-[#A3A3A3] text-xs md:text-sm font-mono truncate">{item.message}</span>
								</div>
								<div className="hidden sm:flex items-center gap-1.5 md:gap-2 text-xs flex-shrink-0">
									<span className="text-green-500 font-mono text-[10px] md:text-xs">+{formatNumber(item.additions)}</span>
									<span className="text-red-500 font-mono text-[10px] md:text-xs">-{formatNumber(item.deletions)}</span>
									<span className="text-[#737373] ml-1 md:ml-2 text-[10px] md:text-xs">{item.time}</span>
								</div>
							</a>
						))}
					</div>
				) : (
					<div className="space-y-2">
						{filteredActivity.map((item, i) => (
							<a
								key={i}
								href={item.commitUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-[#171717] border border-[#262626] hover:border-[#FFD800]/30 hover:bg-[#171717] transition-all"
							>
								<div className="flex-shrink-0 pt-0.5 md:pt-1">
									{item.avatarUrl ? (
										<img
											src={item.avatarUrl}
											alt={item.author}
											className="w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 ring-[#262626] group-hover:ring-[#FFD800]/30 transition-all"
										/>
									) : (
										<div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-base md:text-lg rounded-full ring-2 ring-[#262626] group-hover:ring-[#FFD800]/30 transition-all">
											{item.author[0]?.toUpperCase() || "?"}
										</div>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-2 flex-wrap">
										<span className="font-bold text-white text-sm md:text-base">{item.author}</span>
										<span className="text-[#737373] text-xs md:text-sm">pushed to</span>
										<span className="px-2 py-1 text-[10px] md:text-xs font-bold bg-[#FFD800]/10 text-[#FFD800] border border-[#FFD800]/20 font-mono">
											{item.repo}
										</span>
										<span className="text-[#737373] text-xs md:text-sm ml-auto">{item.time}</span>
									</div>
									<p className="text-[#A3A3A3] font-mono text-xs md:text-sm mb-3 line-clamp-2">
										{item.message}
									</p>
									<div className="flex items-center gap-2 md:gap-4 flex-wrap">
										<div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 bg-green-500/10 border border-green-500/20">
											<span className="text-[10px] md:text-xs font-bold text-green-500">+{formatNumber(item.additions)}</span>
										</div>
										<div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 bg-red-500/10 border border-red-500/20">
											<span className="text-[10px] md:text-xs font-bold text-red-500">-{formatNumber(item.deletions)}</span>
										</div>
										<div className="ml-auto text-[10px] md:text-xs text-[#737373] group-hover:text-[#FFD800] transition-colors">
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
