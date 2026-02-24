"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	ResponsiveContainer,
	Cell,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, Users, GitCommit, Flame, Info } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

interface MetricChange {
	current: number;
	previous: number;
	change: number;
}

interface AnalyticsData {
	wow: {
		commits: MetricChange;
		additions: MetricChange;
		deletions: MetricChange;
		contributors: MetricChange;
	};
	mom: {
		commits: MetricChange;
		additions: MetricChange;
		deletions: MetricChange;
	};
	ytd: {
		commits: number;
		additions: number;
		deletions: number;
	};
	weeklyChart: Array<{ week: string; commits: number }>;
	velocity: {
		netLines: number;
		prevNetLines: number;
		change: number;
		avgCommitsPerContributor: number;
	};
	contributorTrends: {
		activeWoWChange: number;
		newThisMonth: number;
	};
	topGrowingRepos: Array<{
		name: string;
		currentCommits: number;
		prevCommits: number;
		growth: number;
	}>;
	cumulativeMonthly: Array<{
		month: string;
		commits: number;
		cumulative: number;
	}>;
}

function Tooltip({ text }: { text: string }) {
	const [visible, setVisible] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const show = () => {
		clearTimeout(timeoutRef.current);
		setVisible(true);
	};
	const hide = () => {
		timeoutRef.current = setTimeout(() => setVisible(false), 100);
	};

	return (
		<span
			className="relative inline-flex"
			onMouseEnter={show}
			onMouseLeave={hide}
			onFocus={show}
			onBlur={hide}
		>
			<Info className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#525252] hover:text-[#A3A3A3] transition-colors cursor-help" />
			<AnimatePresence>
				{visible && (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 4 }}
						transition={{ duration: 0.15 }}
						className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 text-[11px] leading-relaxed text-[#D4D4D4] bg-[#1A1A1A] border-2 border-[#333] shadow-xl pointer-events-none"
					>
						{text}
						<div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1A1A] border-r-2 border-b-2 border-[#333] rotate-45 -mt-1" />
					</motion.div>
				)}
			</AnimatePresence>
		</span>
	);
}

