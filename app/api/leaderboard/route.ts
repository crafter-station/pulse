import { NextResponse } from "next/server";
import { resolveOrgFromRequest } from "@/lib/org-filter";
import { getTeamLeaderboard } from "@/lib/team-leaderboard";
import { getPeruWeekStart } from "@/lib/utils/time";

export async function GET(request: Request) {
	try {
		const org = await resolveOrgFromRequest(request);
		const team = await getTeamLeaderboard(getPeruWeekStart(), org?.id ?? null);

		return NextResponse.json(
			team.map((member) => ({
				name: member.login,
				displayName: member.name,
				role: member.role,
				commits: member.commits,
				additions: member.additions,
				deletions: member.deletions,
				avatarUrl: member.avatarUrl,
			})),
		);
	} catch (error) {
		console.error("Leaderboard API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch leaderboard" },
			{ status: 500 },
		);
	}
}
