import { Octokit } from "@octokit/rest";
import { db } from "../lib/db";
import { commits, repos, contributors } from "../lib/db/schema";
import { sql } from "drizzle-orm";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = "crafter-station";

if (!GITHUB_TOKEN) {
	console.error("Error: GITHUB_TOKEN environment variable is not set");
	process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function backfillCommits() {
	try {
		console.log(`Fetching repositories from ${ORG_NAME}...`);

		const { data: orgRepos } = await octokit.repos.listForOrg({
			org: ORG_NAME,
			per_page: 100,
			sort: "updated",
		});

		console.log(`Found ${orgRepos.length} repositories\n`);

		for (const repo of orgRepos) {
			console.log(`Processing ${repo.name}...`);

			await db
				.insert(repos)
				.values({
					name: repo.name,
					fullName: repo.full_name,
					isActive: true,
					lastPushAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
				})
				.onConflictDoNothing();

			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			try {
				const { data: repoCommits } = await octokit.repos.listCommits({
					owner: ORG_NAME,
					repo: repo.name,
					since: thirtyDaysAgo.toISOString(),
					per_page: 100,
				});

				console.log(`  Found ${repoCommits.length} commits in last 30 days`);

				for (const commit of repoCommits) {
					if (!commit.sha || !commit.commit.message) continue;

					const authorUsername = commit.author?.login || commit.commit.author?.name || "unknown";
					const authorAvatarUrl = commit.author?.avatar_url || null;

					const commitData = {
						id: commit.sha,
						repoName: repo.name,
						authorUsername,
						authorAvatarUrl,
						message: commit.commit.message.split("\n")[0],
						additions: 0,
						deletions: 0,
						commitUrl: commit.html_url,
						pushedAt: new Date(commit.commit.author?.date || new Date()),
					};

					await db.insert(commits).values(commitData).onConflictDoNothing();

					await db
						.insert(contributors)
						.values({
							username: authorUsername,
							avatarUrl: authorAvatarUrl,
							totalCommits: 1,
							lastCommitAt: commitData.pushedAt,
						})
						.onConflictDoUpdate({
							target: contributors.username,
							set: {
								totalCommits: sql`${contributors.totalCommits} + 1`,
								lastCommitAt: commitData.pushedAt,
								updatedAt: new Date(),
							},
						});
				}
			} catch (error: any) {
				if (error.status === 409) {
					console.log(`  Skipping ${repo.name} (empty repository)`);
				} else {
					console.error(`  Error fetching commits for ${repo.name}:`, error.message);
				}
			}
		}

		console.log("\nBackfill complete!");
	} catch (error) {
		console.error("Backfill error:", error);
		process.exit(1);
	}
}

backfillCommits();
