"use client";

import { useEffect, useMemo, useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useOrgParam, withOrg } from "@/lib/useOrgParam";
import { formatNumber } from "@/lib/utils/format";
import { formatRelativeTime } from "@/lib/utils/time";

interface PackageItem {
	id: number;
	slug: string;
	displayName: string;
	description: string | null;
	category: string | null;
	monorepo: string | null;
	npmName: string | null;
	githubRepo: string | null;
	skillsSlug: string | null;
	org: { slug: string; name: string };
	stats: {
		npmDay: number | null;
		npmWeek: number | null;
		npmMonth: number | null;
		skillsInstalls: number | null;
		ghReleaseDownloads: number | null;
	};
	capturedAt: string | null;
}

interface DistributionResponse {
	org: string;
	totals: {
		npmMonth: number;
		npmWeek: number;
		npmDay: number;
		skillsInstalls: number;
		ghReleaseDownloads: number;
	};
	packages: PackageItem[];
	packageCount: number;
	lastUpdatedAt: string | null;
}

interface TimeseriesResponse {
	org: string;
	days: number;
	packages: string[];
	series: Array<Record<string, number | string>>;
	deltas: Record<string, { last7: number; prev7: number; change: number }>;
}

// Palette matching the brutalist yellow-on-black aesthetic (no rainbow chaos)
const CHART_COLORS = [
	"#FFD800", // brand yellow
	"#ffffff",
	"#bbbbbb",
	"#ff5e57",
	"#55efc4",
	"#74b9ff",
	"#a29bfe",
	"#fdcb6e",
	"#ff7675",
	"#81ecec",
	"#b2bec3",
	"#e17055",
];

