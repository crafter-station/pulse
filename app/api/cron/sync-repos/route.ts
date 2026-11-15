import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { syncOrgRepos } from "@/lib/github/sync-repos";
import { getActiveOrgs } from "@/lib/orgs";

export const maxDuration = 300;

/**
 * GET /api/cron/sync-repos
 *
 * Daily Vercel Cron. Pulls repo metadata (stars, forks, homepage, created
 * date, default branch) for every active org with one paginated GraphQL
 * query per org. Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
	const auth = request.headers.get("authorization");
	const expected = process.env.CRON_SECRET;
	if (expected && auth !== `Bearer ${expected}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
	const result: Record<string, number | string> = {};

	for (const org of await getActiveOrgs()) {
		try {
			result[org.slug] = await syncOrgRepos(octokit, org);
		} catch (error) {
			console.error(`[sync-repos] ${org.slug}:`, error);
			result[org.slug] = "failed";
		}
	}

	return NextResponse.json({ synced: result });
}
