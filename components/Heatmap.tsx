"use client";

import { useEffect, useState } from "react";

interface HeatmapDay {
	date: string;
	count: number;
}

export function Heatmap() {
	const [data, setData] = useState<HeatmapDay[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchHeatmap = async () => {
			try {
				const res = await fetch("/api/heatmap");
				if (!res.ok) throw new Error("Failed to fetch");
				const heatmapData = await res.json();
				setData(heatmapData);
			} catch (err) {
				console.error("Error fetching heatmap:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchHeatmap();

		const interval = setInterval(fetchHeatmap, 300000);
		return () => clearInterval(interval);
	}, []);

	const getIntensity = (count: number): string => {
		if (count === 0) return "bg-[#0A0A0A] border-[#262626]";
		if (count === 1) return "bg-[#FFD800]/15 border-[#FFD800]/15";
		if (count <= 5) return "bg-[#FFD800]/35 border-[#FFD800]/35";
		if (count <= 15) return "bg-[#FFD800]/55 border-[#FFD800]/55";
		if (count <= 30) return "bg-[#FFD800]/75 border-[#FFD800]/75";
		return "bg-[#FFD800] border-[#FFD800]";
	};

	const groupByWeeks = (): HeatmapDay[][] => {
		const weeks: HeatmapDay[][] = [];
		const firstDate = data.length > 0 ? new Date(data[0].date) : new Date();
		const startDayOfWeek = firstDate.getDay();

		const paddedData = [...Array(startDayOfWeek)].map(() => ({ date: "", count: -1 })).concat(data);

		for (let i = 0; i < paddedData.length; i += 7) {
			weeks.push(paddedData.slice(i, i + 7));
		}

		return weeks;
	};

	const weeks = groupByWeeks();

	const getMonthLabel = (weekIndex: number): string | null => {
		if (weekIndex >= weeks.length) return null;
		const week = weeks[weekIndex];
		const firstValidDay = week.find((d) => d.date !== "");
		if (!firstValidDay) return null;

		const date = new Date(firstValidDay.date);
		const dayOfMonth = date.getDate();

		if (dayOfMonth <= 7 || weekIndex === 0) {
			return date.toLocaleDateString("en-US", { month: "short" });
		}
		return null;
	};

	const weekDays = ["Mon", "Wed", "Fri"];
	const weekDayIndices = [1, 3, 5];

	if (loading) {
		return (
			<div className="bg-[#171717] border border-[#262626] p-4 md:p-6">
				<div className="h-32 flex items-center justify-center">
					<div className="text-[#737373] text-sm animate-pulse">Loading heatmap...</div>
				</div>
			</div>
		);
	}

	const totalCommits = data.reduce((sum, d) => sum + d.count, 0);

	return (
		<div className="bg-[#171717] border border-[#262626] p-4 md:p-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
				<div>
					<h3 className="text-sm md:text-base font-bold text-white mb-1">Activity Heatmap</h3>
					<p className="text-[10px] md:text-xs text-[#737373]">2026 • {totalCommits} total commits</p>
				</div>
				<div className="flex items-center gap-1.5 md:gap-2">
					<span className="text-[10px] md:text-xs text-[#737373]">Less</span>
					<div className="flex gap-0.5 md:gap-1">
						<div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#0A0A0A] border border-[#262626]" />
						<div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#FFD800]/15 border-[#FFD800]/15" />
						<div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#FFD800]/35 border-[#FFD800]/35" />
						<div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#FFD800]/55 border-[#FFD800]/55" />
						<div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#FFD800]/75 border-[#FFD800]/75" />
						<div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#FFD800] border border-[#FFD800]" />
					</div>
					<span className="text-[10px] md:text-xs text-[#737373]">More</span>
				</div>
			</div>

			<div className="w-full pb-2">
				<div className="flex gap-0.5 md:gap-1 w-full">
					<div className="hidden sm:flex flex-col gap-0.5 md:gap-1 mr-1.5 md:mr-2 justify-end flex-shrink-0">
						<div className="h-3 md:h-4" />
						{[0, 1, 2, 3, 4, 5, 6].map((i) => (
							<div key={i} className="h-2.5 md:h-3 flex items-center justify-end">
								{weekDayIndices.includes(i) && (
									<span className="text-[8px] md:text-[10px] text-[#737373] pr-1 md:pr-1.5">{weekDays[weekDayIndices.indexOf(i)]}</span>
								)}
							</div>
						))}
					</div>

					<div className="flex-1 min-w-0">
						<div className="grid grid-flow-col auto-cols-fr gap-0.5 md:gap-1">
							{weeks.map((week, weekIndex) => (
								<div key={weekIndex} className="flex flex-col gap-0.5 md:gap-1">
									<div className="text-[8px] md:text-[10px] text-[#737373] h-3 md:h-4 flex items-end pb-0.5">
										{getMonthLabel(weekIndex)}
									</div>
									{week.map((day, dayIndex) => {
										if (day.date === "") {
											return <div key={`empty-${dayIndex}`} className="aspect-square" />;
										}

										const date = new Date(day.date);
										const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
										const isToday = day.date === new Date().toISOString().split("T")[0];

										return (
											<div
												key={day.date}
												className={`group relative aspect-square ${getIntensity(day.count)} hover:ring-1 md:hover:ring-2 hover:ring-[#FFD800] transition-all cursor-pointer ${
													isToday ? "ring-1 md:ring-2 ring-white" : ""
												}`}
												title={`${day.date}: ${day.count} commits`}
											>
												<div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0A0A0A] border border-[#FFD800] text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
													<div className="font-bold text-[#FFD800] mb-0.5">{day.count} commits</div>
													<div className="text-[#737373]">
														{dayOfWeek}, {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
