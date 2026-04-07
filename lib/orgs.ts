import { eq } from "drizzle-orm";
import { db } from "./db";
import { orgs } from "./db/schema";

export type Org = typeof orgs.$inferSelect;

/**
 * Load all active orgs from the database.
 */
export async function getActiveOrgs(): Promise<Org[]> {
	return db.select().from(orgs).where(eq(orgs.isActive, true));
}

/**
 * Look up an org by its GitHub org name (e.g. "crafter-station").
 * Returns null if the org is not registered.
 */
export async function getOrgByGithubName(
	githubOrg: string,
): Promise<Org | null> {
	const rows = await db
		.select()
		.from(orgs)
		.where(eq(orgs.githubOrg, githubOrg))
		.limit(1);
	return rows[0] ?? null;
}

/**
 * Look up an org by its slug (e.g. "crafter-station").
 */
export async function getOrgBySlug(slug: string): Promise<Org | null> {
	const rows = await db
		.select()
		.from(orgs)
		.where(eq(orgs.slug, slug))
		.limit(1);
	return rows[0] ?? null;
}
