import { NextResponse } from "next/server";
import { type DrillKind, getDrill } from "@/lib/drill";
import { resolveOrgFromRequest } from "@/lib/org-filter";
import { parsePeriod } from "@/lib/overview";

const KINDS: DrillKind[] = ["repos", "ships", "commits", "packages"];

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const kind = searchParams.get("kind") as DrillKind | null;
	if (!kind || !KINDS.includes(kind)) {
		return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
	}
	try {
		const org = await resolveOrgFromRequest(request);
		const items = await getDrill({
			kind,
			orgId: org?.id ?? null,
			period: parsePeriod(searchParams.get("period") ?? undefined),
			login: searchParams.get("login"),
			month: searchParams.get("month"),
		});
		return NextResponse.json({ items });
	} catch (error) {
		console.error("Drill API error:", error);
		return NextResponse.json({ error: "Failed to load" }, { status: 500 });
	}
}
