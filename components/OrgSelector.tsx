"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface OrgSummary {
	id: number;
	slug: string;
	displayName: string;
	githubOrg: string;
	description: string | null;
	repoCount: number;
	commitCount: number;
}

const ALL_OPTION = {
	slug: "all",
	displayName: "All",
} as const;

export function OrgSelector() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [orgs, setOrgs] = useState<OrgSummary[]>([]);

	const current = (params?.get("org")?.toLowerCase() || "all").trim();

	useEffect(() => {
		let cancelled = false;
		fetch("/api/orgs")
			.then((r) => r.json())
			.then((data) => {
				if (cancelled) return;
				if (Array.isArray(data)) setOrgs(data);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	const selectOrg = useCallback(
		(slug: string) => {
			const next = new URLSearchParams(params?.toString() ?? "");
			if (slug === "all") {
				next.delete("org");
			} else {
				next.set("org", slug);
			}
			const qs = next.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[params, pathname, router],
	);

	const options = [
		{ slug: ALL_OPTION.slug, displayName: ALL_OPTION.displayName, meta: "" },
		...orgs.map((o) => ({
			slug: o.slug,
			displayName: o.displayName,
			meta: `${o.repoCount} repos · ${o.commitCount} commits`,
		})),
	];

	return (
		<div
			role="tablist"
			aria-label="Organization filter"
			className="flex items-center gap-1 bg-[#0A0A0A] border-2 border-[#333] p-1"
		>
			{options.map((opt) => {
				const active = opt.slug === current;
				return (
					<button
						key={opt.slug}
						role="tab"
						type="button"
						aria-selected={active}
						onClick={() => selectOrg(opt.slug)}
						title={opt.meta || undefined}
						className={[
							"px-2.5 md:px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors",
							active
								? "bg-[#FFD800] text-[#0A0A0A]"
								: "text-[#737373] hover:text-white",
						].join(" ")}
					>
						{opt.displayName}
					</button>
				);
			})}
		</div>
	);
}
