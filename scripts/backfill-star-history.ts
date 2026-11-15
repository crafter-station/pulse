import { Octokit } from "@octokit/rest";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { repoStats, repos } from "../lib/db/schema";

/**
 * Rebuild daily star counts from the stargazers API (starred_at timestamps).
 * Stars later removed are not in the list, so history can undercount.
 * Usage: bun scripts/backfill-star-history.ts [--repo owner/name]
 */
const repoFlag = process.argv.indexOf("--repo");
const only = repoFlag >= 0 ? process.argv[repoFlag + 1] : null;
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const targets = await db
	.select({ id: repos.id, fullName: repos.fullName, stars: repos.stars })
	.from(repos)
	.where(
		only
			? eq(repos.fullName, only)
			: and(eq(repos.isPrivate, false), gt(repos.stars, 0)),
	);

for (const repo of targets) {
	const [owner, name] = repo.fullName.split("/");
	try {
		const stargazers = await octokit.paginate(
			octokit.activity.listStargazersForRepo,
			{
				owner,
				repo: name,
				per_page: 100,
				headers: { accept: "application/vnd.github.star+json" },
			},
		);
		const perDay = new Map<string, number>();
		for (const s of stargazers as { starred_at?: string }[]) {
			if (!s.starred_at) continue;
			const day = s.starred_at.slice(0, 10);
			perDay.set(day, (perDay.get(day) ?? 0) + 1);
		}
		let total = 0;
		const rows = [...perDay.keys()].sort().map((day) => {
			total += perDay.get(day) ?? 0;
			return { repoId: repo.id, metric: "stars", value: total, capturedOn: day };
		});
		for (let i = 0; i < rows.length; i += 500) {
			await db
				.insert(repoStats)
				.values(rows.slice(i, i + 500))
				.onConflictDoUpdate({
					target: [repoStats.repoId, repoStats.metric, repoStats.capturedOn],
					set: { value: sql`greatest(${repoStats.value}, excluded.value)` },
				});
		}
		console.log(`${repo.fullName}: ${rows.length} days, ${total} stars`);
	} catch (error) {
		console.warn(`${repo.fullName}: ${(error as Error).message}`);
	}
}
process.exit(0);
