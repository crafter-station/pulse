import { Octokit } from "@octokit/rest";
import { db } from "../lib/db";
import { commits } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = "crafter-station";

if (!GITHUB_TOKEN) {
	console.error("Error: GITHUB_TOKEN environment variable is not set");
	process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function updateAvatars() {
	try {
		console.log("Fetching all commits...");

		const allCommits = await db.select().from(commits).limit(500);

		console.log(`Found ${allCommits.length} commits to check\n`);

		let updated = 0;

		for (const commit of allCommits) {
			try {
				const { data: commitDetails } = await octokit.repos.getCommit({
					owner: ORG_NAME,
					repo: commit.repoName,
					ref: commit.id,
				});

				const realAvatarUrl = commitDetails.author?.avatar_url;

				if (realAvatarUrl && realAvatarUrl !== commit.authorAvatarUrl) {
					await db
						.update(commits)
						.set({ authorAvatarUrl: realAvatarUrl })
						.where(eq(commits.id, commit.id));

					console.log(`  Updated avatar for ${commit.authorUsername} in ${commit.repoName}/${commit.id.substring(0, 7)}`);
					updated++;
				}
			} catch (error: any) {
				if (error.status !== 404) {
					console.error(`  Error updating ${commit.id}:`, error.message);
				}
			}
		}

		console.log(`\nUpdated ${updated} avatars!`);
	} catch (error) {
		console.error("Update error:", error);
		process.exit(1);
	}
}

updateAvatars();
