import { fmt, longDate } from "./Shell";

/** Cumulative stars over time as a stepped area, drawn on the server. */
export function StarChart({ series, label }: { series: { day: string; value: number }[]; label: string }) {
	if (series.length < 2) {
		return <p className="p-empty">Not enough star history yet to draw a chart.</p>;
	}
	const W = 800;
	const H = 220;
	const t0 = new Date(series[0].day).getTime();
	const t1 = Math.max(Date.now(), new Date(series[series.length - 1].day).getTime());
	const max = Math.max(...series.map((s) => s.value));
	const x = (day: string) => ((new Date(day).getTime() - t0) / Math.max(1, t1 - t0)) * W;
	const y = (v: number) => H - (v / Math.max(1, max)) * (H - 8);

	let line = `M0,${y(series[0].value)}`;
	for (let i = 1; i < series.length; i++) {
		line += ` H${x(series[i].day).toFixed(1)} V${y(series[i].value).toFixed(1)}`;
	}
	line += ` H${W}`;
	const area = `${line} V${H} H0 Z`;
	const last = series[series.length - 1];

	return (
		<figure className="p-chart" aria-label={label}>
			<div className="p-chart-top">
				<b className="p-num">{fmt(last.value)}</b>
				<span className="p-muted">stars since {longDate.format(new Date(series[0].day))}</span>
			</div>
			<svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
				<line x1="0" x2={W} y1={y(max)} y2={y(max)} className="p-chart-grid" vectorEffect="non-scaling-stroke" />
				<line x1="0" x2={W} y1={y(max / 2)} y2={y(max / 2)} className="p-chart-grid" vectorEffect="non-scaling-stroke" />
				<path d={area} className="p-chart-area" />
				<path d={line} className="p-chart-line" vectorEffect="non-scaling-stroke" />
			</svg>
			<figcaption className="p-chart-axis p-muted">
				<span>{longDate.format(new Date(series[0].day))}</span>
				<span>Today</span>
			</figcaption>
		</figure>
	);
}
