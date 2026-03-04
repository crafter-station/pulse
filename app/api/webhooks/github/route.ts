import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";
import { db } from "@/lib/db";
import { commits, repos, contributors } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const webhooks = new Webhooks({
	secret: process.env.GITHUB_WEBHOOK_SECRET || "",
});

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		const signature = request.headers.get("x-hub-signature-256");
		const event = request.headers.get("x-github-event");

		if (!signature) {
			return NextResponse.json({ error: "Missing signature" }, { status: 401 });
		}

		const isValid = await webhooks.verify(body, signature);
		if (!isValid) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		if (event === "repository") {
			const payload = JSON.parse(body);
			if (payload.action === "publicized" || payload.action === "privatized") {
				const repoName = payload.repository.name;
				const isPrivate = payload.action === "privatized";

				await db
					.update(repos)
					.set({ isPrivate, updatedAt: new Date() })
					.where(eq(repos.name, repoName));

				return NextResponse.json({ message: `Repository visibility updated to ${isPrivate ? "private" : "public"}` }, { status: 200 });
			}
			return NextResponse.json({ message: "Repository event ignored" }, { status: 200 });
		}

		if (event !== "push") {
			return NextResponse.json({ message: "Event ignored" }, { status: 200 });
		}

		const payload = JSON.parse(body);

		if (payload.ref !== "refs/heads/main") {
			return NextResponse.json({ message: "Non-main branch, ignored" }, { status: 200 });
		}

		const repoName = payload.repository.name;
		const fullRepoName = payload.repository.full_name;
		const repoOwner = fullRepoName.split("/")[0];
		const isPrivate = Boolean(payload.repository?.private);
		const pusher = payload.pusher.name;
		const pusherAvatar = payload.sender.avatar_url;

		await db
			.insert(repos)
			.values({
				name: repoName,
				fullName: fullRepoName,
				isPrivate,
				lastPushAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: repos.name,
				set: {
					isPrivate,
					lastPushAt: new Date(),
					updatedAt: new Date(),
				},
			});

		const commitStats = await Promise.all(
			payload.commits.map(async (commit: any) => {
				try {
					const { data } = await octokit.repos.getCommit({
						owner: repoOwner,
						repo: repoName,
						ref: commit.id,
					});
					return {
						id: commit.id,
						additions: data.stats?.additions || 0,
						deletions: data.stats?.deletions || 0,
						avatarUrl: data.author?.avatar_url || pusherAvatar,
					};
				} catch {
					return { id: commit.id, additions: 0, deletions: 0, avatarUrl: pusherAvatar };
				}
			}),
		);

		const statsMap = new Map(commitStats.map((s) => [s.id, s]));

		for (const commit of payload.commits) {
			const stats = statsMap.get(commit.id)!;

			await db
				.insert(commits)
				.values({
					id: commit.id,
					repoName,
					authorUsername: commit.author.username || pusher,
					authorAvatarUrl: stats.avatarUrl,
					message: commit.message,
					additions: stats.additions,
					deletions: stats.deletions,
					commitUrl: commit.url,
					pushedAt: new Date(commit.timestamp),
				})
				.onConflictDoUpdate({
					target: commits.id,
					set: {
						additions: stats.additions,
						deletions: stats.deletions,
						authorAvatarUrl: stats.avatarUrl,
					},
				});

			await db
				.insert(contributors)
				.values({
					username: commit.author.username || pusher,
					avatarUrl: stats.avatarUrl,
					totalCommits: 1,
					lastCommitAt: new Date(commit.timestamp),
				})
				.onConflictDoUpdate({
					target: contributors.username,
					set: {
						totalCommits: sql`${contributors.totalCommits} + 1`,
						lastCommitAt: new Date(commit.timestamp),
						updatedAt: new Date(),
					},
				});
		}

		return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
