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

		// DEBUG: Log secret info (remove after debugging)
		const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
		console.log("DEBUG - Secret defined:", !!secret);
		console.log("DEBUG - Secret length:", secret.length);
		console.log("DEBUG - Secret preview:", secret.substring(0, 8) + "..." + secret.substring(secret.length - 8));
		console.log("DEBUG - Signature from GitHub:", signature);

		if (!signature) {
			return NextResponse.json({ error: "Missing signature" }, { status: 401 });
		}

		const isValid = await webhooks.verify(body, signature);
		console.log("DEBUG - Signature valid:", isValid);

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
			let additions = 0;
			let deletions = 0;
			let authorAvatarUrl = pusherAvatar;

			try {
				const { data: commitDetails } = await octokit.repos.getCommit({
					owner: payload.repository.owner.login || payload.repository.owner.name,
					repo: repoName,
					ref: commit.id,
				});
				additions = commitDetails.stats?.additions || 0;
				deletions = commitDetails.stats?.deletions || 0;
				authorAvatarUrl = commitDetails.author?.avatar_url || pusherAvatar;
			} catch (error) {
				console.error(`Failed to fetch stats for commit ${commit.id}:`, error);
			}

			const commitData = {
				id: commit.id,
				repoName,
				authorUsername: commit.author.username || pusher,
				authorAvatarUrl,
				message: commit.message,
				additions,
				deletions,
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
