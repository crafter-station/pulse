import { db } from "@/lib/db";
import { repos } from "@/lib/db/schema";
import { Octokit } from "@octokit/rest";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
});

export async function POST() {
	try {
		const allRepos = await db
			.select({ name: repos.name, fullName: repos.fullName, isPrivate: repos.isPrivate })
			.from(repos)
			.where(eq(repos.isActive, true));

		const results: { name: string; before: boolean; after: boolean }[] = [];

		for (const repo of allRepos) {
			const [owner, repoName] = repo.fullName.split("/");
			try {
				const { data } = await octokit.repos.get({ owner, repo: repoName });
				const isPrivate = data.private;

				if (repo.isPrivate !== isPrivate) {
					await db
						.update(repos)
						.set({ isPrivate, updatedAt: new Date() })
						.where(eq(repos.name, repo.name));

					results.push({ name: repo.name, before: repo.isPrivate ?? false, after: isPrivate });
				}
			} catch {
				continue;
			}
		}

		return NextResponse.json({
			synced: results.length,
			changes: results,
		});
	} catch (error) {
		console.error("Sync visibility error:", error);
		return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
	}
}
