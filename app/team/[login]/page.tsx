import { notFound } from "next/navigation";
import { fmt, Gain, host, longDate, Shell, shortDate } from "@/components/pulse/Shell";
import { getMemberPage } from "@/lib/member";
import { getPageContext, linkTo, type SearchParams } from "@/lib/page-context";

export const dynamic = "force-dynamic";

type Params = Promise<{ login: string }>;

export async function generateMetadata({ params }: { params: Params }) {
	const { login } = await params;
	return { title: `${login} · Pulse` };
}

function level(count: number, max: number) {
	if (count === 0) return 0;
	return Math.min(4, Math.ceil((count / Math.max(1, max)) * 4));
}

export default async function MemberPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
	const { login } = await params;
	const ctx = await getPageContext(searchParams);
	const data = await getMemberPage(login, ctx.org?.id ?? null, ctx.period);
	if (!data) notFound();
	const { member } = data;
	const maxDay = Math.max(...data.activity.map((d) => d.count));
	const activeDays = data.activity.filter((d) => d.count > 0).length;

	return (
		<Shell ctx={ctx} current="team">
			<div className="p-intro p-intro-compact">
				<div className="p-profile">
					{/* biome-ignore lint/performance/noImgElement: GitHub avatars */}
					<img className="p-avatar" src={`https://github.com/${member.login}.png?size=160`} alt="" width={80} height={80} />
					<div>
						<a className="p-eyebrow p-back" href={linkTo("/team", ctx)}>
							Team · {member.role}
						</a>
						<h1>{member.name}</h1>
						<a className="p-quiet-link p-muted" href={`https://github.com/${member.login}`} target="_blank" rel="noreferrer">
							github.com/{member.login}
						</a>
					</div>
				</div>
				<div className="p-kpis">
					<div className="p-kpi">
						<b className="p-num">{fmt(data.ships)}</b>
						<span>Projects shipped</span>
					</div>
					<div className="p-kpi">
						<b className="p-num">{fmt(data.repos)}</b>
						<span>Repos created</span>
					</div>
					<div className="p-kpi">
						<b className="p-num">{fmt(data.commits)}</b>
						<span>Commits</span>
					</div>
					<div className="p-kpi">
						<b className="p-num">{fmt(data.starsGained)}</b>
						<span>Stars gained on their repos</span>
					</div>
				</div>
			</div>

			<section className="p-section">
				<div className="p-head">
					<div>
						<span className="p-eyebrow">01 / Rhythm</span>
						<h2>Last 12 weeks</h2>
					</div>
					<span className="p-muted">
						{activeDays} active {activeDays === 1 ? "day" : "days"}
					</span>
				</div>
				<div className="p-heat" role="img" aria-label={`${member.name} committed on ${activeDays} of the last 84 days`}>
					{data.activity.map((d) => (
						<i key={d.day} data-level={level(d.count, maxDay)} title={`${d.day}: ${d.count} commits`} />
					))}
				</div>
			</section>

			<section className="p-section p-grid2">
				<div>
					<div className="p-head">
						<div>
							<span className="p-eyebrow">02 / Built</span>
							<h2>Repos they created</h2>
						</div>
						<a href={linkTo("/projects", ctx, { creator: member.login })}>Filter projects</a>
					</div>
					{data.created.length === 0 ? (
						<p className="p-empty">No repos attributed to {member.name} yet.</p>
					) : (
						<ul className="p-drill-list">
							{data.created.slice(0, 30).map((r) => (
								<li key={`${r.orgSlug}/${r.name}`} className="p-drill-item p-row-line">
									<div className="p-drill-main">
										<span className="p-proj-name">
											{r.slugName ? (
												<a className="p-drill-title" href={linkTo(`/projects/${r.orgSlug}/${r.slugName}`, ctx)}>
													{r.name}
												</a>
											) : (
												<span className="p-drill-title" data-private>
													{r.name}
												</span>
											)}
											{r.shipped ? (
												r.homepage ? (
													<a className="p-tag" data-live href={r.homepage} target="_blank" rel="noreferrer">
														{host(r.homepage)}
													</a>
												) : (
													<span className="p-tag" data-live>
														Live
													</span>
												)
											) : null}
										</span>
										<span className="p-drill-meta">
											{r.org}
											{r.stars ? ` · ${fmt(r.stars)} ${r.stars === 1 ? "star" : "stars"}` : ""}
											{r.starsGained ? (
												<>
													{" · "}
													<Gain value={r.starsGained} />
												</>
											) : null}
										</span>
									</div>
									<span className="p-drill-side p-num">{r.createdAt ? longDate.format(new Date(r.createdAt)) : ""}</span>
								</li>
							))}
						</ul>
					)}
				</div>
				<div>
					<div className="p-head">
						<div>
							<span className="p-eyebrow">03 / Commits</span>
							<h2>Recent commits</h2>
						</div>
					</div>
					{data.commitList.length === 0 ? (
						<p className="p-empty">No commits in the {ctx.periodText}.</p>
					) : (
						<ul className="p-drill-list">
							{data.commitList.map((c) => (
								<li key={c.id} className="p-drill-item p-row-line">
									<div className="p-drill-main">
										{c.url ? (
											<a className="p-drill-title" href={c.url} target="_blank" rel="noreferrer">
												{c.title}
											</a>
										) : (
											<span className="p-drill-title" data-private>
												{c.title}
											</span>
										)}
										<span className="p-drill-meta">
											{c.repo} · +{fmt(c.additions)} −{fmt(c.deletions)}
										</span>
									</div>
									<span className="p-drill-side p-num">{shortDate.format(new Date(c.date))}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</Shell>
	);
}
