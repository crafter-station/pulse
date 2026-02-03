"use client";

import { formatNumber } from "@/lib/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CommitItem {
	repo: string;
	author: string;
	avatarUrl: string | null;
	message: string;
	time: string;
	additions: number;
	deletions: number;
	commitUrl: string;
}

interface ContributorItem {
	username: string;
	avatarUrl: string | null;
	commits: number;
	additions: number;
	deletions: number;
}

interface RepoDetailData {
	repo: {
		name: string;
		fullName: string;
		lastPushAt: string | null;
	};
	recentCommits: CommitItem[];
	topContributors: ContributorItem[];
}

export function RepoDetail({ name }: { name: string }) {
	const router = useRouter();
	const [data, setData] = useState<RepoDetailData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const fetchRepo = async () => {
			try {
				const res = await fetch(
					`/api/repos/${encodeURIComponent(name)}`,
				);
				if (!res.ok) {
					if (res.status === 404) setError(true);
					else throw new Error("Failed to fetch");
					return;
				}
				const json = await res.json();
				setData(json);
			} catch (err) {
				console.error("Error fetching repo:", err);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		fetchRepo();
	}, [name]);

	if (loading) {
		return (
			<div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-12 px-4 sm:px-5 md:px-6 md:pt-24">
				<div className="mx-auto max-w-4xl">
					<div className="h-9 w-40 sm:h-10 sm:w-48 bg-[#171717] border border-[#262626] animate-pulse rounded mb-6 md:mb-8" />
					<div className="space-y-3 md:space-y-4">
						{[...Array(8)].map((_, i) => (
							<div
								key={i}
								className="h-16 sm:h-20 bg-[#171717] border border-[#262626] animate-pulse rounded"
							/>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-12 px-4 sm:px-5 md:px-6 md:pt-24">
				<div className="mx-auto max-w-4xl text-center py-16 md:py-20">
					<div className="text-4xl md:text-5xl mb-4">🔍</div>
					<h1 className="text-lg md:text-xl font-bold text-white mb-2">
						Repo not found
					</h1>
					<p className="text-sm text-[#737373] mb-6 max-w-sm mx-auto">
						We don’t have data for this repo yet.
					</p>
					<button
						type="button"
						onClick={() => router.push("/#repos")}
						className="text-sm font-medium text-[#FFD800] hover:underline touch-manipulation"
					>
						← Back to Repos
					</button>
				</div>
			</div>
		);
	}

	const { repo, recentCommits, topContributors } = data;
	const githubUrl = `https://github.com/${repo.fullName}`;

	return (
		<div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-12 px-4 sm:px-5 md:px-6 md:pt-24">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8 md:mb-10">
					<Link
						href="/#repos"
						className="text-sm text-[#737373] hover:text-white transition-colors mb-3 inline-block touch-manipulation"
					>
						← Repos
					</Link>
					<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
						<h1 className="text-xl font-black text-white break-all sm:text-2xl md:text-3xl min-w-0">
							{repo.name}
						</h1>
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<a
								href={githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex text-sm font-medium text-[#A3A3A3] hover:text-[#FFD800] transition-colors border border-[#262626] hover:border-[#FFD800]/30 px-3 py-2 rounded touch-manipulation"
							>
								View on GitHub
							</a>
							{repo.lastPushAt && (
								<span className="text-xs text-[#737373] sm:text-sm">
									Last push {new Date(repo.lastPushAt).toLocaleDateString()}
								</span>
							)}
						</div>
					</div>
					<p className="text-xs text-[#737373] mt-3 max-w-xl" role="note">
						Data reflects activity tracked by Pulse (webhook + backfill), not full GitHub history.
						To see the full history, visit the repo on GitHub.
					</p>
				</div>

				{topContributors.length > 0 && (
					<section className="mb-8 md:mb-10">
						<h2 className="text-base font-bold text-white mb-3 md:text-lg md:mb-4">
							Top contributors
						</h2>
						{/* Mobile: card list */}
						<div className="space-y-2 border border-[#262626] rounded-lg bg-[#171717] p-2 md:hidden">
							{topContributors.map((c, i) => (
								<div
									key={c.username}
									className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0A0A0A]/50 border border-[#262626]/50"
								>
									<div className="flex items-center gap-3 min-w-0">
										<span className="text-[#737373] text-sm w-5 shrink-0">{i + 1}</span>
										{c.avatarUrl ? (
											<img src={c.avatarUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
										) : (
											<div className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center text-[#FFD800] font-bold text-sm shrink-0">
												{c.username[0]?.toUpperCase() ?? "?"}
											</div>
										)}
										<span className="font-medium text-white text-sm truncate">{c.username}</span>
									</div>
									<div className="flex items-center gap-3 shrink-0 text-right">
										<span className="font-mono text-white text-sm">{c.commits}</span>
										<span className="font-mono text-xs text-green-500">+{formatNumber(c.additions)}</span>
										<span className="font-mono text-xs text-red-500">−{formatNumber(c.deletions)}</span>
									</div>
								</div>
							))}
						</div>
						{/* Desktop: table */}
						<div className="hidden md:block overflow-x-auto border border-[#262626] rounded-lg bg-[#171717]">
							<table className="w-full text-sm min-w-[32rem]">
								<thead>
									<tr className="border-b border-[#262626] text-left text-[#737373]">
										<th className="p-3 font-medium">#</th>
										<th className="p-3 font-medium">Contributor</th>
										<th className="p-3 font-medium text-right">Commits</th>
										<th className="p-3 font-medium text-right">+ / −</th>
									</tr>
								</thead>
								<tbody>
									{topContributors.map((c, i) => (
										<tr key={c.username} className="border-b border-[#262626]/50 last:border-0">
											<td className="p-3 text-[#737373]">{i + 1}</td>
											<td className="p-3">
												<div className="flex items-center gap-2">
													{c.avatarUrl ? (
														<img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
													) : (
														<div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-[#FFD800] font-bold text-sm shrink-0">
															{c.username[0]?.toUpperCase() ?? "?"}
														</div>
													)}
													<span className="font-medium text-white truncate">{c.username}</span>
												</div>
											</td>
											<td className="p-3 text-right font-mono text-white">{c.commits}</td>
											<td className="p-3 text-right font-mono">
												<span className="text-green-500">+{formatNumber(c.additions)}</span>
												<span className="text-[#525252] mx-1">/</span>
												<span className="text-red-500">−{formatNumber(c.deletions)}</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				)}

				<section>
					<h2 className="text-base font-bold text-white mb-3 md:text-lg md:mb-4">
						Recent commits
					</h2>
					{recentCommits.length === 0 ? (
						<div className="border border-[#262626] bg-[#171717]/30 rounded-lg py-10 md:py-12 text-center text-[#737373] text-sm">
							No commits yet
						</div>
					) : (
						<div className="space-y-2">
							{recentCommits.map((commit) => (
								<a
									key={commit.commitUrl}
									href={commit.commitUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="block p-3 bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors rounded-lg touch-manipulation md:p-4"
								>
									<div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 md:gap-x-3">
										<div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
											{commit.avatarUrl ? (
												<img src={commit.avatarUrl} alt="" className="w-6 h-6 rounded-full shrink-0" />
											) : (
												<div className="w-6 h-6 rounded-full bg-[#262626] shrink-0 flex items-center justify-center text-xs font-bold text-[#FFD800]">
													{commit.author[0]?.toUpperCase() ?? "?"}
												</div>
											)}
											<span className="font-medium text-white text-sm">{commit.author}</span>
											<span className="text-xs text-[#737373]">{commit.time}</span>
										</div>
										<p className="col-span-2 text-sm text-[#A3A3A3] line-clamp-2 min-w-0 mt-1">
											{commit.message}
										</p>
										{(commit.additions > 0 || commit.deletions > 0) && (
											<div className="col-span-2 flex gap-3 mt-1 text-xs font-mono">
												<span className="text-green-500">+{formatNumber(commit.additions)}</span>
												<span className="text-red-500">−{formatNumber(commit.deletions)}</span>
											</div>
										)}
									</div>
								</a>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
