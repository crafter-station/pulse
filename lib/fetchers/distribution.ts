import { Octokit } from "@octokit/rest";

/**
 * Parse a human-readable install count like "20", "14.1K", "1.2M" into an integer.
 */
export function parseCount(raw: string): number {
	const match = raw.trim().match(/^([\d.]+)\s*([KM]?)$/i);
	if (!match) return 0;
	const [, num, suffix] = match;
	const n = parseFloat(num);
	if (Number.isNaN(n)) return 0;
	const mult = suffix.toUpperCase() === "K" ? 1000 : suffix.toUpperCase() === "M" ? 1_000_000 : 1;
	return Math.round(n * mult);
}

/**
 * Fetch last-month downloads for an npm package. Returns null on failure
 * (e.g. package doesn't exist, network error).
 */
export async function fetchNpmDownloads(
	pkgName: string,
	period: "last-day" | "last-week" | "last-month" = "last-month",
): Promise<number | null> {
	try {
		const encoded = encodeURIComponent(pkgName);
		const res = await fetch(
			`https://api.npmjs.org/downloads/point/${period}/${encoded}`,
			{ headers: { Accept: "application/json" } },
		);
		if (!res.ok) return null;
		const json = (await res.json()) as { downloads?: number };
		return typeof json.downloads === "number" ? json.downloads : null;
	} catch (err) {
		console.error(`[npm] ${pkgName} failed:`, (err as Error).message);
		return null;
	}
}

/**
 * Fetch historical daily downloads for an npm package in a date range.
 * Returns null on failure or an array of { date, downloads }.
 */
export async function fetchNpmRange(
	pkgName: string,
	start: string, // YYYY-MM-DD
	end: string, // YYYY-MM-DD
): Promise<Array<{ date: string; downloads: number }> | null> {
	try {
		const encoded = encodeURIComponent(pkgName);
		const res = await fetch(
			`https://api.npmjs.org/downloads/range/${start}:${end}/${encoded}`,
			{ headers: { Accept: "application/json" } },
		);
		if (!res.ok) return null;
		const json = (await res.json()) as {
			downloads?: Array<{ day: string; downloads: number }>;
		};
		if (!json.downloads) return null;
		return json.downloads.map((d) => ({ date: d.day, downloads: d.downloads }));
	} catch (err) {
		console.error(`[npm range] ${pkgName} failed:`, (err as Error).message);
		return null;
	}
}

/**
 * Scrape skills.sh to get total install count for an entire org.
 * Returns the org-level aggregate number, or null on failure.
 *
 * skills.sh has no JSON API; we parse the rendered HTML looking for the
 * "N total installs" string on the owner page.
 */
export async function fetchSkillsShOrgTotal(
	org: string,
): Promise<number | null> {
	try {
		const res = await fetch(`https://skills.sh/${org}`, {
			headers: { "User-Agent": "pulse-crafter-run/1.0" },
		});
		if (!res.ok) return null;
		const html = await res.text();
		// Pattern: "519","total installs" or "519 total installs"
		const match = html.match(/([\d.]+[KM]?)\s*(?:<[^>]+>)?\s*(?:<!--[^>]*-->\s*)?\s*["']?\s*,?\s*["']?\s*total installs/i);
		if (!match) {
			// Fallback: look for the number preceding "total installs" more loosely
			const alt = html.match(/>(\d+[KM]?)<[^>]*>[^<]*total installs/i);
			if (!alt) return null;
			return parseCount(alt[1]);
		}
		return parseCount(match[1]);
	} catch (err) {
		console.error(`[skills.sh] ${org} failed:`, (err as Error).message);
		return null;
	}
}

/**
 * Scrape skills.sh for a specific repo's install count.
 */
export async function fetchSkillsShRepoTotal(
	owner: string,
	repo: string,
): Promise<number | null> {
	try {
		const res = await fetch(`https://skills.sh/${owner}/${repo}`, {
			headers: { "User-Agent": "pulse-crafter-run/1.0" },
		});
		if (!res.ok) return null;
		const html = await res.text();
		const match = html.match(/([\d.]+[KM]?)\s*(?:<[^>]+>)?\s*(?:<!--[^>]*-->\s*)?\s*["']?\s*,?\s*["']?\s*total installs/i);
		if (!match) return null;
		return parseCount(match[1]);
	} catch (err) {
		console.error(`[skills.sh] ${owner}/${repo} failed:`, (err as Error).message);
		return null;
	}
}

/**
 * Fetch total downloads across all GitHub releases for a repo.
 */
export async function fetchGithubReleaseDownloads(
	owner: string,
	repo: string,
	octokit: Octokit,
): Promise<number | null> {
	try {
		const { data } = await octokit.repos.listReleases({
			owner,
			repo,
			per_page: 100,
		});
		let total = 0;
		for (const release of data) {
			for (const asset of release.assets) {
				total += asset.download_count ?? 0;
			}
		}
		return total;
	} catch (err) {
		const e = err as { status?: number; message?: string };
		if (e.status !== 404) {
			console.error(
				`[gh releases] ${owner}/${repo} failed:`,
				e.message,
			);
		}
		return null;
	}
}
