import { Octokit } from "@octokit/rest";
import { db } from "../lib/db";
import { commits } from "../lib/db/schema";
import { eq, desc } from "drizzle-orm";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = "crafter-station";

if (!GITHUB_TOKEN) {
	console.error("Error: GITHUB_TOKEN environment variable is not set");
	process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function updateAvatars() {
	try {
		console.log("Fetching recent commits...");

		const allCommits = await db.select().from(commits).orderBy(desc(commits.pushedAt)).limit(200);

		console.log(`Found ${allCommits.length} commits to update\n`);

		let updated = 0;
		let failed = 0;

		for (const commit of allCommits) {
			try {
				const { data: commitDetails } = await octokit.repos.getCommit({
					owner: ORG_NAME,
					repo: commit.repoName,
					ref: commit.id,
				});

				const realAvatarUrl = commitDetails.author?.avatar_url || `https://github.com/${commit.authorUsername}.png`;

				// Always update to ensure we have the real avatar
				await db
					.update(commits)
					.set({ authorAvatarUrl: realAvatarUrl })
					.where(eq(commits.id, commit.id));

				console.log(`  ✓ ${commit.authorUsername} (${commit.repoName}/${commit.id.substring(0, 7)})`);
				updated++;
			} catch (error: any) {
				if (error.status === 404) {
					failed++;
				} else {
					console.error(`  ✗ Error on ${commit.id}:`, error.message);
				}
			}
		}

		console.log(`\n✓ Updated ${updated} avatars`);
		if (failed > 0) console.log(`✗ Failed ${failed} (repo not found)`);
	} catch (error) {
		console.error("Update error:", error);
		process.exit(1);
	}
}

updateAvatars();
