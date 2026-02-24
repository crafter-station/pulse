"use client";

import { formatNumber } from "@/lib/utils/format";
import { formatRelativeTime } from "@/lib/utils/time";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RepoItem {
  name: string;
  fullName: string;
  lastPushAt: string | null;
  commitsThisWeek: number;
  topContributorThisWeek: {
    username: string;
    avatarUrl: string | null;
    commits: number;
  } | null;
}

export function Repositories() {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch("/api/repositories");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRepos(data);
      } catch (err) {
        console.error("Error fetching repositories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
    const interval = setInterval(fetchRepos, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="repositories"
      className="py-12 md:py-20 px-4 md:px-6 bg-[#171717]/20 scroll-mt-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
            Repositories
          </h2>
          <p className="text-sm md:text-base text-[#737373]">
            Where the team is shipping — click a repository for commits and top
            contributors
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-[#171717] border border-[#262626] animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-16 border border-[#262626] bg-[#171717]/30 rounded-lg">
            <div className="text-5xl mb-3">📦</div>
            <div className="text-lg font-bold text-white mb-1">
              No repositories yet
            </div>
            <div className="text-[#737373] text-sm">
              Repositories appear here after the first push to main
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <Link
                key={repo.name}
                href={`/repositories/${encodeURIComponent(repo.name)}`}
                className="block p-4 md:p-5 bg-[#171717] border border-[#262626] hover:border-brand/30 transition-colors rounded-lg group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-bold text-white text-lg truncate group-hover:text-brand transition-colors">
                    {repo.name}
                  </span>
                  {repo.commitsThisWeek > 0 && (
                    <span className="shrink-0 text-xs font-medium bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded">
                      {formatNumber(repo.commitsThisWeek)} this week
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 text-sm text-[#737373]">
                  <span>
                    {repo.lastPushAt
                      ? formatRelativeTime(repo.lastPushAt)
                      : "—"}
                  </span>
                  {repo.topContributorThisWeek && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      {repo.topContributorThisWeek.avatarUrl ? (
                        <img
                          src={repo.topContributorThisWeek.avatarUrl}
                          alt=""
                          className="w-5 h-5 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#262626] shrink-0 flex items-center justify-center text-[10px] font-bold text-brand">
                          {repo.topContributorThisWeek.username[0]?.toUpperCase() ??
                            "?"}
                        </div>
                      )}
                      <span className="truncate text-[#A3A3A3]">
                        {repo.topContributorThisWeek.username}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
