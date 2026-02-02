import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { db } from "@/lib/db";
import { commits, repos, contributors } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const webhooks = new Webhooks({
	secret: process.env.GITHUB_WEBHOOK_SECRET || "",
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

		if (event !== "push") {
			return NextResponse.json({ message: "Event ignored" }, { status: 200 });
		}

		const payload = JSON.parse(body);

		if (payload.ref !== "refs/heads/main") {
			return NextResponse.json({ message: "Non-main branch, ignored" }, { status: 200 });
		}

		const repoName = payload.repository.name;
		const fullRepoName = payload.repository.full_name;
		const pusher = payload.pusher.name;
		const pusherAvatar = payload.sender.avatar_url;

		await db
			.insert(repos)
			.values({
				name: repoName,
				fullName: fullRepoName,
				lastPushAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: repos.name,
				set: {
					lastPushAt: new Date(),
					updatedAt: new Date(),
				},
			});

		for (const commit of payload.commits) {
			const commitData = {
				id: commit.id,
				repoName,
				authorUsername: commit.author.username || pusher,
				authorAvatarUrl: pusherAvatar,
				message: commit.message,
				additions: commit.added?.length || 0,
				deletions: commit.removed?.length || 0,
				commitUrl: commit.url,
				pushedAt: new Date(commit.timestamp),
			};

			await db.insert(commits).values(commitData).onConflictDoNothing();

			await db
				.insert(contributors)
				.values({
					username: commitData.authorUsername,
					avatarUrl: commitData.authorAvatarUrl,
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

		return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
