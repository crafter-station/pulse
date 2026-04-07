import { eq, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import { db } from "./db";
import { orgs } from "./db/schema";

/**
 * Parse the `?org=` query param from a request URL and look up the matching
 * org row. Returns `null` for "all", "", or unknown slugs — caller should
 * treat that as "no org filter".
 */
export async function resolveOrgFromRequest(
	request: Request,
): Promise<{ id: number; slug: string } | null> {
	const { searchParams } = new URL(request.url);
	const raw = searchParams.get("org")?.trim().toLowerCase();
	if (!raw || raw === "all") return null;

	const rows = await db
		.select({ id: orgs.id, slug: orgs.slug })
		.from(orgs)
		.where(eq(orgs.slug, raw))
		.limit(1);
	return rows[0] ?? null;
}

/**
 * Build a drizzle condition that filters by orgId if provided, otherwise
 * returns a tautology (`true`) so it can be safely combined via `and(...)`.
 *
 * Usage:
 *   const orgFilter = orgIdCondition(commits.orgId, orgRow?.id);
 *   db.select().from(commits).where(and(gte(commits.pushedAt, since), orgFilter))
 */
export function orgIdCondition(
	column: AnyColumn,
	orgId: number | null | undefined,
): SQL {
	if (orgId == null) return sql`true`;
	return eq(column, orgId);
}
