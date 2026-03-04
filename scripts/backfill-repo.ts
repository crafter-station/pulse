import { Octokit } from "@octokit/rest";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { commits, repos, contributors } from "../lib/db/schema";
import { sql } from "drizzle-orm";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const OWNER = process.argv[2] || "crafter-station";
const REPO = process.argv[3] || "peru-financia";

if (!GITHUB_TOKEN || !DATABASE_URL) {
  console.error("Missing GITHUB_TOKEN or DATABASE_URL");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function main() {
  console.log(`Backfilling ${OWNER}/${REPO}...`);

  const { data: repoData } = await octokit.repos.get({ owner: OWNER, repo: REPO });

  await db.insert(repos).values({
    name: REPO,
    fullName: `${OWNER}/${REPO}`,
    isPrivate: repoData.private,
    lastPushAt: repoData.pushed_at ? new Date(repoData.pushed_at) : new Date(),
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: repos.name,
    set: { isPrivate: repoData.private, updatedAt: new Date() },
  });

  console.log(`Repo upserted (private: ${repoData.private})`);

  const allCommits = await octokit.paginate(octokit.repos.listCommits, {
    owner: OWNER,
    repo: REPO,
    sha: "main",
    per_page: 100,
  });

  console.log(`Found ${allCommits.length} commits`);

  let inserted = 0;
  for (const c of allCommits) {
    try {
      const { data: detail } = await octokit.repos.getCommit({ owner: OWNER, repo: REPO, ref: c.sha });

      await db.insert(commits).values({
        id: c.sha,
        repoName: REPO,
        authorUsername: c.author?.login || c.commit.author?.name || "unknown",
        authorAvatarUrl: c.author?.avatar_url || null,
        message: c.commit.message,
        additions: detail.stats?.additions || 0,
        deletions: detail.stats?.deletions || 0,
        commitUrl: c.html_url,
        pushedAt: new Date(c.commit.author?.date || Date.now()),
      }).onConflictDoUpdate({
        target: commits.id,
        set: {
          additions: detail.stats?.additions || 0,
          deletions: detail.stats?.deletions || 0,
        },
      });

      const username = c.author?.login || c.commit.author?.name || "unknown";
      const avatarUrl = c.author?.avatar_url || null;

      await db.insert(contributors).values({
        username,
        avatarUrl,
        totalCommits: 1,
        lastCommitAt: new Date(c.commit.author?.date || Date.now()),
      }).onConflictDoUpdate({
        target: contributors.username,
        set: {
          totalCommits: sql`${contributors.totalCommits} + 1`,
          lastCommitAt: new Date(c.commit.author?.date || Date.now()),
          updatedAt: new Date(),
        },
      });

      inserted++;
      process.stdout.write(`\r${inserted}/${allCommits.length}`);
    } catch (e) {
      console.error(`\nFailed ${c.sha}:`, e);
    }
  }

  console.log(`\nDone. ${inserted} commits inserted.`);
  await pool.end();
}

main();
