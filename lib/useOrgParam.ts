"use client";

import { useSearchParams } from "next/navigation";

/**
 * Read the current `?org=` query param from the URL. Defaults to "all".
 * Returns a stable string that can be appended to API URLs:
 *   const org = useOrgParam();
 *   fetch(`/api/stats?org=${org}`);
 */
export function useOrgParam(): string {
	const params = useSearchParams();
	const raw = params?.get("org")?.trim().toLowerCase();
	return raw && raw.length > 0 ? raw : "all";
}

/**
 * Append the current org filter to a URL. Keeps other query params in the
 * base URL intact.
 */
export function withOrg(baseUrl: string, org: string): string {
	const sep = baseUrl.includes("?") ? "&" : "?";
	return `${baseUrl}${sep}org=${encodeURIComponent(org)}`;
}
