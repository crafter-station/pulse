import { Octokit } from "@octokit/rest";
import { desc, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { commits, orgs } from "../lib/db/schema";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
	console.error("Error: GITHUB_TOKEN environment variable is not set");
	process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function updateAvatars() {
	console.log("Fetching recent commits...");

	const allCommits = await db
		.select({
			id: commits.id,
			repoName: commits.repoName,
			authorUsername: commits.authorUsername,
			orgId: commits.orgId,
			githubOrg: orgs.githubOrg,
		})
		.from(commits)
		.leftJoin(orgs, eq(commits.orgId, orgs.id))
		.orderBy(desc(commits.pushedAt))
		.limit(200);

	console.log(`Found ${allCommits.length} commits to update\n`);

	let updated = 0;
	let failed = 0;

	for (const commit of allCommits) {
		if (!commit.githubOrg) {
			console.warn(`  ⚠ ${commit.id}: missing orgId, skipping`);
			failed++;
			continue;
		}
		try {
			const { data: commitDetails } = await octokit.repos.getCommit({
				owner: commit.githubOrg,
				repo: commit.repoName,
				ref: commit.id,
			});

			const realAvatarUrl =
				commitDetails.author?.avatar_url ||
				`https://github.com/${commit.authorUsername}.png`;

			await db
				.update(commits)
				.set({ authorAvatarUrl: realAvatarUrl })
				.where(eq(commits.id, commit.id));

			console.log(
				`  ✓ ${commit.authorUsername} (${commit.githubOrg}/${commit.repoName}/${commit.id.substring(0, 7)})`,
			);
			updated++;
		} catch (error: unknown) {
			const e = error as { status?: number; message?: string };
			if (e.status === 404) {
				failed++;
			} else {
				console.error(`  ✗ Error on ${commit.id}:`, e.message);
			}
		}
	}

	console.log(`\n✓ Updated ${updated} avatars`);
	if (failed > 0) console.log(`✗ Failed ${failed} (repo not found or no org)`);
}

updateAvatars()
	.catch((err) => {
		console.error("Update error:", err);
		process.exit(1);
	})
	.then(() => process.exit(0));
