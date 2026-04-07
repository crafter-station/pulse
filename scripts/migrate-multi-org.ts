import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATIONS: { name: string; sql: string }[] = [
	{
		name: "001_create_orgs",
		sql: `
			CREATE TABLE IF NOT EXISTS "orgs" (
				"id" serial PRIMARY KEY NOT NULL,
				"slug" text NOT NULL,
				"display_name" text NOT NULL,
				"github_org" text NOT NULL,
				"skills_sh_org" text,
				"description" text,
				"is_active" boolean DEFAULT true,
				"created_at" timestamp DEFAULT now(),
				CONSTRAINT "orgs_slug_unique" UNIQUE("slug"),
				CONSTRAINT "orgs_github_org_unique" UNIQUE("github_org")
			);
		`,
	},
	{
		name: "002_seed_orgs",
		sql: `
			INSERT INTO "orgs" ("slug", "display_name", "github_org", "skills_sh_org", "description")
			VALUES
				('crafter-station', 'Crafter Station', 'crafter-station', 'crafter-station', 'Peru tech ecosystem builder — open-source tools, hackathons, community'),
				('crafter-research', 'Crafter Research', 'crafter-research', NULL, 'Research lab where every paper has a working prototype')
			ON CONFLICT ("slug") DO NOTHING;
		`,
	},
	{
		name: "003_add_org_id_to_repos",
		sql: `
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "org_id" integer REFERENCES "orgs"("id");
		`,
	},
	{
		name: "004_backfill_repos_org_id",
		sql: `
			UPDATE "repos"
			SET "org_id" = (SELECT "id" FROM "orgs" WHERE "slug" = 'crafter-station')
			WHERE "org_id" IS NULL;
		`,
	},
	{
		name: "005_drop_repos_name_unique",
		sql: `
			ALTER TABLE "repos" DROP CONSTRAINT IF EXISTS "repos_name_unique";
			ALTER TABLE "repos" DROP CONSTRAINT IF EXISTS "repos_name_key";
		`,
	},
	{
		name: "006_create_repos_org_name_unique",
		sql: `
			CREATE UNIQUE INDEX IF NOT EXISTS "repos_org_name_unique" ON "repos" ("org_id", "name");
		`,
	},
	{
		name: "007_add_org_id_to_commits",
		sql: `
			ALTER TABLE "commits" ADD COLUMN IF NOT EXISTS "org_id" integer REFERENCES "orgs"("id");
		`,
	},
	{
		name: "008_backfill_commits_org_id",
		sql: `
			UPDATE "commits"
			SET "org_id" = (SELECT "id" FROM "orgs" WHERE "slug" = 'crafter-station')
			WHERE "org_id" IS NULL;
		`,
	},
	{
		name: "009_create_commits_indexes",
		sql: `
			CREATE INDEX IF NOT EXISTS "commits_org_idx" ON "commits" ("org_id");
			CREATE INDEX IF NOT EXISTS "commits_pushed_at_idx" ON "commits" ("pushed_at");
		`,
	},
	{
		name: "010_create_packages",
		sql: `
			CREATE TABLE IF NOT EXISTS "packages" (
				"id" serial PRIMARY KEY NOT NULL,
				"org_id" integer NOT NULL REFERENCES "orgs"("id"),
				"slug" text NOT NULL,
				"npm_name" text,
				"github_repo" text,
				"skills_slug" text,
				"display_name" text NOT NULL,
				"description" text,
				"category" text,
				"monorepo" text,
				"is_active" boolean DEFAULT true,
				"created_at" timestamp DEFAULT now(),
				CONSTRAINT "packages_slug_unique" UNIQUE("slug")
			);
			CREATE INDEX IF NOT EXISTS "packages_org_idx" ON "packages" ("org_id");
			CREATE INDEX IF NOT EXISTS "packages_monorepo_idx" ON "packages" ("monorepo");
		`,
	},
	{
		name: "011_create_package_stats",
		sql: `
			CREATE TABLE IF NOT EXISTS "package_stats" (
				"id" serial PRIMARY KEY NOT NULL,
				"package_id" integer NOT NULL REFERENCES "packages"("id"),
				"source" text NOT NULL,
				"metric" text NOT NULL,
				"value" integer NOT NULL,
				"captured_at" timestamp DEFAULT now() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS "package_stats_pkg_source_captured_idx" ON "package_stats" ("package_id", "source", "captured_at");
			CREATE INDEX IF NOT EXISTS "package_stats_captured_at_idx" ON "package_stats" ("captured_at");
		`,
	},
	{
		name: "012_create_migrations_ledger",
		sql: `
			CREATE TABLE IF NOT EXISTS "_pulse_migrations" (
				"name" text PRIMARY KEY,
				"applied_at" timestamp DEFAULT now()
			);
		`,
	},
];

async function run() {
	const client = await pool.connect();
	try {
		// Bootstrap ledger first if it doesn't exist
		await client.query(`
			CREATE TABLE IF NOT EXISTS "_pulse_migrations" (
				"name" text PRIMARY KEY,
				"applied_at" timestamp DEFAULT now()
			);
		`);

		const applied = new Set<string>();
		const { rows } = await client.query<{ name: string }>(
			`SELECT "name" FROM "_pulse_migrations";`,
		);
		for (const r of rows) applied.add(r.name);

		for (const m of MIGRATIONS) {
			if (applied.has(m.name)) {
				console.log(`⏭  ${m.name} (already applied)`);
				continue;
			}
			console.log(`▶  ${m.name}`);
			await client.query("BEGIN");
			try {
				await client.query(m.sql);
				await client.query(
					`INSERT INTO "_pulse_migrations" ("name") VALUES ($1) ON CONFLICT DO NOTHING;`,
					[m.name],
				);
				await client.query("COMMIT");
				console.log(`✓  ${m.name}`);
			} catch (err) {
				await client.query("ROLLBACK");
				console.error(`✗  ${m.name} failed:`, err);
				throw err;
			}
		}

		console.log("\n✨ All migrations applied");
	} finally {
		client.release();
		await pool.end();
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
