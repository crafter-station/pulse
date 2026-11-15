import { eq } from "drizzle-orm";
import { OrgSelect, PeriodControl, ThemeToggle } from "@/components/pulse/Controls";
import { Drill } from "@/components/pulse/Drill";
import { db } from "@/lib/db";
import { orgs } from "@/lib/db/schema";
import { getOverview, PERIODS, parsePeriod } from "@/lib/overview";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");
const shortDate = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	timeZone: "America/Lima",
});
const monthName = (ym: string) =>
	new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
		new Date(`${ym}-15T00:00:00Z`),
	);
const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
	const diff = current - previous;
	if (diff === 0) {
		return (
			<span className="p-delta" data-dir="flat">
				Same as {label}
			</span>
		);
	}
	const up = diff > 0;
	return (
		<span className="p-delta" data-dir={up ? "up" : "down"}>
			<span aria-hidden="true">{up ? "↑" : "↓"}</span> {fmt(Math.abs(diff))}{" "}
			<span className="p-delta-label">
				{up ? "more" : "fewer"} than {label}
			</span>
		</span>
	);
}

type PageProps = { searchParams: Promise<{ org?: string; period?: string }> };

export default async function Home({ searchParams }: PageProps) {
	const params = await searchParams;
	const period = parsePeriod(params.period);
	const allOrgs = await db
		.select({ id: orgs.id, slug: orgs.slug, name: orgs.displayName })
		.from(orgs)
		.where(eq(orgs.isActive, true))
		.orderBy(orgs.id);
	const org = allOrgs.find((o) => o.slug === params.org) ?? null;
	const data = await getOverview(org?.id ?? null, period);
	const p = PERIODS[period];
	const orgParam = org?.slug ?? "all";
	const base = { org: orgParam, period };
	const scope = org ? org.name : `${allOrgs.length} orgs`;
	const maxStars = data.mostStarred[0]?.stars ?? 1;
	const maxMonth = Math.max(1, ...data.createdByMonth.map((m) => m.count));
	const busiest = data.createdByMonth.reduce<{ month: string; count: number } | null>(
		(best, m) => (!best || m.count > best.count ? m : best),
		null,
	);
	const periodText = p.label.toLowerCase();

	return (
		<div className="p-root">
			<header className="p-header">
				<div className="p-wrap p-bar">
					<a className="p-logo" href="/">
						<i aria-hidden="true" />
						Pulse
					</a>
					<nav className="p-nav" aria-label="Sections">
						<a href="#ships">Ships</a>
						<a href="#team">Team</a>
						<a href="#traction">Traction</a>
						<a href="#pace">Pace</a>
					</nav>
					<div className="p-spacer" />
					<PeriodControl value={period} />
					<OrgSelect value={orgParam} orgs={allOrgs.map((o) => ({ slug: o.slug, name: o.name }))} />
					<ThemeToggle />
				</div>
			</header>

			<main className="p-wrap">
				<div className="p-intro">
					<div>
						<span className="p-eyebrow">
							{p.label} · {scope}
						</span>
						<h1>What we shipped.</h1>
						<p>
							Every repo the team created, put online or published across{" "}
							{org ? org.name : allOrgs.map((o) => o.name.replace("Crafter ", "")).join(", ")}.
						</p>
					</div>
					<div className="p-kpis">
						<Drill
							className="p-kpi"
							label={`${data.shipped.current} projects shipped, see the list`}
							title="Projects shipped"
							description={`Repos created in the ${periodText} that are online or published.`}
							params={{ kind: "ships", ...base }}
						>
							<b className="p-num">{fmt(data.shipped.current)}</b>
							<span>Projects shipped</span>
							<Delta current={data.shipped.current} previous={data.shipped.previous} label={p.previous} />
						</Drill>
						<Drill
							className="p-kpi"
							label={`${data.created.current} repos created, see the list`}
							title="Repos created"
							description={`Every repo created in the ${periodText}.`}
							params={{ kind: "repos", ...base }}
						>
							<b className="p-num">{fmt(data.created.current)}</b>
							<span>Repos created</span>
							<Delta current={data.created.current} previous={data.created.previous} label={p.previous} />
						</Drill>
						<Drill
							className="p-kpi"
							label={`${data.npmMonth} npm downloads this month, see packages`}
							title="Packages"
							description="npm downloads in the last 30 days and skill installs per package."
							params={{ kind: "packages", org: orgParam }}
						>
							<b className="p-num">{fmt(data.npmMonth)}</b>
							<span>npm downloads this month</span>
							<span className="p-delta" data-dir="flat">
								{fmt(data.skillsInstalls)} skill installs
							</span>
						</Drill>
					</div>
				</div>

				<section className="p-section p-grid2">
					<div id="ships">
						<div className="p-head">
							<div>
								<span className="p-eyebrow">01 / Ships</span>
								<h2>Recently shipped</h2>
							</div>
							<Drill
								className="p-head-link"
								label="See all ships"
								title="Projects shipped"
								description={`Repos created in the ${periodText} that are online or published.`}
								params={{ kind: "ships", ...base }}
							>
								See all
							</Drill>
						</div>
						{data.ships.length === 0 ? (
							<p className="p-empty">Nothing shipped in the {periodText} yet.</p>
						) : (
							<ul className="p-ships">
								{data.ships.map((ship) => (
									<li key={`${ship.org}-${ship.name}-${ship.createdAt}`} className="p-ship p-row-line">
										{ship.creator ? (
											// biome-ignore lint/performance/noImgElement: GitHub avatars
											<img
												className="p-avatar"
												src={`https://github.com/${ship.creator.login}.png?size=80`}
												alt=""
												width={40}
												height={40}
											/>
										) : (
											<span className="p-avatar p-avatar-empty" aria-hidden="true" />
										)}
										<div>
											<div className="t">
												{ship.url ? (
													<a href={ship.url} target="_blank" rel="noreferrer">
														{ship.name}
													</a>
												) : (
													<span>{ship.name}</span>
												)}
												{ship.isPrivate ? <span className="p-tag">Private</span> : null}
											</div>
											<div className="m">
												{ship.creator?.name ?? "Unattributed"} · {ship.org} ·{" "}
												{shortDate.format(new Date(ship.createdAt))}
												{ship.stars > 0 ? ` · ${fmt(ship.stars)} ${ship.stars === 1 ? "star" : "stars"}` : ""}
											</div>
										</div>
										{ship.homepage ? (
											<a className="p-tag" data-live href={ship.homepage} target="_blank" rel="noreferrer">
												{host(ship.homepage)}
											</a>
										) : (
											<span className="p-tag" data-live>
												Live
											</span>
										)}
									</li>
								))}
							</ul>
						)}
					</div>

					<div id="team">
						<div className="p-head">
							<div>
								<span className="p-eyebrow">02 / Team</span>
								<h2>Who shipped what</h2>
							</div>
						</div>
						<table className="p-table">
							<thead>
								<tr>
									<th scope="col">Member</th>
									<th scope="col">Ships</th>
									<th scope="col" className="p-hide-sm">
										Repos
									</th>
									<th scope="col">Commits</th>
								</tr>
							</thead>
							<tbody>
								{data.team.map((m) => (
									<tr key={m.login}>
										<td>
											<div className="p-who">
												{/* biome-ignore lint/performance/noImgElement: GitHub avatars */}
												<img className="p-avatar" src={m.avatarUrl} alt="" width={36} height={36} />
												<div>
													<b>{m.name}</b>
													<small>{m.role}</small>
												</div>
											</div>
										</td>
										{(
											[
												["ships", m.ships, "Projects shipped"],
												["repos", m.repos, "Repos created"],
												["commits", m.commits, "Commits"],
											] as const
										).map(([kind, value, title]) => (
											<td key={kind} className={`n${kind === "repos" ? " p-hide-sm" : ""}`}>
												{value > 0 ? (
													<Drill
														className="p-cell"
														label={`${value} ${title.toLowerCase()} by ${m.name}`}
														title={`${title} by ${m.name}`}
														description={`${p.label}${org ? ` in ${org.name}` : ""}.`}
														params={{ kind, login: m.login, ...base }}
													>
														<span className="p-num">{fmt(value)}</span>
													</Drill>
												) : (
													<span className="p-zero p-num">0</span>
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="p-section p-grid2">
					<div id="traction">
						<div className="p-head">
							<div>
								<span className="p-eyebrow">03 / Traction</span>
								<h2>Most starred</h2>
							</div>
						</div>
						<div>
							{data.mostStarred.map((repo, i) => (
								<div key={repo.url} className="p-trow p-row-line">
									<span className="p-num p-zero">{i + 1}</span>
									<div>
										<a href={repo.url} target="_blank" rel="noreferrer" className="p-trow-name">
											{repo.name}
										</a>
										<span className="org">{repo.org}</span>
									</div>
									<div className="p-meter" aria-hidden="true">
										<i style={{ width: `${Math.max(3, (repo.stars / maxStars) * 100)}%` }} />
									</div>
									<span className="p-num" style={{ textAlign: "right" }}>
										{fmt(repo.stars)}
									</span>
								</div>
							))}
						</div>
						<div className="p-dist">
							<div>
								<b className="p-num">{fmt(data.npmMonth)}</b>
								<span>npm, last 30 days</span>
							</div>
							<div>
								<b className="p-num">{fmt(data.skillsInstalls)}</b>
								<span>Skill installs</span>
							</div>
							<div>
								<b className="p-num">{fmt(data.totalStars)}</b>
								<span>Stars on public repos</span>
							</div>
						</div>
					</div>

					<div id="pace">
						<div className="p-head">
							<div>
								<span className="p-eyebrow">04 / Pace</span>
								<h2>Repos created per month</h2>
							</div>
						</div>
						<div className="p-months">
							{data.createdByMonth.map((m) => (
								<Drill
									key={m.month}
									className="p-month"
									label={`${m.count} repos created in ${monthName(m.month)}`}
									title={`Repos created in ${monthName(m.month)}`}
									description={org ? org.name : "All orgs"}
									params={{ kind: "repos", org: orgParam, month: m.month }}
								>
									<em className="p-num">{m.count}</em>
									<i
										data-hi={m.month === busiest?.month || undefined}
										style={{ height: `${(m.count / maxMonth) * 150}px` }}
									/>
									<span>{monthName(m.month)}</span>
								</Drill>
							))}
						</div>
						{busiest ? (
							<p className="p-note">
								{monthName(busiest.month)} is the busiest month of the year so far, with {fmt(busiest.count)} new
								repos.
							</p>
						) : null}
					</div>
				</section>

				<footer className="p-footer">
					<span>Pulse by Crafter Station</span>
					<span>
						<a href="https://crafter.run/team">Team</a> · <a href="https://github.com/crafter-station">GitHub</a>
					</span>
				</footer>
			</main>
		</div>
	);
}
