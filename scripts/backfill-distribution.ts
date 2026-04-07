import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import { fetchNpmRange } from "../lib/fetchers/distribution";
import { packageStats, packages } from "../lib/db/schema";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const DEFAULT_DAYS = 90;

function formatDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

async function main() {
	const args = process.argv.slice(2);
	const daysArg = args.indexOf("--days");
	const days = daysArg >= 0 ? Number(args[daysArg + 1]) : DEFAULT_DAYS;

	const end = new Date();
	const start = new Date();
	start.setDate(start.getDate() - days);

	console.log(`Backfilling npm history: ${formatDate(start)} → ${formatDate(end)} (${days}d)`);

	const allPackages = await db
		.select()
		.from(packages)
		.where(eq(packages.isActive, true));

	let totalInserted = 0;
	for (const pkg of allPackages) {
		if (!pkg.npmName) {
			console.log(`⏭  ${pkg.slug} (no npm name)`);
			continue;
		}

		const range = await fetchNpmRange(
			pkg.npmName,
			formatDate(start),
			formatDate(end),
		);
		if (!range) {
			console.log(`✗ ${pkg.slug} (fetch failed)`);
			continue;
		}

		const rows = range
			.filter((r) => r.downloads > 0)
			.map((r) => ({
				packageId: pkg.id,
				source: "npm",
				metric: "downloads_daily_historical",
				value: r.downloads,
				capturedAt: new Date(`${r.date}T12:00:00Z`),
			}));

		if (rows.length === 0) {
			console.log(`  ${pkg.slug}: 0 days with downloads`);
			continue;
		}

		// Insert in batches of 100 to avoid overwhelming a single query
		for (let i = 0; i < rows.length; i += 100) {
			await db.insert(packageStats).values(rows.slice(i, i + 100));
		}
		totalInserted += rows.length;
		console.log(`✓ ${pkg.slug}: ${rows.length} days inserted`);
	}

	console.log(`\n✨ Backfill complete: ${totalInserted} rows inserted`);
	await pool.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
