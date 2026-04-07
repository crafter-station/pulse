import { Octokit } from "@octokit/rest";
import { and, eq, gte } from "drizzle-orm";
import { db } from "../lib/db";
import { commits, orgs } from "../lib/db/schema";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
	console.error("Error: GITHUB_TOKEN environment variable is not set");
	process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function updateCommitStats() {
	console.log("Fetching commits with missing stats...");

	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const commitsToUpdate = await db
		.select({
			id: commits.id,
			repoName: commits.repoName,
			githubOrg: orgs.githubOrg,
		})
		.from(commits)
		.leftJoin(orgs, eq(commits.orgId, orgs.id))
		.where(
			and(
				eq(commits.additions, 0),
				eq(commits.deletions, 0),
				gte(commits.pushedAt, sevenDaysAgo),
			),
		)
		.limit(200);

	console.log(`Found ${commitsToUpdate.length} commits to update\n`);

	for (const commit of commitsToUpdate) {
		if (!commit.githubOrg) {
			console.warn(`  ⚠ ${commit.id}: missing orgId, skipping`);
			continue;
		}
		try {
			const { data: commitDetails } = await octokit.repos.getCommit({
				owner: commit.githubOrg,
				repo: commit.repoName,
				ref: commit.id,
			});

			const additions = commitDetails.stats?.additions || 0;
			const deletions = commitDetails.stats?.deletions || 0;

			await db
				.update(commits)
				.set({ additions, deletions })
				.where(eq(commits.id, commit.id));

			console.log(
				`  Updated ${commit.githubOrg}/${commit.repoName}/${commit.id.substring(0, 7)}: +${additions} -${deletions}`,
			);
		} catch (error: unknown) {
			const e = error as { message?: string };
			console.error(`  Error updating ${commit.id}:`, e.message);
		}
	}

	console.log("\nStats update complete!");
}

updateCommitStats()
	.catch((err) => {
		console.error("Update error:", err);
		process.exit(1);
	})
	.then(() => process.exit(0));
