/* GET /api/portfolio/search?q=...  → ticker autocomplete (equities + ETFs). */
import { NextRequest, NextResponse } from "next/server";
import { yahooSearch } from "@/lib/portfolio/marketdata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 1) {
    return NextResponse.json({ ok: true, results: [] });
  }
  try {
    const results = await yahooSearch(q);
    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json(
      { ok: false, results: [], error: "search unavailable" },
      { status: 200 },
    );
  }
}
