import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgFromRequest } from "@/lib/org-filter";

/**
 * GET /api/distribution/timeseries?org=<slug|all>&days=30
 *
 * Returns daily npm download history per package from
 * metric='downloads_daily_historical'. Used by the recharts timeseries.
 */
export async function GET(request: Request) {
	try {
		const org = await resolveOrgFromRequest(request);
		const orgId = org?.id ?? null;
		const { searchParams } = new URL(request.url);
		const days = Math.max(
			7,
			Math.min(90, Number(searchParams.get("days") ?? "30")),
		);

		const start = new Date();
		start.setDate(start.getDate() - days);

		const rows = await db.execute(sql`
			SELECT
				p.id as "packageId",
				p.slug,
				p.display_name as "displayName",
				p.monorepo,
				o.slug as "orgSlug",
				date_trunc('day', ps.captured_at) as "day",
				ps.value
			FROM package_stats ps
			JOIN packages p ON p.id = ps.package_id
			JOIN orgs o ON o.id = p.org_id
			WHERE ps.source = 'npm'
				AND ps.metric = 'downloads_daily_historical'
				AND ps.captured_at >= ${start.toISOString()}
				AND (${orgId}::int IS NULL OR p.org_id = ${orgId}::int)
				AND p.is_active = true
			ORDER BY p.slug, ps.captured_at ASC
		`);

		type Row = {
			packageId: number;
			slug: string;
			displayName: string;
			monorepo: string | null;
			orgSlug: string;
			day: string;
			value: number;
		};

		// Group by day, one column per package slug
		const byDay = new Map<string, Record<string, number | string>>();
		const slugs = new Set<string>();

		for (const row of rows.rows as unknown as Row[]) {
			const day = String(row.day).slice(0, 10);
			slugs.add(row.slug);
			if (!byDay.has(day)) byDay.set(day, { day });
			const record = byDay.get(day);
			if (!record) continue;
			record[row.slug] = Number(row.value);
		}

		const series = [...byDay.values()].sort((a, b) =>
			String(a.day).localeCompare(String(b.day)),
		);

		// Compute 7d delta per package from the series
		const deltas: Record<
			string,
			{ last7: number; prev7: number; change: number }
		> = {};

		for (const slug of slugs) {
			let last7 = 0;
			let prev7 = 0;
			const sorted = [...series];
			const lastIdx = sorted.length - 1;
			for (let i = 0; i < sorted.length; i++) {
				const record = sorted[i] as Record<string, number | string>;
				const value = Number(record[slug] ?? 0);
				if (i >= lastIdx - 6) last7 += value;
				else if (i >= lastIdx - 13 && i < lastIdx - 6) prev7 += value;
			}
			const change =
				prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);
			deltas[slug] = { last7, prev7, change };
		}

		return NextResponse.json({
			org: org?.slug ?? "all",
			days,
			packages: [...slugs],
			series,
			deltas,
		});
	} catch (error) {
		console.error("Timeseries API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch timeseries" },
			{ status: 500 },
		);
	}
}