export function Distribution() {
	const [data, setData] = useState<DistributionResponse | null>(null);
	const [ts, setTs] = useState<TimeseriesResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [range, setRange] = useState<7 | 30>(30);
	const org = useOrgParam();

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			try {
				setLoading(true);
				const [distRes, tsRes] = await Promise.all([
					fetch(withOrg("/api/distribution", org)),
					fetch(withOrg(`/api/distribution/timeseries?days=${range}`, org)),
				]);
				if (!distRes.ok || !tsRes.ok) throw new Error("Failed to fetch");
				const [distJson, tsJson] = await Promise.all([
					distRes.json(),
					tsRes.json(),
				]);
				if (!cancelled) {
					setData(distJson);
					setTs(tsJson);
				}
			} catch (err) {
				console.error("Distribution fetch error:", err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		run();
		const interval = setInterval(run, 300000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [org, range]);

	const totals = data?.totals;
	const packages = data?.packages ?? [];
	const sorted = useMemo(
		() =>
			[...packages].sort(
				(a, b) => (b.stats.npmMonth ?? 0) - (a.stats.npmMonth ?? 0),
			),
		[packages],
	);

	// Top 6 packages for the chart (by month downloads) to keep it readable
	const topForChart = sorted.slice(0, 6).map((p) => p.slug);

	return (
		<section
			id="distribution"
			className="py-12 md:py-20 px-4 md:px-6 scroll-mt-8"
		>
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
					<div>
						<h2 className="font-display text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight">
							[Distribution]
						</h2>
						<p className="text-sm md:text-base text-[#737373] font-mono uppercase tracking-widest">
							Packages shipping // npm downloads + skills.sh installs + gh
							releases
						</p>
					</div>
					<div
						className="flex items-center gap-1 bg-[#0A0A0A] border-2 border-[#333] p-1 self-start md:self-auto"
						role="tablist"
						aria-label="Time range"
					>
						{([7, 30] as const).map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setRange(r)}
								aria-selected={range === r}
								className={[
									"px-2.5 md:px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors",
									range === r
										? "bg-[#FFD800] text-[#0A0A0A]"
										: "text-[#737373] hover:text-white",
								].join(" ")}
							>
								{r}d
							</button>
						))}
					</div>
				</div>

				{/* Hero totals */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
					<HeroCard
						label="npm / month"
						value={loading ? "---" : formatNumber(totals?.npmMonth ?? 0)}
						sub={`${data?.packageCount ?? 0} packages`}
					/>
					<HeroCard
						label="npm / week"
						value={loading ? "---" : formatNumber(totals?.npmWeek ?? 0)}
						sub="last 7 days"
					/>
					<HeroCard
						label="npm / day"
						value={loading ? "---" : formatNumber(totals?.npmDay ?? 0)}
						sub="last 24h"
					/>
					<HeroCard
						label="skills.sh"
						value={loading ? "---" : formatNumber(totals?.skillsInstalls ?? 0)}
						sub="agent installs"
					/>
				</div>

				{/* Timeseries chart */}
				<div className="border-2 border-[#333] bg-[#0A0A0A] p-3 md:p-4 mb-6 md:mb-8">
					<div className="mb-3 md:mb-4 flex items-center justify-between">
						<div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#737373]">
							Top 6 packages · daily npm downloads · last {range}d
						</div>
					</div>

					{/* Persistent legend — always visible so hover targets are identifiable */}
					<div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
						{topForChart.map((slug, i) => (
							<div
								key={slug}
								className="flex items-center gap-1.5 text-[10px] md:text-xs font-mono"
							>
								<span
									className="inline-block w-3 h-3 border border-[#222] shrink-0"
									style={{
										backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
									}}
								/>
								<span className="text-[#bbb] uppercase tracking-wider">
									{slug}
								</span>
							</div>
						))}
					</div>

					<div className="h-64 md:h-80">
						{ts?.series && ts.series.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<LineChart
									data={ts.series}
									margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="#222"
										vertical={false}
									/>
									<XAxis
										dataKey="day"
										stroke="#555"
										tick={{ fontSize: 10, fill: "#555" }}
										tickFormatter={(d) => String(d).slice(5)}
									/>
									<YAxis
										stroke="#555"
										tick={{ fontSize: 10, fill: "#555" }}
										width={40}
									/>
									<Tooltip
										cursor={{ stroke: "#FFD800", strokeWidth: 1 }}
										content={<DistributionTooltip colors={CHART_COLORS} />}
									/>
									{topForChart.map((slug, i) => (
										<Line
											key={slug}
											type="monotone"
											dataKey={slug}
											stroke={CHART_COLORS[i % CHART_COLORS.length]}
											strokeWidth={2}
											dot={false}
											activeDot={{
												r: 4,
												stroke: "#0A0A0A",
												strokeWidth: 2,
											}}
											isAnimationActive={false}
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full flex items-center justify-center text-[#555] font-mono text-xs">
								{loading ? "Loading chart..." : "No historical data yet"}
							</div>
						)}
					</div>
				</div>

				{/* Package leaderboard */}
				<div className="border-2 border-[#333] bg-[#0A0A0A]">
					<div className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-3 border-b-2 border-[#333] text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#737373]">
						<div className="col-span-4 md:col-span-4">Package</div>
						<div className="col-span-2 md:col-span-2 text-right">Month</div>
						<div className="col-span-2 md:col-span-2 text-right">Week</div>
						<div className="col-span-2 md:col-span-2 text-right">Day</div>
						<div className="col-span-1 md:col-span-1 text-right">7d Δ</div>
						<div className="col-span-1 md:col-span-1 text-right">Skills</div>
					</div>

					{loading && (
						<div className="px-3 md:px-4 py-6 text-center text-[#737373] font-mono text-sm">
							Loading distribution data...
						</div>
					)}

					{!loading && sorted.length === 0 && (
						<div className="px-3 md:px-4 py-6 text-center text-[#737373] font-mono text-sm">
							No packages yet for this org.
						</div>
					)}

					{!loading &&
						sorted.map((pkg, i) => {
							const delta = ts?.deltas?.[pkg.slug];
							return (
								<div
									key={pkg.id}
									className={`grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-3 md:py-4 items-center ${
										i !== sorted.length - 1 ? "border-b border-[#222]" : ""
									} hover:bg-[#111] transition-colors`}
								>
									<div className="col-span-4 md:col-span-4 min-w-0">
										<div className="flex items-center gap-2 mb-1 min-w-0">
											<a
												href={
													pkg.npmName
														? `https://www.npmjs.com/package/${pkg.npmName}`
														: pkg.githubRepo
															? `https://github.com/${pkg.githubRepo}`
															: "#"
												}
												target="_blank"
												rel="noopener noreferrer"
												className="font-bold text-white text-sm md:text-base truncate hover:text-[#FFD800] transition-colors"
											>
												{pkg.displayName}
											</a>
											{pkg.category && (
												<span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#737373] border border-[#333] px-1.5 py-0.5 shrink-0">
													{pkg.category}
												</span>
											)}
										</div>
										<div className="text-[10px] md:text-xs text-[#737373] font-mono truncate">
											{pkg.org.slug}
											{pkg.monorepo ? ` · ${pkg.monorepo}` : ""}
										</div>
									</div>
									<div className="col-span-2 md:col-span-2 text-right font-mono text-sm md:text-base text-white">
										{pkg.stats.npmMonth !== null
											? formatNumber(pkg.stats.npmMonth)
											: "—"}
									</div>
									<div className="col-span-2 md:col-span-2 text-right font-mono text-sm md:text-base text-[#bbb]">
										{pkg.stats.npmWeek !== null
											? formatNumber(pkg.stats.npmWeek)
											: "—"}
									</div>
									<div className="col-span-2 md:col-span-2 text-right font-mono text-sm md:text-base text-[#888]">
										{pkg.stats.npmDay !== null
											? formatNumber(pkg.stats.npmDay)
											: "—"}
									</div>
									<div className="col-span-1 md:col-span-1 text-right font-mono text-xs md:text-sm">
										{delta ? (
											<span
												className={
													delta.change > 0
														? "text-[#55efc4]"
														: delta.change < 0
															? "text-[#ff5e57]"
															: "text-[#555]"
												}
											>
												{delta.change > 0 ? "+" : ""}
												{delta.change}%
											</span>
										) : (
											<span className="text-[#555]">—</span>
										)}
									</div>
									<div className="col-span-1 md:col-span-1 text-right font-mono text-sm md:text-base text-[#FFD800]">
										{pkg.stats.skillsInstalls !== null
											? formatNumber(pkg.stats.skillsInstalls)
											: "—"}
									</div>
								</div>
							);
						})}
				</div>

				{data?.lastUpdatedAt && (
					<div className="mt-3 md:mt-4 text-[10px] md:text-xs text-[#555] font-mono uppercase tracking-wider">
						Last updated {formatRelativeTime(new Date(data.lastUpdatedAt))} ·
						Refreshed every 6h
					</div>
				)}
			</div>
		</section>
	);
}

function HeroCard({
	label,
	value,
	sub,
}: {
	label: string;
	value: string;
	sub: string;
}) {
	return (
		<div className="border-2 border-[#333] bg-[#0A0A0A] p-3 md:p-4">
			<div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#737373] mb-1">
				{label}
			</div>
			<div className="font-display text-2xl md:text-4xl font-black text-white tracking-tight">
				{value}
			</div>
			<div className="text-[10px] md:text-xs text-[#555] font-mono uppercase tracking-wider mt-1">
				{sub}
			</div>
		</div>
	);
}

interface TooltipPayloadEntry {
	name?: string;
	dataKey?: string | number;
	value?: number;
	color?: string;
}

function DistributionTooltip({
	active,
	payload,
	label,
	colors,
}: {
	active?: boolean;
	payload?: TooltipPayloadEntry[];
	label?: string | number;
	colors: readonly string[];
}) {
	if (!active || !payload || payload.length === 0) return null;

	// Sort descending by value so the biggest line is on top
	const sorted = [...payload]
		.filter((p) => typeof p.value === "number")
		.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

	return (
		<div className="bg-[#0A0A0A] border-2 border-[#333] px-3 py-2 font-mono text-xs shadow-lg">
			<div className="text-[#FFD800] font-bold uppercase tracking-wider mb-1.5">
				{String(label)}
			</div>
			<div className="flex flex-col gap-1">
				{sorted.map((entry, i) => {
					const color = entry.color || colors[i % colors.length];
					const name = String(entry.dataKey ?? entry.name ?? "");
					return (
						<div
							key={name}
							className="flex items-center gap-2 text-[11px] leading-none"
						>
							<span
								className="inline-block w-2.5 h-2.5 border border-[#222] shrink-0"
								style={{ backgroundColor: color }}
							/>
							<span className="text-[#bbb] min-w-0 truncate">{name}</span>
							<span className="text-white font-bold ml-auto">
								{entry.value}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
