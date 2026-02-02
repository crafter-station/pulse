import { Octokit } from "@octokit/rest";
import { db } from "../lib/db";
import { commits } from "../lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = "crafter-station";

if (!GITHUB_TOKEN) {
	console.error("Error: GITHUB_TOKEN environment variable is not set");
	process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function updateCommitStats() {
	try {
		console.log("Fetching commits with missing stats...");

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const commitsToUpdate = await db
			.select()
			.from(commits)
			.where(and(eq(commits.additions, 0), eq(commits.deletions, 0), gte(commits.pushedAt, sevenDaysAgo)))
			.limit(200);

		console.log(`Found ${commitsToUpdate.length} commits to update\n`);

		for (const commit of commitsToUpdate) {
			try {
				const { data: commitDetails } = await octokit.repos.getCommit({
					owner: ORG_NAME,
					repo: commit.repoName,
					ref: commit.id,
				});

				const additions = commitDetails.stats?.additions || 0;
				const deletions = commitDetails.stats?.deletions || 0;

				await db
					.update(commits)
					.set({ additions, deletions })
					.where(eq(commits.id, commit.id));

				console.log(`  Updated ${commit.repoName}/${commit.id.substring(0, 7)}: +${additions} -${deletions}`);
			} catch (error: any) {
				console.error(`  Error updating ${commit.id}:`, error.message);
			}
		}

		console.log("\nStats update complete!");
	} catch (error) {
		console.error("Update error:", error);
		process.exit(1);
	}
}

updateCommitStats();
