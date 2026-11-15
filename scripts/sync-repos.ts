import { Octokit } from "@octokit/rest";
import { syncOrgRepos } from "../lib/github/sync-repos";
import { getActiveOrgs, getOrgBySlug } from "../lib/orgs";

const orgFlag = process.argv.indexOf("--org");
const slug = orgFlag >= 0 ? process.argv[orgFlag + 1] : null;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const targets = slug
	? [await getOrgBySlug(slug)].filter((o) => o !== null)
	: await getActiveOrgs();

for (const org of targets) {
	const count = await syncOrgRepos(octokit, org);
	console.log(`${org.slug}: ${count} repos synced`);
}
process.exit(0);
