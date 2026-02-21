"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
	isPrivate: boolean;
}

type ViewMode = "compact" | "detailed";

const LockIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
		<path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
	</svg>
);

const PrivateBadge = () => (
	<span className="px-1.5 py-0.5 text-[10px] font-black bg-[#737373]/10 text-[#737373] border-2 border-[#737373]/20 flex items-center gap-1 uppercase tracking-wider">
		<LockIcon />
		Private
	</span>
);

const PAGE_SIZE = 20;

export function ActivityFeed() {
	const [activity, setActivity] = useState<Activity[]>([]);
	const [filteredActivity, setFilteredActivity] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [error, setError] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("compact");
	const [selectedRepo, setSelectedRepo] = useState<string>("all");
	const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const sentinelRef = useRef<HTMLDivElement>(null);

	const fetchActivity = useCallback(async (offset = 0, append = false) => {
		try {
			if (append) setLoadingMore(true);
			const res = await fetch(`/api/activity?offset=${offset}&limit=${PAGE_SIZE}`);
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setActivity((prev) => append ? [...prev, ...data.items] : data.items);
			setHasMore(data.hasMore);
			setError(false);
		} catch (err) {
			console.error("Error fetching activity:", err);
			if (!append) setError(true);
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	}, []);

	useEffect(() => {
		fetchActivity();
		const interval = setInterval(() => fetchActivity(), 30000);
		return () => clearInterval(interval);
	}, [fetchActivity]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loadingMore) {
					fetchActivity(activity.length, true);
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, activity.length, fetchActivity]);

	useEffect(() => {
		let filtered = activity;

		if (selectedRepo !== "all") {
			filtered = filtered.filter((item) => item.repo === selectedRepo);
		}

		if (selectedAuthor !== "all") {
			filtered = filtered.filter((item) => item.author === selectedAuthor);
		}

		if (searchQuery) {
			filtered = filtered.filter(
				(item) =>
					!item.isPrivate &&
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
							<h2 className="font-display text-3xl font-black text-white mb-2 uppercase">[Recent Activity]</h2>
							<p className="text-[#737373] uppercase tracking-widest font-mono text-sm">Live feed of all commits to main</p>
						</div>
						<div className="flex items-center gap-2 px-4 py-2 bg-[#171717] border-2 border-[#333]">
							<span className="w-2 h-2 bg-gray-500 animate-pulse" />
							<span className="text-sm text-[#737373] font-mono uppercase">Loading...</span>
						</div>
					</div>
					<div className="space-y-2">
						{[...Array(8)].map((_, i) => (
							<div key={i} className="h-16 bg-[#171717]/50 border-2 border-[#262626] animate-pulse" />
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section id="activity" className="py-12 md:py-20 px-4 md:px-6 bg-[#0A0A0A]">
			<div className="mx-auto max-w-7xl">
				<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
					<div>
						<h2 className="font-display text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight">[Recent Activity]</h2>
						<p className="text-sm md:text-base text-[#737373] font-mono uppercase tracking-widest">
							{filteredActivity.length} {filteredActivity.length === 1 ? "commit" : "commits"}
						</p>
					</div>
					<div className="flex items-center gap-2 md:gap-3">
						<div className="flex gap-1 md:gap-2 bg-[#171717] border-2 border-[#333] p-1">
							<button
								onClick={() => setViewMode("compact")}
								className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-black transition-colors uppercase tracking-wider ${
									viewMode === "compact"
										? "bg-[#FFD800] text-[#0A0A0A]"
										: "text-[#737373] hover:text-white"
								}`}
							>
								COMPACT
							</button>
							<button
								onClick={() => setViewMode("detailed")}
								className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-black transition-colors uppercase tracking-wider ${
									viewMode === "detailed"
										? "bg-[#FFD800] text-[#0A0A0A]"
										: "text-[#737373] hover:text-white"
								}`}
							>
								DETAILED
							</button>
						</div>
						<div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#171717] border-2 border-[#333]">
							<span className={`w-2 h-2 ${error ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
							<span className="text-xs md:text-sm text-[#737373] font-mono uppercase tracking-wider">{error ? "Error" : "Live"}</span>
						</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-6">
					<input
						type="text"
						placeholder="SEARCH COMMITS..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1 min-w-[200px] px-4 py-2 bg-[#171717] border-2 border-[#333] text-white placeholder-[#737373] focus:border-[#FFD800] focus:outline-none font-mono text-sm uppercase"
					/>
					<select
						value={selectedRepo}
						onChange={(e) => setSelectedRepo(e.target.value)}
						className="px-4 py-2 bg-[#171717] border-2 border-[#333] text-white focus:border-[#FFD800] focus:outline-none font-mono text-sm uppercase"
					>
						{repos.map((repo) => (
							<option key={repo} value={repo}>
								{repo === "all" ? "ALL REPOS" : repo}
							</option>
						))}
					</select>
					<select
						value={selectedAuthor}
						onChange={(e) => setSelectedAuthor(e.target.value)}
						className="px-4 py-2 bg-[#171717] border-2 border-[#333] text-white focus:border-[#FFD800] focus:outline-none font-mono text-sm uppercase"
					>
						{authors.map((author) => (
							<option key={author} value={author}>
								{author === "all" ? "ALL AUTHORS" : author}
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
							className="px-4 py-2 border-2 border-[#FFD800]/30 text-[#FFD800] hover:bg-[#FFD800]/10 transition-colors text-sm font-black uppercase tracking-wider"
						>
							CLEAR
						</button>
					)}
				</div>

				<div className="max-h-[600px] overflow-y-auto scrollbar-thin">
				{filteredActivity.length === 0 ? (
					<div className="text-center py-20 border-2 border-[#333] bg-[#171717]/30">
						<div className="font-display text-6xl font-black text-[#737373]/20 mb-4">NULL</div>
						<div className="text-xl text-white font-black mb-2 uppercase">No commits found</div>
						<div className="text-[#737373] font-mono uppercase tracking-widest text-sm">Try adjusting your filters</div>
					</div>
				) : viewMode === "compact" ? (
					<div className="space-y-1">
						{filteredActivity.map((item, i) => {
							const content = (
								<>
									{item.avatarUrl ? (
										<img
											src={item.avatarUrl}
											alt={item.author}
											className="w-7 h-7 md:w-8 md:h-8 ring-2 ring-[#333] flex-shrink-0"
										/>
									) : (
										<div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-[#262626] text-[#FFD800] font-black text-xs flex-shrink-0 border-2 border-[#333]">
											{item.author[0]?.toUpperCase() || "?"}
										</div>
									)}
									<div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
										<div className="flex items-center gap-2 flex-shrink-0">
											<span className="font-black text-white text-xs md:text-sm uppercase">{item.author}</span>
											<span className="px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-black bg-[#FFD800]/10 text-[#FFD800] border-2 border-[#FFD800]/20 font-mono uppercase">
												{item.repo}
											</span>
											{item.isPrivate && <PrivateBadge />}
										</div>
										<span className={`text-[#A3A3A3] text-xs md:text-sm font-mono truncate ${item.isPrivate ? "blur-sm select-none" : ""}`}>
											{item.message}
										</span>
									</div>
									<div className="hidden sm:flex items-center gap-1.5 md:gap-2 text-xs flex-shrink-0">
										<span className="text-green-500 font-mono text-[10px] md:text-xs font-bold">+{formatNumber(item.additions)}</span>
										<span className="text-red-500 font-mono text-[10px] md:text-xs font-bold">-{formatNumber(item.deletions)}</span>
										<span className="text-[#737373] ml-1 md:ml-2 text-[10px] md:text-xs font-mono uppercase">{item.time}</span>
									</div>
								</>
							);

							const className = `group flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 bg-[#171717] border-2 border-[#262626] transition-all ${
								item.isPrivate ? "cursor-default" : "hover:border-[#FFD800]/30"
							}`;

							return item.isPrivate ? (
								<div key={i} className={className}>
									{content}
								</div>
							) : (
								<a
									key={i}
									href={item.commitUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={className}
								>
									{content}
								</a>
							);
						})}
					</div>
				) : (
					<div className="space-y-2">
						{filteredActivity.map((item, i) => {
							const content = (
								<>
									<div className="flex-shrink-0 pt-0.5 md:pt-1">
										{item.avatarUrl ? (
											<img
												src={item.avatarUrl}
												alt={item.author}
												className="w-10 h-10 md:w-12 md:h-12 ring-2 ring-[#333] group-hover:ring-[#FFD800]/30 transition-all"
											/>
										) : (
											<div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#262626] text-[#FFD800] font-black text-base md:text-lg border-2 border-[#333] group-hover:border-[#FFD800]/30 transition-all">
												{item.author[0]?.toUpperCase() || "?"}
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2 flex-wrap">
											<span className="font-black text-white text-sm md:text-base uppercase">{item.author}</span>
											<span className="text-[#737373] text-xs md:text-sm font-mono uppercase">pushed to</span>
											<span className="px-2 py-1 text-[10px] md:text-xs font-black bg-[#FFD800]/10 text-[#FFD800] border-2 border-[#FFD800]/20 font-mono uppercase">
												{item.repo}
											</span>
											{item.isPrivate && <PrivateBadge />}
											<span className="text-[#737373] text-xs md:text-sm ml-auto font-mono uppercase">{item.time}</span>
										</div>
										<p className={`text-[#A3A3A3] font-mono text-xs md:text-sm mb-3 line-clamp-2 ${item.isPrivate ? "blur-sm select-none" : ""}`}>
											{item.message}
										</p>
										<div className="flex items-center gap-2 md:gap-4 flex-wrap">
											<div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 bg-green-500/10 border-2 border-green-500/20">
												<span className="text-[10px] md:text-xs font-black text-green-500">+{formatNumber(item.additions)}</span>
											</div>
											<div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 bg-red-500/10 border-2 border-red-500/20">
												<span className="text-[10px] md:text-xs font-black text-red-500">-{formatNumber(item.deletions)}</span>
											</div>
											{!item.isPrivate && (
												<div className="ml-auto text-[10px] md:text-xs text-[#737373] group-hover:text-[#FFD800] transition-colors font-mono uppercase tracking-wider">
													View commit &raquo;
												</div>
											)}
										</div>
									</div>
								</>
							);

							const className = `group flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-[#171717] border-2 border-[#262626] transition-all ${
								item.isPrivate ? "cursor-default" : "hover:border-[#FFD800]/30"
							}`;

							return item.isPrivate ? (
								<div key={i} className={className}>
									{content}
								</div>
							) : (
								<a
									key={i}
									href={item.commitUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={className}
								>
									{content}
								</a>
							);
						})}
					</div>
				)}
				<div ref={sentinelRef} className="h-1" />
				{loadingMore && (
					<div className="flex items-center justify-center py-4 gap-2">
						<span className="w-2 h-2 bg-[#FFD800] animate-pulse" />
						<span className="text-xs text-[#737373] font-mono uppercase tracking-widest">Loading more...</span>
					</div>
				)}
			</div>
			</div>
		</section>
	);
}
