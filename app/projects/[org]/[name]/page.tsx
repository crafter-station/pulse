import { notFound } from "next/navigation";
import { fmt, Gain, host, longDate, Shell, shortDate } from "@/components/pulse/Shell";
import { StarChart } from "@/components/pulse/StarChart";
import { getPageContext, linkTo, type SearchParams } from "@/lib/page-context";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

type Params = Promise<{ org: string; name: string }>;

export async function generateMetadata({ params }: { params: Params }) {
	const { name } = await params;
	return { title: `${decodeURIComponent(name)} · Pulse` };
}

export default async function ProjectPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
	const { org, name } = await params;
	const ctx = await getPageContext(searchParams);
	const project = await getProject(org, decodeURIComponent(name), ctx.period);
	if (!project) notFound();
	const maxContrib = Math.max(1, ...project.contributors.map((c) => c.commits));

	return (
		<Shell ctx={ctx} current="projects">
			<div className="p-intro p-intro-compact">
				<div>
					<a className="p-eyebrow p-back" href={linkTo("/projects", ctx)}>
						Projects · {project.org}
					</a>
					<h1>{project.name}</h1>
					{project.description ? <p>{project.description}</p> : null}
					<div className="p-actions">
						<a className="p-control p-button" href={`https://github.com/${project.fullName}`} target="_blank" rel="noreferrer">
							Open on GitHub
						</a>
						{project.homepage ? (
							<a className="p-tag" data-live href={project.homepage} target="_blank" rel="noreferrer">
								{host(project.homepage)}
							</a>
						) : null}
						{project.archived ? <span className="p-tag">Archived</span> : null}
					</div>
				</div>
				<dl className="p-facts">
					<div>
						<dt>Stars</dt>
						<dd className="p-num">{fmt(project.stars)}</dd>
					</div>
					<div>
						<dt>Gained, {ctx.periodText}</dt>
						<dd>
							<Gain value={project.starsGained} />
						</dd>
					</div>
					<div>
						<dt>Forks</dt>
						<dd className="p-num">{fmt(project.forks)}</dd>
					</div>
					<div>
						<dt>Created by</dt>
						<dd>
							{project.creator ? (
								<a className="p-quiet-link" href={linkTo(`/team/${project.creator.login}`, ctx)}>
									{project.creator.name}
								</a>
							) : (
								"Unattributed"
							)}
						</dd>
					</div>
					<div>
						<dt>Created</dt>
						<dd>{project.createdAt ? longDate.format(new Date(project.createdAt)) : "—"}</dd>
					</div>
					<div>
						<dt>Last push</dt>
						<dd>{project.lastPushAt ? longDate.format(new Date(project.lastPushAt)) : "—"}</dd>
					</div>
				</dl>
			</div>

			<section className="p-section">
				<div className="p-head">
					<div>
						<span className="p-eyebrow">01 / Traction</span>
						<h2>Star history</h2>
					</div>
				</div>
				<StarChart series={project.starSeries} label={`Stars of ${project.name} over time`} />
			</section>

			<section className="p-section p-grid2">
				<div>
					<div className="p-head">
						<div>
							<span className="p-eyebrow">02 / Activity</span>
							<h2>Recent commits</h2>
						</div>
					</div>
					{project.commits.length === 0 ? (
						<p className="p-empty">No commits to the default branch recorded yet.</p>
					) : (
						<ul className="p-drill-list">
							{project.commits.map((c) => (
								<li key={c.id} className="p-drill-item p-row-line">
									<div className="p-drill-main">
										<a className="p-drill-title" href={c.url} target="_blank" rel="noreferrer">
											{c.title}
										</a>
										<span className="p-drill-meta">
											{c.author} · +{fmt(c.additions)} −{fmt(c.deletions)}
										</span>
									</div>
									<span className="p-drill-side p-num">{shortDate.format(new Date(c.date))}</span>
								</li>
							))}
						</ul>
					)}
				</div>
				<div>
					<div className="p-head">
						<div>
							<span className="p-eyebrow">03 / People</span>
							<h2>Contributors</h2>
						</div>
					</div>
					{project.contributors.map((c) => (
						<div key={c.login} className="p-crow p-row-line">
							{/* biome-ignore lint/performance/noImgElement: GitHub avatars */}
							<img className="p-avatar" src={`https://github.com/${c.login}.png?size=64`} alt="" width={32} height={32} />
							<span>{c.name}</span>
							<div className="p-meter" aria-hidden="true">
								<i style={{ width: `${(c.commits / maxContrib) * 100}%` }} />
							</div>
							<span className="p-num right">{fmt(c.commits)}</span>
						</div>
					))}
				</div>
			</section>
		</Shell>
	);
}
