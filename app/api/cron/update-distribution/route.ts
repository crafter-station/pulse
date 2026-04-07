import { Octokit } from "@octokit/rest";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orgs, packageStats, packages } from "@/lib/db/schema";
import {
	fetchGithubReleaseDownloads,
	fetchNpmDownloads,
	fetchSkillsShOrgTotal,
	fetchSkillsShRepoTotal,
} from "@/lib/fetchers/distribution";

export const maxDuration = 300;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * GET /api/cron/update-distribution
 *
 * Run by Vercel Cron every 6 hours. Walks all active orgs, fetches
 * npm downloads + skills.sh installs + GitHub release downloads for
 * each package, and appends a row to package_stats.
 *
 * Protected by CRON_SECRET (Vercel injects the Bearer token).
 */
export async function GET(request: Request) {
	const auth = request.headers.get("authorization");
	const expected = process.env.CRON_SECRET;
	if (expected && auth !== `Bearer ${expected}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const started = Date.now();
	const log: string[] = [];
	let inserted = 0;
	let failed = 0;

	try {
		const allOrgs = await db.select().from(orgs).where(eq(orgs.isActive, true));
		const allPackages = await db
			.select()
			.from(packages)
			.where(eq(packages.isActive, true));

		// Pre-fetch skills.sh org totals (one call per org)
		const orgSkillsTotal = new Map<number, number | null>();
		for (const org of allOrgs) {
			if (!org.skillsShOrg) {
				orgSkillsTotal.set(org.id, null);
				continue;
			}
			const total = await fetchSkillsShOrgTotal(org.skillsShOrg);
			orgSkillsTotal.set(org.id, total);
			log.push(
				`skills.sh[${org.slug}] total = ${total === null ? "null" : total}`,
			);
			if (total !== null) {
				// Record org-level aggregate as a synthetic package row? Skip —
				// the per-repo counts sum to it and we don't want to double-count.
			}
		}

		for (const pkg of allPackages) {
			const rows: Array<{
				packageId: number;
				source: string;
				metric: string;
				value: number;
			}> = [];

			// npm
			if (pkg.npmName) {
				const daily = await fetchNpmDownloads(pkg.npmName, "last-day");
				const weekly = await fetchNpmDownloads(pkg.npmName, "last-week");
				const monthly = await fetchNpmDownloads(pkg.npmName, "last-month");
				if (daily !== null)
					rows.push({
						packageId: pkg.id,
						source: "npm",
						metric: "downloads_last_day",
						value: daily,
					});
				if (weekly !== null)
					rows.push({
						packageId: pkg.id,
						source: "npm",
						metric: "downloads_last_week",
						value: weekly,
					});
				if (monthly !== null)
					rows.push({
						packageId: pkg.id,
						source: "npm",
						metric: "downloads_last_month",
						value: monthly,
					});
				log.push(
					`npm[${pkg.slug}] day=${daily} week=${weekly} month=${monthly}`,
				);
			}

			// skills.sh (repo-level)
			if (pkg.skillsSlug) {
				const [owner, repo] = pkg.skillsSlug.split("/");
				if (owner && repo) {
					const total = await fetchSkillsShRepoTotal(owner, repo);
					if (total !== null) {
						rows.push({
							packageId: pkg.id,
							source: "skills_sh",
							metric: "installs_total",
							value: total,
						});
					}
					log.push(`skills.sh[${pkg.slug}] = ${total}`);
				}
			}

			// GitHub release downloads
			if (pkg.githubRepo) {
				const [owner, repo] = pkg.githubRepo.split("/");
				if (owner && repo) {
					const total = await fetchGithubReleaseDownloads(owner, repo, octokit);
					if (total !== null && total > 0) {
						rows.push({
							packageId: pkg.id,
							source: "github_release",
							metric: "downloads_total",
							value: total,
						});
					}
					if (total !== null) {
						log.push(`gh[${pkg.slug}] releases = ${total}`);
					}
				}
			}

			if (rows.length > 0) {
				await db.insert(packageStats).values(rows);
				inserted += rows.length;
			} else {
				failed++;
			}
		}

		return NextResponse.json({
			ok: true,
			orgs: allOrgs.length,
			packages: allPackages.length,
			rowsInserted: inserted,
			failedPackages: failed,
			durationMs: Date.now() - started,
			log,
		});
	} catch (error) {
		console.error("Cron distribution error:", error);
		return NextResponse.json(
			{
				error: (error as Error).message,
				log,
				durationMs: Date.now() - started,
			},
			{ status: 500 },
		);
	}
}