function ChangeBadge({ change }: { change: number }) {
	const isPositive = change >= 0;
	const Icon = isPositive ? TrendingUp : TrendingDown;
	return (
		<span
			className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] md:text-xs font-black uppercase ${
				isPositive
					? "bg-green-500/10 text-green-400 border-2 border-green-500/20"
					: "bg-red-500/10 text-red-400 border-2 border-red-500/20"
			}`}
		>
			<Icon className="w-3 h-3" />
			{isPositive ? "+" : ""}
			{change}%
		</span>
	);
}

function GrowthCard({
	label,
	value,
	change,
	accent,
	tooltip,
}: {
	label: string;
	value: string;
	change: number;
	accent?: boolean;
	tooltip: string;
}) {
	return (
		<div
			className={`p-4 md:p-6 ${
				accent
					? "bg-[#FFD800] border-2 border-[#FFD800]"
					: "bg-[#171717] border-2 border-[#333] hover:border-[#FFD800]/30 transition-colors"
			}`}
		>
			<div className="relative">
				<div
					className={`flex items-center gap-1.5 text-xs md:text-sm font-black uppercase tracking-widest mb-2 font-mono ${
						accent ? "text-[#0A0A0A]/60" : "text-[#737373]"
					}`}
				>
					[{label}]
					<Tooltip text={tooltip} />
				</div>
				<div className={`font-display text-2xl md:text-4xl font-black mb-2 ${accent ? "text-[#0A0A0A]" : "text-white"}`}>
					{value}
				</div>
				<ChangeBadge change={change} />
			</div>
		</div>
	);
}

function WeeklyBarChart({
	data,
}: {
	data: Array<{ week: string; commits: number }>;
}) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const handleMouseEnter = useCallback((_: unknown, index: number) => {
		setActiveIndex(index);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setActiveIndex(null);
	}, []);

	return (
		<div className="bg-[#171717] border-2 border-[#333] p-4 md:p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<div className="flex items-center gap-1.5">
						<h3 className="text-base md:text-lg font-black text-white uppercase tracking-wider">
							[Weekly Commits]
						</h3>
						<Tooltip text="Commit volume per week over the last 12 weeks. Helps spot shipping rhythm and seasonal patterns." />
					</div>
					<p className="text-xs md:text-sm text-[#737373] font-mono uppercase tracking-widest">Last 12 weeks</p>
				</div>
				<AnimatePresence mode="wait">
					{activeIndex !== null && data[activeIndex] && (
						<motion.div
							key={activeIndex}
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ type: "spring", stiffness: 300, damping: 25 }}
							className="text-right"
						>
							<div className="font-display text-xl md:text-2xl font-black text-[#FFD800]">
								{data[activeIndex].commits}
							</div>
							<div className="text-xs text-[#737373] font-mono uppercase">
								{data[activeIndex].week}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
			<div className="h-48 md:h-64">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data}
						onMouseLeave={handleMouseLeave}
						margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
					>
						<XAxis
							dataKey="week"
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#737373", fontSize: 11 }}
							interval={1}
						/>
						<Bar
							dataKey="commits"
							radius={[0, 0, 0, 0]}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
						>
							{data.map((_, index) => (
								<Cell
									key={index}
									fill="#FFD800"
									fillOpacity={activeIndex === null ? 0.6 : activeIndex === index ? 1 : 0.15}
									style={{
										transition: "fill-opacity 0.3s ease",
									}}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

export function Analytics() {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchAnalytics = async () => {
			try {
				const res = await fetch("/api/analytics");
				if (!res.ok) throw new Error("Failed to fetch");
				const json = await res.json();
				setData(json);
			} catch (err) {
				console.error("Error fetching analytics:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchAnalytics();
		const interval = setInterval(fetchAnalytics, 60000);
		return () => clearInterval(interval);
	}, []);

	const placeholder = "---";

	return (
		<section id="analytics" className="py-12 md:py-16 px-4 md:px-6">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 md:mb-8">
					<h2 className="font-display text-xl md:text-2xl font-black text-white tracking-tight uppercase">
						[Analytics]
					</h2>
					<p className="text-xs md:text-sm text-[#737373] mt-1 uppercase tracking-widest font-mono">
						Growth and trends
					</p>
				</div>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
					<GrowthCard
						label="Commits WoW"
						tooltip="Commits pushed this week vs last week. A consistent upward trend signals healthy shipping cadence."
						value={
							loading || !data
								? placeholder
								: formatNumber(data.wow.commits.current)
						}
						change={data?.wow.commits.change ?? 0}
						accent
					/>
					<GrowthCard
						label="Lines Added WoW"
						tooltip="New lines of code this week vs last. Tracks raw output -- spikes may indicate new features landing."
						value={
							loading || !data
								? placeholder
								: formatNumber(data.wow.additions.current)
						}
						change={data?.wow.additions.change ?? 0}
					/>
					<GrowthCard
						label="Contributors WoW"
						tooltip="Unique contributors this week vs last. Growing contributor count means the team is scaling well."
						value={
							loading || !data
								? placeholder
								: formatNumber(data.wow.contributors.current)
						}
						change={data?.wow.contributors.change ?? 0}
					/>
					<GrowthCard
						label="Code Velocity"
						tooltip="Net lines added minus deleted this week. Positive means the codebase is growing; negative may signal healthy refactoring."
						value={
							loading || !data
								? placeholder
								: `${data.velocity.netLines >= 0 ? "+" : ""}${formatNumber(data.velocity.netLines)}`
						}
						change={data?.velocity.change ?? 0}
					/>
				</div>

				{!loading && data && data.weeklyChart.length > 0 && (
					<div className="mb-3 md:mb-4">
						<WeeklyBarChart data={data.weeklyChart} />
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
					<div className="bg-[#171717] border-2 border-[#333] p-4 md:p-6 hover:border-[#FFD800]/30 transition-colors">
						<div className="flex items-center gap-2 mb-3">
							<Users className="w-4 h-4 text-[#FFD800]" />
							<span className="text-xs md:text-sm text-[#737373] font-black uppercase tracking-widest font-mono">
								[New Contributors]
							</span>
							<Tooltip text="People who made their first-ever commit in the last 30 days. Indicates team growth and onboarding success." />
						</div>
						<div className="font-display text-2xl md:text-4xl font-black text-white mb-1">
							{loading || !data
								? placeholder
								: data.contributorTrends.newThisMonth}
						</div>
						<div className="text-xs md:text-sm text-[#A3A3A3] uppercase tracking-wider font-bold">
							This month
						</div>
					</div>

					<div className="bg-[#171717] border-2 border-[#333] p-4 md:p-6 hover:border-[#FFD800]/30 transition-colors">
						<div className="flex items-center gap-2 mb-3">
							<GitCommit className="w-4 h-4 text-[#FFD800]" />
							<span className="text-xs md:text-sm text-[#737373] font-black uppercase tracking-widest font-mono">
								[Avg Commits / Dev]
							</span>
							<Tooltip text="Total commits this week divided by active contributors. Measures individual throughput without penalizing team size." />
						</div>
						<div className="font-display text-2xl md:text-4xl font-black text-white mb-1">
							{loading || !data
								? placeholder
								: data.velocity.avgCommitsPerContributor}
						</div>
						<div className="text-xs md:text-sm text-[#A3A3A3] uppercase tracking-wider font-bold">
							Per week
						</div>
					</div>

					<div className="bg-[#171717] border-2 border-[#333] p-4 md:p-6 hover:border-[#FFD800]/30 transition-colors">
						<div className="flex items-center gap-2 mb-3">
							<Flame className="w-4 h-4 text-[#FFD800]" />
							<span className="text-xs md:text-sm text-[#737373] font-black uppercase tracking-widest font-mono">
								[Top Growing Repos]
							</span>
							<Tooltip text="Repos with the biggest commit increase this week vs last. Shows where the team is focusing energy." />
						</div>
						{loading || !data ? (
							<div className="font-display text-2xl font-black text-white">
								{placeholder}
							</div>
						) : (
							<div className="space-y-2">
								{data.topGrowingRepos.map((repo) => (
									<div
										key={repo.name}
										className="flex items-center justify-between"
									>
										<span className="text-xs md:text-sm text-[#A3A3A3] truncate mr-2 font-mono">
											{repo.name}
										</span>
										<span
											className={`text-xs md:text-sm font-black shrink-0 font-mono ${
												repo.growth >= 0
													? "text-green-400"
													: "text-red-400"
											}`}
										>
											{repo.growth >= 0 ? "+" : ""}
											{repo.growth}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="bg-[#0A0A0A] border-2 border-[#333] p-4 md:p-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<div className="flex items-center gap-1.5 text-xs md:text-sm text-[#737373] mb-1 font-mono uppercase tracking-widest">
								[YTD Commits]
								<Tooltip text="Total commits since January 1st. The big-picture measure of how much the team has shipped this year." />
							</div>
							<div className="font-display text-2xl md:text-3xl font-black text-white font-mono">
								{loading || !data
									? placeholder
									: formatNumber(data.ytd.commits)}
							</div>
						</div>
						<div className="h-px sm:h-8 w-full sm:w-px bg-[#262626]" />
						<div>
							<div className="flex items-center gap-1.5 text-xs md:text-sm text-[#737373] mb-1 font-mono uppercase tracking-widest">
								[YTD Lines Added]
								<Tooltip text="Total new lines of code this year. Reflects cumulative feature development and expansion." />
							</div>
							<div className="font-display text-2xl md:text-3xl font-black text-green-500 font-mono">
								+
								{loading || !data
									? placeholder
									: formatNumber(data.ytd.additions)}
							</div>
						</div>
						<div className="h-px sm:h-8 w-full sm:w-px bg-[#262626]" />
						<div>
							<div className="flex items-center gap-1.5 text-xs md:text-sm text-[#737373] mb-1 font-mono uppercase tracking-widest">
								[YTD Lines Removed]
								<Tooltip text="Total lines deleted this year. High removal alongside additions shows active refactoring and code health." />
							</div>
							<div className="font-display text-2xl md:text-3xl font-black text-red-500 font-mono">
								-
								{loading || !data
									? placeholder
									: formatNumber(data.ytd.deletions)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
