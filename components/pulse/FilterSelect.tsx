"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@ui-sdk/react/select";
import { useRef } from "react";

/** A Select that submits its form as soon as the value changes. */
export function FilterSelect({
	name,
	label,
	defaultValue,
	items,
}: {
	name: string;
	label: string;
	defaultValue: string;
	items: { value: string; label: string }[];
}) {
	const ref = useRef<HTMLDivElement>(null);
	return (
		<div className="p-field" ref={ref}>
			<Select
				name={name}
				items={items}
				defaultValue={defaultValue}
				onValueChange={() => {
					requestAnimationFrame(() => ref.current?.closest("form")?.requestSubmit());
				}}
			>
				<SelectLabel className="p-field-label">{label}</SelectLabel>
				<SelectTrigger className="p-control p-select">
					<SelectValue />
					<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
						<path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
					</svg>
				</SelectTrigger>
				<SelectContent className="p-popup" side="bottom" align="start" sideOffset={6}>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value} className="p-option">
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
