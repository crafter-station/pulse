import { fmt, Shell } from "@/components/pulse/Shell";
import { getOverview } from "@/lib/overview";
import { getPageContext, linkTo, type SearchParams } from "@/lib/page-context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team · Pulse" };

export default async function TeamPage({ searchParams }: { searchParams: SearchParams }) {
	const ctx = await getPageContext(searchParams);
	const { team } = await getOverview(ctx.org?.id ?? null, ctx.period);

	return (
		<Shell ctx={ctx} current="team">
			<div className="p-intro p-intro-compact">
				<div>
					<span className="p-eyebrow">
						{ctx.periodLabel} · {ctx.org ? ctx.org.name : `${ctx.orgs.length} orgs`}
					</span>
					<h1>The team.</h1>
					<p>The {team.length} people in the Crafter Station core and what each of them shipped.</p>
				</div>
			</div>
			<ul className="p-members">
				{team.map((m) => (
					<li key={m.login}>
						<a className="p-member" href={linkTo(`/team/${m.login}`, ctx)}>
							{/* biome-ignore lint/performance/noImgElement: GitHub avatars */}
							<img className="p-avatar" src={`https://github.com/${m.login}.png?size=112`} alt="" width={56} height={56} />
							<div className="p-member-id">
								<b>{m.name}</b>
								<small>{m.role}</small>
							</div>
							<dl className="p-member-stats">
								<div>
									<dt>Ships</dt>
									<dd className="p-num">{fmt(m.ships)}</dd>
								</div>
								<div>
									<dt>Repos</dt>
									<dd className="p-num">{fmt(m.repos)}</dd>
								</div>
								<div>
									<dt>Commits</dt>
									<dd className="p-num">{fmt(m.commits)}</dd>
								</div>
							</dl>
						</a>
					</li>
				))}
			</ul>
		</Shell>
	);
}
