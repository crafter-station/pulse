import { Octokit } from "@octokit/rest";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { commits, contributors, repos } from "../lib/db/schema";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const ORG_NAME = "crafter-station";
const DAYS_BACK = 30; // How many days to backfill

async function backfillCommits() {
  console.log(`🔄 Starting backfill for ${ORG_NAME}...`);

  // Get all repos in the org
  const { data: allRepos } = await octokit.repos.listForOrg({
    org: ORG_NAME,
    per_page: 100,
  });

  console.log(`📦 Found ${allRepos.length} repos in ${ORG_NAME}`);

  const since = new Date();
  since.setDate(since.getDate() - DAYS_BACK);

  let totalCommits = 0;

  for (const repo of allRepos) {
    console.log(`\n📁 Processing ${repo.name}...`);

    try {
      // Get commits from main/master branch
      const { data: repoCommits } = await octokit.repos.listCommits({
        owner: ORG_NAME,
        repo: repo.name,
        sha: repo.default_branch,
        since: since.toISOString(),
        per_page: 100,
      });

      console.log(`  Found ${repoCommits.length} commits`);

      if (repoCommits.length === 0) {
        continue;
      }

      // Upsert repo (sync visibility from GitHub so private→public changes are reflected)
      await db
        .insert(repos)
        .values({
          name: repo.name,
          fullName: repo.full_name,
          isPrivate: Boolean(repo.private),
          lastPushAt: new Date(
            repoCommits[0].commit.author?.date || new Date(),
          ),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: repos.name,
          set: {
            isPrivate: Boolean(repo.private),
            lastPushAt: new Date(
              repoCommits[0].commit.author?.date || new Date(),
            ),
            updatedAt: new Date(),
          },
        });

      // Process each commit
      for (const commit of repoCommits) {
        const authorUsername =
          commit.author?.login || commit.commit.author?.name || "unknown";
        const authorAvatarUrl = commit.author?.avatar_url || "";

        // Get commit details for additions/deletions
        const { data: commitDetails } = await octokit.repos.getCommit({
          owner: ORG_NAME,
          repo: repo.name,
          ref: commit.sha,
        });

        const commitData = {
          id: commit.sha,
          repoName: repo.name,
          authorUsername,
          authorAvatarUrl,
          message: commit.commit.message,
          additions: commitDetails.stats?.additions || 0,
          deletions: commitDetails.stats?.deletions || 0,
          commitUrl: commit.html_url,
          pushedAt: new Date(commit.commit.author?.date || new Date()),
        };

        // Insert commit (skip if already exists)
        await db.insert(commits).values(commitData).onConflictDoNothing();

        // Upsert contributor
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

      console.log(
        `  ✅ Processed ${repoCommits.length} commits from ${repo.name}`,
      );
    } catch (error) {
      console.error(`  ❌ Error processing ${repo.name}:`, error);
    }
  }

  console.log(`\n✨ Backfill complete! Added ${totalCommits} commits`);
}

backfillCommits().catch(console.error);
