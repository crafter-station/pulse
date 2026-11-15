import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATIONS: { name: string; sql: string }[] = [
	{
		name: "101_repos_metadata",
		sql: `
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "description" text;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "homepage" text;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "stars" integer DEFAULT 0;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "forks" integer DEFAULT 0;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "is_fork" boolean DEFAULT false;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "default_branch" text;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "github_created_at" timestamp;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "synced_at" timestamp;
		`,
	},
	{
		name: "103_repos_creator",
		sql: `
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "creator_login" text;
			ALTER TABLE "repos" ADD COLUMN IF NOT EXISTS "creator_source" text;
		`,
	},
	{
		name: "104_repo_stats",
		sql: `
			CREATE TABLE IF NOT EXISTS "repo_stats" (
				"id" serial PRIMARY KEY NOT NULL,
				"repo_id" integer NOT NULL REFERENCES "repos"("id") ON DELETE CASCADE,
				"metric" text NOT NULL,
				"value" integer NOT NULL,
				"captured_on" date NOT NULL
			);
			CREATE UNIQUE INDEX IF NOT EXISTS "repo_stats_repo_metric_day" ON "repo_stats" ("repo_id", "metric", "captured_on");
		`,
	},
	{
		name: "102_seed_lab_and_games_orgs",
		sql: `
			INSERT INTO "orgs" ("slug", "display_name", "github_org", "skills_sh_org", "description")
			VALUES
				('crafter-lab', 'Crafter Lab', 'crafter-lab', NULL, 'Ideas that take physical form.'),
				('crafter-games', 'Crafter Games', 'crafter-games', NULL, 'Curiosity plays too.')
			ON CONFLICT ("slug") DO NOTHING;
		`,
	},
];

async function main() {
	for (const m of MIGRATIONS) {
		console.log(`Running ${m.name}...`);
		await pool.query(m.sql);
	}
	console.log("Done.");
	await pool.end();
}

main().catch(async (err) => {
	console.error(err);
	await pool.end();
	process.exit(1);
});
