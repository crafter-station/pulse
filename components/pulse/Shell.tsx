import type { ReactNode } from "react";
import { linkTo, type PageContext } from "@/lib/page-context";
import { OrgSelect, PeriodControl, ThemeToggle } from "./Controls";

type Section = "overview" | "team" | "projects";

export function Shell({
	ctx,
	current,
	children,
}: {
	ctx: PageContext;
	current: Section;
	children: ReactNode;
}) {
	const nav: [Section, string, string][] = [
		["overview", "Overview", "/"],
		["team", "Team", "/team"],
		["projects", "Projects", "/projects"],
	];
	return (
		<div className="p-root">
			<header className="p-header">
				<div className="p-wrap p-bar">
					<a className="p-logo" href={linkTo("/", ctx)}>
						<i aria-hidden="true" />
						Pulse
					</a>
					<nav className="p-nav" aria-label="Main">
						{nav.map(([key, label, path]) => (
							<a key={key} href={linkTo(path, ctx)} aria-current={key === current ? "page" : undefined}>
								{label}
							</a>
						))}
					</nav>
					<div className="p-spacer" />
					<PeriodControl value={ctx.period} />
					<OrgSelect value={ctx.orgParam} orgs={ctx.orgs.map((o) => ({ slug: o.slug, name: o.name }))} />
					<ThemeToggle />
				</div>
			</header>
			<main className="p-wrap">
				{children}
				<footer className="p-footer">
					<span>Pulse by Crafter Station</span>
					<span>
						<a href="https://crafter.run/team">Team</a> · <a href="https://github.com/crafter-station">GitHub</a>
					</span>
				</footer>
			</main>
		</div>
	);
}

export const fmt = (n: number) => n.toLocaleString("en-US");
export const shortDate = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	timeZone: "America/Lima",
});
export const longDate = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "America/Lima",
});
export const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
	const diff = current - previous;
	if (diff === 0) {
		return (
			<span className="p-delta" data-dir="flat">
				Same as {label}
			</span>
		);
	}
	const up = diff > 0;
	return (
		<span className="p-delta" data-dir={up ? "up" : "down"}>
			<span aria-hidden="true">{up ? "↑" : "↓"}</span>
			<span className="p-sr">{up ? "Up" : "Down"}</span> {fmt(Math.abs(diff))}{" "}
			<span className="p-delta-label">vs {label}</span>
		</span>
	);
}

export function Gain({ value }: { value: number }) {
	if (value === 0) return <span className="p-zero p-num">0</span>;
	return (
		<span className="p-gain p-num" data-dir={value > 0 ? "up" : "down"}>
			{value > 0 ? "+" : "−"}
			{fmt(Math.abs(value))}
		</span>
	);
}
