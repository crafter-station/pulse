import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/orgs
 * List all active orgs with lightweight counts (repos + commits).
 * Used to populate the org selector in the UI.
 */
export async function GET() {
	try {
		const rows = await db.execute(sql`
			SELECT
				o.id,
				o.slug,
				o.display_name as "displayName",
				o.github_org as "githubOrg",
				o.skills_sh_org as "skillsShOrg",
				o.description,
				(SELECT count(*)::int FROM repos r WHERE r.org_id = o.id) as "repoCount",
				(SELECT count(*)::int FROM commits c WHERE c.org_id = o.id) as "commitCount"
			FROM orgs o
			WHERE o.is_active = true
			ORDER BY o.id ASC
		`);

		return NextResponse.json(rows.rows);
	} catch (error) {
		console.error("Orgs API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch orgs" },
			{ status: 500 },
		);
	}
}
