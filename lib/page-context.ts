import { eq } from "drizzle-orm";
import { db } from "./db";
import { orgs } from "./db/schema";
import { PERIODS, type PeriodKey, parsePeriod } from "./overview";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export type PageContext = {
	period: PeriodKey;
	periodLabel: string;
	periodText: string;
	previousLabel: string;
	org: { id: number; slug: string; name: string } | null;
	orgParam: string;
	orgs: { id: number; slug: string; name: string }[];
	query: Record<string, string>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function getPageContext(searchParams: SearchParams): Promise<PageContext> {
	const raw = await searchParams;
	const period = parsePeriod(first(raw.period));
	const allOrgs = await db
		.select({ id: orgs.id, slug: orgs.slug, name: orgs.displayName })
		.from(orgs)
		.where(eq(orgs.isActive, true))
		.orderBy(orgs.id);
	const org = allOrgs.find((o) => o.slug === first(raw.org)) ?? null;
	const query: Record<string, string> = {};
	for (const [k, v] of Object.entries(raw)) {
		const value = first(v);
		if (value) query[k] = value;
	}
	return {
		period,
		periodLabel: PERIODS[period].label,
		periodText: PERIODS[period].label.toLowerCase(),
		previousLabel: PERIODS[period].previous,
		org,
		orgParam: org?.slug ?? "all",
		orgs: allOrgs,
		query,
	};
}

/** Build a link that keeps the org and period filters. */
export function linkTo(path: string, ctx: PageContext, extra: Record<string, string | null> = {}) {
	const params = new URLSearchParams();
	if (ctx.org) params.set("org", ctx.org.slug);
	if (ctx.period !== "month") params.set("period", ctx.period);
	for (const [k, v] of Object.entries(extra)) {
		if (v) params.set(k, v);
		else params.delete(k);
	}
	const qs = params.toString();
	return qs ? `${path}?${qs}` : path;
}
