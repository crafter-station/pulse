"use client";

import {
	SegmentedControl,
	SegmentedControlIndicator,
	SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui-sdk/react/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function useSetParam() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	return (key: string, value: string, fallback: string) => {
		const next = new URLSearchParams(params.toString());
		if (value === fallback) next.delete(key);
		else next.set(key, value);
		const qs = next.toString();
		router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
	};
}

export function PeriodControl({ value }: { value: string }) {
	const setParam = useSetParam();
	return (
		<SegmentedControl
			aria-label="Period"
			className="p-seg"
			value={value}
			onValueChange={(next) => next && setParam("period", String(next), "month")}
		>
			<SegmentedControlIndicator className="p-seg-indicator" />
			<SegmentedControlItem value="week">Week</SegmentedControlItem>
			<SegmentedControlItem value="month">Month</SegmentedControlItem>
			<SegmentedControlItem value="quarter">Quarter</SegmentedControlItem>
		</SegmentedControl>
	);
}

export function OrgSelect({
	value,
	orgs,
}: {
	value: string;
	orgs: { slug: string; name: string }[];
}) {
	const setParam = useSetParam();
	const items = [{ value: "all", label: "All orgs" }, ...orgs.map((o) => ({ value: o.slug, label: o.name }))];
	return (
		<Select
			aria-label="Organization"
			items={items}
			value={value}
			onValueChange={(next) => next && setParam("org", String(next), "all")}
		>
			<SelectTrigger className="p-control p-select">
				<SelectValue />
				<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
					<path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
				</svg>
			</SelectTrigger>
			<SelectContent className="p-popup" side="bottom" align="end" sideOffset={6}>
				{items.map((item) => (
					<SelectItem key={item.value} value={item.value} className="p-option">
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark" | null>(null);

	useEffect(() => {
		const stored = document.documentElement.dataset.theme as "light" | "dark" | undefined;
		setTheme(stored ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
	}, []);

	function toggle() {
		const next = theme === "dark" ? "light" : "dark";
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem("pulse-theme", next);
		} catch {}
		setTheme(next);
	}

	return (
		<button
			type="button"
			className="p-control p-icon-btn"
			onClick={toggle}
			aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
		>
			<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
				<circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
				<path d="M9 2.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
			</svg>
		</button>
	);
}
