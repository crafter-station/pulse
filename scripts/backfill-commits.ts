import { Octokit } from "@octokit/rest";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { commits, contributors, repos } from "../lib/db/schema";
import { getActiveOrgs, getOrgBySlug } from "../lib/orgs";

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
});

// Days back to backfill. Override with `--days <n>`.
const DEFAULT_DAYS_BACK = 30;

function parseArgs() {
	const args = process.argv.slice(2);
	const orgFlag = args.indexOf("--org");
	const daysFlag = args.indexOf("--days");
	return {
		orgSlug: orgFlag >= 0 ? args[orgFlag + 1] : null,
		days: daysFlag >= 0 ? Number(args[daysFlag + 1]) : DEFAULT_DAYS_BACK,
	};
}

async function backfillOrg(
	org: { id: number; slug: string; githubOrg: string },
	daysBack: number,
) {
	console.log(`\n🔄 Backfilling ${org.githubOrg} (${daysBack}d)...`);

	const { data: allRepos } = await octokit.repos.listForOrg({
		org: org.githubOrg,
		per_page: 100,
	});

	console.log(`📦 Found ${allRepos.length} repos in ${org.githubOrg}`);

	const since = new Date();
	since.setDate(since.getDate() - daysBack);

	let totalCommits = 0;

	for (const repo of allRepos) {
		console.log(`\n  📁 ${repo.name}`);

		try {
			const { data: repoCommits } = await octokit.repos.listCommits({
				owner: org.githubOrg,
				repo: repo.name,
				sha: repo.default_branch,
				since: since.toISOString(),
				per_page: 100,
			});

			console.log(`     ${repoCommits.length} commits`);

			// Upsert repo even if zero commits so we have the row + visibility info
			await db
				.insert(repos)
				.values({
					orgId: org.id,
					name: repo.name,
					fullName: repo.full_name,
					isPrivate: Boolean(repo.private),
					lastPushAt: repoCommits[0]
						? new Date(repoCommits[0].commit.author?.date || new Date())
						: repo.pushed_at
							? new Date(repo.pushed_at)
							: new Date(),
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [repos.orgId, repos.name],
					set: {
						isPrivate: Boolean(repo.private),
						lastPushAt: repoCommits[0]
							? new Date(repoCommits[0].commit.author?.date || new Date())
							: repo.pushed_at
								? new Date(repo.pushed_at)
								: new Date(),
						updatedAt: new Date(),
					},
				});

			if (repoCommits.length === 0) continue;

			for (const commit of repoCommits) {
				const authorUsername =
					commit.author?.login || commit.commit.author?.name || "unknown";
				const authorAvatarUrl = commit.author?.avatar_url || "";

				const { data: commitDetails } = await octokit.repos.getCommit({
					owner: org.githubOrg,
					repo: repo.name,
					ref: commit.sha,
				});

				const commitData = {
					id: commit.sha,
					orgId: org.id,
					repoName: repo.name,
					authorUsername,
					authorAvatarUrl,
					message: commit.commit.message,
					additions: commitDetails.stats?.additions || 0,
					deletions: commitDetails.stats?.deletions || 0,
					commitUrl: commit.html_url,
					pushedAt: new Date(commit.commit.author?.date || new Date()),
				};

				await db
					.insert(commits)
					.values(commitData)
					.onConflictDoUpdate({
						target: commits.id,
						set: {
							orgId: org.id,
							additions: commitData.additions,
							deletions: commitData.deletions,
							authorAvatarUrl,
						},
					});

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

				totalCommits++;
			}
		} catch (error) {
			console.error(`     ❌ error: ${(error as Error).message}`);
		}
	}

	console.log(`\n✨ ${org.githubOrg}: ${totalCommits} commits backfilled`);
}

async function main() {
	const { orgSlug, days } = parseArgs();

	const targetOrgs = orgSlug
		? [await getOrgBySlug(orgSlug)].filter(Boolean)
		: await getActiveOrgs();

	if (targetOrgs.length === 0) {
		console.error(`No orgs matched (slug: ${orgSlug ?? "<all active>"})`);
		process.exit(1);
	}

	for (const org of targetOrgs) {
		if (!org) continue;
		await backfillOrg(
			{ id: org.id, slug: org.slug, githubOrg: org.githubOrg },
			days,
		);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
