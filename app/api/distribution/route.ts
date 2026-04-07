import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgFromRequest } from "@/lib/org-filter";

/**
 * GET /api/distribution?org=<slug|all>
 *
 * Returns the latest value per (package, source, metric) tuple plus the
 * org totals so the dashboard can render a leaderboard + hero numbers
 * without doing its own aggregation client-side.
 */
export async function GET(request: Request) {
	try {
		const org = await resolveOrgFromRequest(request);
		const orgId = org?.id ?? null;

		// Latest stat per (package_id, source, metric) — use DISTINCT ON for a single-pass query.
		const latestStats = await db.execute(sql`
			SELECT DISTINCT ON (ps.package_id, ps.source, ps.metric)
				ps.package_id as "packageId",
				ps.source,
				ps.metric,
				ps.value,
				ps.captured_at as "capturedAt"
			FROM package_stats ps
			ORDER BY ps.package_id, ps.source, ps.metric, ps.captured_at DESC
		`);

		// Packages joined with their org info
		const packageRows = await db.execute(sql`
			SELECT
				p.id,
				p.slug,
				p.display_name as "displayName",
				p.description,
				p.category,
				p.monorepo,
				p.npm_name as "npmName",
				p.github_repo as "githubRepo",
				p.skills_slug as "skillsSlug",
				o.slug as "orgSlug",
				o.display_name as "orgName"
			FROM packages p
			JOIN orgs o ON o.id = p.org_id
			WHERE p.is_active = true
				AND (${orgId}::int IS NULL OR p.org_id = ${orgId}::int)
			ORDER BY p.org_id, p.slug
		`);

		type StatRow = {
			packageId: number;
			source: string;
			metric: string;
			value: number;
			capturedAt: string;
		};

		type PackageRow = {
			id: number;
			slug: string;
			displayName: string;
			description: string | null;
			category: string | null;
			monorepo: string | null;
			npmName: string | null;
			githubRepo: string | null;
			skillsSlug: string | null;
			orgSlug: string;
			orgName: string;
		};

		const statsByPackage = new Map<
			number,
			Record<string, { value: number; capturedAt: string }>
		>();
		for (const row of latestStats.rows as unknown as StatRow[]) {
			if (!statsByPackage.has(row.packageId))
				statsByPackage.set(row.packageId, {});
			const map = statsByPackage.get(row.packageId);
			if (!map) continue;
			map[`${row.source}:${row.metric}`] = {
				value: Number(row.value),
				capturedAt: row.capturedAt,
			};
		}

		const items = (packageRows.rows as unknown as PackageRow[]).map((pkg) => {
			const stats = statsByPackage.get(pkg.id) ?? {};
			return {
				id: pkg.id,
				slug: pkg.slug,
				displayName: pkg.displayName,
				description: pkg.description,
				category: pkg.category,
				monorepo: pkg.monorepo,
				npmName: pkg.npmName,
				githubRepo: pkg.githubRepo,
				skillsSlug: pkg.skillsSlug,
				org: {
					slug: pkg.orgSlug,
					name: pkg.orgName,
				},
				stats: {
					npmDay: stats["npm:downloads_last_day"]?.value ?? null,
					npmWeek: stats["npm:downloads_last_week"]?.value ?? null,
					npmMonth: stats["npm:downloads_last_month"]?.value ?? null,
					skillsInstalls: stats["skills_sh:installs_total"]?.value ?? null,
					ghReleaseDownloads:
						stats["github_release:downloads_total"]?.value ?? null,
				},
				capturedAt:
					stats["npm:downloads_last_month"]?.capturedAt ??
					stats["skills_sh:installs_total"]?.capturedAt ??
					null,
			};
		});

		// Aggregate totals
		const totals = items.reduce(
			(acc, item) => {
				acc.npmMonth += item.stats.npmMonth ?? 0;
				acc.npmWeek += item.stats.npmWeek ?? 0;
				acc.npmDay += item.stats.npmDay ?? 0;
				acc.skillsInstalls += item.stats.skillsInstalls ?? 0;
				acc.ghReleaseDownloads += item.stats.ghReleaseDownloads ?? 0;
				return acc;
			},
			{
				npmMonth: 0,
				npmWeek: 0,
				npmDay: 0,
				skillsInstalls: 0,
				ghReleaseDownloads: 0,
			},
		);

		const lastUpdatedAt = items
			.map((i) => i.capturedAt)
			.filter((v): v is string => Boolean(v))
			.sort()
			.pop();

		return NextResponse.json({
			org: org?.slug ?? "all",
			totals,
			packages: items,
			packageCount: items.length,
			lastUpdatedAt: lastUpdatedAt ?? null,
		});
	} catch (error) {
		console.error("Distribution API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch distribution" },
			{ status: 500 },
		);
	}
}
