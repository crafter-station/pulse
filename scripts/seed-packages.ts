import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type Seed = {
	orgSlug: string;
	slug: string;
	npmName: string | null;
	githubRepo: string | null;
	skillsSlug: string | null;
	displayName: string;
	description: string | null;
	category: "cli" | "library" | "component";
	monorepo: string | null;
};

const PACKAGES: Seed[] = [
	// crafter-station
	{
		orgSlug: "crafter-station",
		slug: "trx",
		npmName: "@crafter/trx",
		githubRepo: "crafter-station/trx",
		skillsSlug: "crafter-station/trx",
		displayName: "trx",
		description: "Agent-first CLI for audio/video transcription via Whisper",
		category: "cli",
		monorepo: null,
	},
	{
		orgSlug: "crafter-station",
		slug: "spoti-cli",
		npmName: "@crafter/spoti-cli",
		githubRepo: "crafter-station/spoti-cli",
		skillsSlug: null,
		displayName: "spoti-cli",
		description: "Spotify Web API from your terminal",
		category: "cli",
		monorepo: null,
	},
	{
		orgSlug: "crafter-station",
		slug: "skillkit",
		npmName: "@crafter/skillkit",
		githubRepo: "crafter-station/skill-kit",
		skillsSlug: "crafter-station/skill-kit",
		displayName: "skillkit",
		description: "Local-first analytics for AI agent skills",
		category: "cli",
		monorepo: null,
	},
	{
		orgSlug: "crafter-station",
		slug: "flow",
		npmName: "@crafter/flow",
		githubRepo: "crafter-station/flow",
		skillsSlug: null,
		displayName: "flow",
		description:
			"Zero-dependency tree layout and infinite canvas library for React",
		category: "library",
		monorepo: null,
	},
	{
		orgSlug: "crafter-station",
		slug: "mermaid",
		npmName: "@crafter/mermaid",
		githubRepo: "crafter-station/mermaid",
		skillsSlug: null,
		displayName: "@crafter/mermaid",
		description: "Zero-dependency Mermaid diagram toolkit (umbrella package)",
		category: "library",
		monorepo: "mermaid",
	},
	{
		orgSlug: "crafter-station",
		slug: "mermaid-parser",
		npmName: "@crafter/mermaid-parser",
		githubRepo: "crafter-station/mermaid",
		skillsSlug: null,
		displayName: "mermaid-parser",
		description:
			"Zero-dependency Mermaid diagram parser that outputs an AST with source positions",
		category: "library",
		monorepo: "mermaid",
	},
	{
		orgSlug: "crafter-station",
		slug: "mermaid-layout",
		npmName: "@crafter/mermaid-layout",
		githubRepo: "crafter-station/mermaid",
		skillsSlug: null,
		displayName: "mermaid-layout",
		description:
			"Zero-dependency layout engine for Mermaid diagrams (Sugiyama)",
		category: "library",
		monorepo: "mermaid",
	},
	{
		orgSlug: "crafter-station",
		slug: "mermaid-renderer",
		npmName: "@crafter/mermaid-renderer",
		githubRepo: "crafter-station/mermaid",
		skillsSlug: null,
		displayName: "mermaid-renderer",
		description: "Zero-dependency SVG renderer for positioned Mermaid graphs",
		category: "library",
		monorepo: "mermaid",
	},
	{
		orgSlug: "crafter-station",
		slug: "mermaid-themes",
		npmName: "@crafter/mermaid-themes",
		githubRepo: "crafter-station/mermaid",
		skillsSlug: null,
		displayName: "mermaid-themes",
		description: "Zero-dependency theme system for Mermaid diagrams",
		category: "library",
		monorepo: "mermaid",
	},
	{
		orgSlug: "crafter-station",
		slug: "mermaid-cli",
		npmName: "@crafter/mermaid-cli",
		githubRepo: "crafter-station/mermaid",
		skillsSlug: null,
		displayName: "mermaid-cli",
		description: "CLI for the @crafter/mermaid toolkit",
		category: "cli",
		monorepo: "mermaid",
	},
	{
		orgSlug: "crafter-station",
		slug: "mermaid-player",
		npmName: "@crafter/mermaid-player",
		githubRepo: "crafter-station/mermaid",
		skillsSlug: null,
		displayName: "mermaid-player",
		description: "Animated playback component for Mermaid diagrams",
		category: "component",
		monorepo: "mermaid",
	},
	// crafter-research
	{
		orgSlug: "crafter-research",
		slug: "sunat-cli",
		npmName: "@crafter/sunat-cli",
		githubRepo: "crafter-research/sunat-cli",
		skillsSlug: null,
		displayName: "sunat-cli",
		description: "Agent-first CLI for SUNAT tax automation (Peru gov-tech)",
		category: "cli",
		monorepo: null,
	},
];

async function run() {
	const client = await pool.connect();
	try {
		const { rows: orgRows } = await client.query<{ id: number; slug: string }>(
			`SELECT id, slug FROM orgs;`,
		);
		const orgIdBySlug = new Map(orgRows.map((r) => [r.slug, r.id]));

		let inserted = 0;
		let updated = 0;
		for (const p of PACKAGES) {
			const orgId = orgIdBySlug.get(p.orgSlug);
			if (!orgId) {
				console.warn(`⚠  missing org ${p.orgSlug} for ${p.slug}`);
				continue;
			}

			const res = await client.query(
				`
				INSERT INTO packages
					(org_id, slug, npm_name, github_repo, skills_slug, display_name, description, category, monorepo, is_active)
				VALUES
					($1,     $2,   $3,       $4,          $5,          $6,           $7,          $8,       $9,       true)
				ON CONFLICT (slug) DO UPDATE SET
					org_id       = EXCLUDED.org_id,
					npm_name     = EXCLUDED.npm_name,
					github_repo  = EXCLUDED.github_repo,
					skills_slug  = EXCLUDED.skills_slug,
					display_name = EXCLUDED.display_name,
					description  = EXCLUDED.description,
					category     = EXCLUDED.category,
					monorepo     = EXCLUDED.monorepo
				RETURNING (xmax = 0) AS inserted;
				`,
				[
					orgId,
					p.slug,
					p.npmName,
					p.githubRepo,
					p.skillsSlug,
					p.displayName,
					p.description,
					p.category,
					p.monorepo,
				],
			);
			if (res.rows[0]?.inserted) {
				inserted++;
				console.log(`+ ${p.slug}`);
			} else {
				updated++;
				console.log(`~ ${p.slug}`);
			}
		}

		console.log(`\n✓ ${inserted} inserted, ${updated} updated`);
	} finally {
		client.release();
		await pool.end();
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
