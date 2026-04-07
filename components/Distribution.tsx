"use client";

import { useEffect, useState } from "react";
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

export function Distribution() {
	const [data, setData] = useState<DistributionResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const org = useOrgParam();

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			try {
				setLoading(true);
				const res = await fetch(withOrg("/api/distribution", org));
				if (!res.ok) throw new Error("Failed to fetch");
				const json = await res.json();
				if (!cancelled) setData(json);
			} catch (err) {
				console.error("Distribution fetch error:", err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		run();
		const interval = setInterval(run, 300000); // 5 min
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [org]);

	const totals = data?.totals;
	const packages = data?.packages ?? [];
	const sorted = [...packages].sort(
		(a, b) => (b.stats.npmMonth ?? 0) - (a.stats.npmMonth ?? 0),
	);

	return (
		<section
			id="distribution"
			className="py-12 md:py-20 px-4 md:px-6 scroll-mt-8"
		>
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 md:mb-8">
					<h2 className="font-display text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight">
						[Distribution]
					</h2>
					<p className="text-sm md:text-base text-[#737373] font-mono uppercase tracking-widest">
						Packages shipping // npm downloads + skills.sh installs + gh
						releases
					</p>
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
						value={
							loading ? "---" : formatNumber(totals?.skillsInstalls ?? 0)
						}
						sub="agent installs"
					/>
				</div>

				{/* Package leaderboard */}
				<div className="border-2 border-[#333] bg-[#0A0A0A]">
					<div className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-3 border-b-2 border-[#333] text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#737373]">
						<div className="col-span-5 md:col-span-5">Package</div>
						<div className="col-span-2 md:col-span-2 text-right">Month</div>
						<div className="col-span-2 md:col-span-2 text-right">Week</div>
						<div className="col-span-2 md:col-span-2 text-right">Day</div>
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
						sorted.map((pkg, i) => (
							<div
								key={pkg.id}
								className={`grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-3 md:py-4 ${
									i !== sorted.length - 1 ? "border-b border-[#222]" : ""
								} hover:bg-[#111] transition-colors`}
							>
								<div className="col-span-5 md:col-span-5 min-w-0">
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
										{pkg.monorepo && (
											<span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#FFD800]/70 border border-[#FFD800]/30 px-1.5 py-0.5 shrink-0 hidden md:inline-block">
												{pkg.monorepo}
											</span>
										)}
									</div>
									<div className="text-[10px] md:text-xs text-[#737373] font-mono truncate">
										{pkg.org.slug} · {pkg.npmName ?? pkg.githubRepo}
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
								<div className="col-span-1 md:col-span-1 text-right font-mono text-sm md:text-base text-[#FFD800]">
									{pkg.stats.skillsInstalls !== null
										? formatNumber(pkg.stats.skillsInstalls)
										: "—"}
								</div>
							</div>
						))}
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
