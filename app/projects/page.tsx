import { FilterSelect } from "@/components/pulse/FilterSelect";
import { fmt, Gain, host, Shell, shortDate } from "@/components/pulse/Shell";
import { getPageContext, linkTo, type SearchParams } from "@/lib/page-context";
import { listProjects, type ProjectSort, type ProjectStatus } from "@/lib/projects";
import { CORE_MEMBERS } from "@/lib/roster";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects · Pulse" };

const SORTS: { value: ProjectSort; label: string }[] = [
	{ value: "created", label: "Newest" },
	{ value: "gained", label: "Stars gained" },
	{ value: "stars", label: "Most stars" },
	{ value: "pushed", label: "Recently pushed" },
];
const STATUSES: { value: ProjectStatus; label: string }[] = [
	{ value: "all", label: "All repos" },
	{ value: "created", label: "Created in period" },
	{ value: "shipped", label: "Shipped in period" },
];

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
	const ctx = await getPageContext(searchParams);
	const q = ctx.query.q?.trim() ?? "";
	const status = (STATUSES.find((s) => s.value === ctx.query.status)?.value ?? "all") as ProjectStatus;
	const sort = (SORTS.find((s) => s.value === ctx.query.sort)?.value ?? "created") as ProjectSort;
	const creator = CORE_MEMBERS.find((m) => m.login === ctx.query.creator)?.login ?? null;

	const rows = await listProjects({ orgId: ctx.org?.id ?? null, period: ctx.period, q, creator, status, sort });
	const shipped = rows.filter((r) => r.shipped).length;

	return (
		<Shell ctx={ctx} current="projects">
			<div className="p-intro p-intro-compact">
				<div>
					<span className="p-eyebrow">
						{ctx.periodLabel} · {ctx.org ? ctx.org.name : `${ctx.orgs.length} orgs`}
					</span>
					<h1>Projects.</h1>
					<p>
						{fmt(rows.length)} repos, {fmt(shipped)} of them online or published. Stars gained count the{" "}
						{ctx.periodText}.
					</p>
				</div>
			</div>

			<form className="p-filters" method="get" action="/projects">
				{ctx.org ? <input type="hidden" name="org" value={ctx.org.slug} /> : null}
				{ctx.period !== "month" ? <input type="hidden" name="period" value={ctx.period} /> : null}
				<div className="p-field">
					<label className="p-field-label" htmlFor="q">
						Search
					</label>
					<input id="q" className="p-control p-input" type="search" name="q" defaultValue={q} placeholder="Repo name" />
				</div>
				<FilterSelect name="status" label="Show" defaultValue={status} items={STATUSES} />
				<FilterSelect
					name="creator"
					label="Created by"
					defaultValue={creator ?? "any"}
					items={[{ value: "any", label: "Anyone" }, ...CORE_MEMBERS.map((m) => ({ value: m.login, label: m.name }))]}
				/>
				<FilterSelect name="sort" label="Sort by" defaultValue={sort} items={SORTS} />
				<button type="submit" className="p-control p-button">
					Apply
				</button>
			</form>

			<div className="p-table-scroll">
				<table className="p-table p-table-wide">
					<thead>
						<tr>
							<th scope="col">Project</th>
							<th scope="col" className="left">
								Created by
							</th>
							<th scope="col">Created</th>
							<th scope="col">Stars</th>
							<th scope="col">Gained</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan={5} className="p-empty">
									No repos match these filters. <a href="/projects">Clear filters</a>
								</td>
							</tr>
						) : (
							rows.map((r) => (
								<tr key={`${r.orgSlug}/${r.name}`}>
									<td>
										<div className="p-proj">
											<div className="p-proj-name">
												{r.slugName ? (
													<a href={linkTo(`/projects/${r.orgSlug}/${r.slugName}`, ctx)}>{r.name}</a>
												) : (
													<span className="p-muted">{r.name}</span>
												)}
												{r.isPrivate ? <span className="p-tag">Private</span> : null}
												{r.shipped && !r.isPrivate && r.homepage ? (
													<a className="p-tag" data-live href={r.homepage} target="_blank" rel="noreferrer">
														{host(r.homepage)}
													</a>
												) : r.shipped ? (
													<span className="p-tag" data-live>
														Live
													</span>
												) : null}
												{r.archived ? <span className="p-tag">Archived</span> : null}
											</div>
											<span className="p-muted p-small">{r.org}</span>
										</div>
									</td>
									<td className="left">
										{r.creator ? (
											<a className="p-quiet-link" href={linkTo(`/team/${r.creator.login}`, ctx)}>
												{r.creator.name}
											</a>
										) : (
											<span className="p-muted">Unattributed</span>
										)}
									</td>
									<td className="n p-num p-muted">{r.createdAt ? shortDate.format(new Date(r.createdAt)) : "—"}</td>
									<td className="n p-num">{r.isPrivate ? <span className="p-muted">—</span> : fmt(r.stars)}</td>
									<td className="n">{r.isPrivate ? <span className="p-muted">—</span> : <Gain value={r.starsGained} />}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</Shell>
	);
}
