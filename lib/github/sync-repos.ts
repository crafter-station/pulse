import { Octokit } from "@octokit/rest";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { repoStats, repos } from "../db/schema";
import type { Org } from "../orgs";

type RepoNode = {
	name: string;
	nameWithOwner: string;
	isPrivate: boolean;
	isFork: boolean;
	isArchived: boolean;
	createdAt: string;
	pushedAt: string | null;
	description: string | null;
	homepageUrl: string | null;
	stargazerCount: number;
	forkCount: number;
	defaultBranchRef: { name: string } | null;
};

type ReposPage = {
	organization: {
		repositories: {
			nodes: RepoNode[];
			pageInfo: { hasNextPage: boolean; endCursor: string | null };
		};
	} | null;
};

const QUERY = `
	query ($login: String!, $after: String) {
		organization(login: $login) {
			repositories(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: DESC }) {
				nodes {
					name
					nameWithOwner
					isPrivate
					isFork
					isArchived
					createdAt
					pushedAt
					description
					homepageUrl
					stargazerCount
					forkCount
					defaultBranchRef { name }
				}
				pageInfo { hasNextPage endCursor }
			}
		}
	}
`;

export async function fetchOrgRepos(
	octokit: Octokit,
	login: string,
): Promise<RepoNode[]> {
	const all: RepoNode[] = [];
	let after: string | null = null;
	do {
		const page: ReposPage = await octokit.graphql<ReposPage>(QUERY, {
			login,
			after,
		});
		const conn = page.organization?.repositories;
		if (!conn) break;
		all.push(...conn.nodes);
		after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
	} while (after);
	return all;
}

/** Upsert every repo of the org with GitHub metadata. Returns the number of repos synced. */
export async function syncOrgRepos(octokit: Octokit, org: Org): Promise<number> {
	const nodes = await fetchOrgRepos(octokit, org.githubOrg);
	const now = new Date();
	const today = now.toISOString().slice(0, 10);

	for (const r of nodes) {
		const metadata = {
			fullName: r.nameWithOwner,
			isPrivate: r.isPrivate,
			isFork: r.isFork,
			isArchived: r.isArchived,
			description: r.description,
			homepage: r.homepageUrl || null,
			stars: r.stargazerCount,
			forks: r.forkCount,
			defaultBranch: r.defaultBranchRef?.name ?? null,
			githubCreatedAt: new Date(r.createdAt),
			syncedAt: now,
			updatedAt: now,
		};
		const [row] = await db
			.insert(repos)
			.values({
				orgId: org.id,
				name: r.name,
				lastPushAt: r.pushedAt ? new Date(r.pushedAt) : null,
				...metadata,
			})
			.onConflictDoUpdate({
				target: [repos.orgId, repos.name],
				set: {
					...metadata,
					lastPushAt: sql`coalesce(${repos.lastPushAt}, excluded.last_push_at)`,
				},
			})
			.returning({ id: repos.id });
		await db
			.insert(repoStats)
			.values({ repoId: row.id, metric: "stars", value: r.stargazerCount, capturedOn: today })
			.onConflictDoUpdate({
				target: [repoStats.repoId, repoStats.metric, repoStats.capturedOn],
				set: { value: r.stargazerCount },
			});
	}
	return nodes.length;
}
