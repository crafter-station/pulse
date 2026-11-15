"use client";

import {
	Drawer,
	DrawerBackdrop,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerTitle,
	DrawerTrigger,
} from "@ui-sdk/react/drawer";
import { type ReactNode, useState } from "react";

type DrillItem = {
	id: string;
	title: string;
	isPrivate: boolean;
	meta: string[];
	href: string | null;
	date: string | null;
	value?: string;
};

type DrillProps = {
	title: string;
	description: string;
	params: Record<string, string | null | undefined>;
	label: string;
	className?: string;
	children: ReactNode;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	timeZone: "America/Lima",
});

export function Drill({ title, description, params, label, className, children }: DrillProps) {
	const [items, setItems] = useState<DrillItem[] | null>(null);
	const [error, setError] = useState(false);

	async function load() {
		if (items) return;
		setError(false);
		const search = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value) search.set(key, value);
		}
		try {
			const res = await fetch(`/api/drill?${search}`);
			if (!res.ok) throw new Error(String(res.status));
			const data = (await res.json()) as { items: DrillItem[] };
			setItems(data.items);
		} catch {
			setError(true);
		}
	}

	return (
		<Drawer side="right" onOpenChange={(open) => open && load()}>
			<DrawerTrigger className={`p-drill ${className ?? ""}`} aria-label={label}>
				{children}
			</DrawerTrigger>
			<DrawerBackdrop className="p-drawer-backdrop" />
			<DrawerContent className="p-drawer" initialFocus="content">
				<div className="p-drawer-head">
					<div>
						<DrawerTitle>{title}</DrawerTitle>
						<DrawerDescription>{description}</DrawerDescription>
					</div>
					<DrawerClose className="p-control p-icon-btn" aria-label="Close">
						<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
							<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
						</svg>
					</DrawerClose>
				</div>
				<div className="p-drawer-body">
					{error ? (
						<p className="p-empty">
							Couldn't load this list.{" "}
							<button type="button" className="p-link-btn" onClick={load}>
								Try again
							</button>
						</p>
					) : items === null ? (
						<ul className="p-drill-list" aria-busy="true">
							{Array.from({ length: 6 }, (_, i) => (
								<li key={i} className="p-drill-item p-row-line">
									<span className="p-skel" style={{ width: `${60 - i * 5}%` }} />
									<span className="p-skel p-skel-sm" />
								</li>
							))}
						</ul>
					) : items.length === 0 ? (
						<p className="p-empty">Nothing here for this period.</p>
					) : (
						<ul className="p-drill-list">
							{items.map((item) => (
								<li key={item.id} className="p-drill-item p-row-line">
									<div className="p-drill-main">
										{item.href ? (
											<a href={item.href} target="_blank" rel="noreferrer" className="p-drill-title">
												{item.title}
											</a>
										) : (
											<span className="p-drill-title" data-private={item.isPrivate || undefined}>
												{item.title}
											</span>
										)}
										<span className="p-drill-meta">{item.meta.join(" · ")}</span>
									</div>
									<span className="p-drill-side p-num">
										{item.value ?? (item.date ? dateFormat.format(new Date(item.date)) : "")}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
				{items && items.length > 0 ? (
					<div className="p-drawer-foot p-num">
						{items.length.toLocaleString("en-US")} {items.length === 1 ? "item" : "items"}
						{items.length === 300 ? ", most recent first" : ""}
					</div>
				) : null}
			</DrawerContent>
		</Drawer>
	);
}
