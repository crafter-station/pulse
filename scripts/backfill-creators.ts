import { Octokit } from "@octokit/rest";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { orgs, repos } from "../lib/db/schema";

/**
 * Attribute repos without a creator to the author of their first commit.
 * Usage: bun scripts/backfill-creators.ts [--since 2026-01-01]
 */
const sinceFlag = process.argv.indexOf("--since");
const since = new Date(sinceFlag >= 0 ? process.argv[sinceFlag + 1] : "2026-01-01");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const rows = await db
	.select({ id: repos.id, fullName: repos.fullName })
	.from(repos)
	.innerJoin(orgs, eq(orgs.id, repos.orgId))
	.where(
		and(
			isNull(repos.creatorLogin),
			eq(repos.isFork, false),
			sql`${repos.githubCreatedAt} >= ${since}`,
		),
	);

console.log(`${rows.length} repos to attribute`);

async function firstCommitAuthor(fullName: string): Promise<string | null> {
	const [owner, repo] = fullName.split("/");
	const head = await octokit.repos.listCommits({ owner, repo, per_page: 1 });
	const last = head.headers.link?.match(/page=(\d+)>; rel="last"/)?.[1];
	const page = last ? Number(last) : 1;
	const { data } = await octokit.repos.listCommits({ owner, repo, per_page: 1, page });
	return data[0]?.author?.login ?? null;
}

let done = 0;
for (const row of rows) {
	try {
		const login = await firstCommitAuthor(row.fullName);
		if (!login) continue;
		await db
			.update(repos)
			.set({ creatorLogin: login, creatorSource: "first_commit" })
			.where(eq(repos.id, row.id));
		done++;
	} catch (error) {
		console.warn(`${row.fullName}: ${(error as Error).message}`);
	}
}
console.log(`${done} repos attributed`);
process.exit(0);
