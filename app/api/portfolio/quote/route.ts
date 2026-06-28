/* GET /api/portfolio/quote?symbol=...  → live price + general info snapshot. */
import { NextRequest, NextResponse } from "next/server";
import { yahooQuote } from "@/lib/portfolio/marketdata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) {
    return NextResponse.json({ ok: false, error: "symbol required" }, { status: 400 });
  }
  try {
    const quote = await yahooQuote(symbol);
    if (!quote) {
      return NextResponse.json(
        { ok: false, error: "no quote" },
        { status: 200 },
      );
    }
    return NextResponse.json({ ok: true, ...quote });
  } catch {
    return NextResponse.json(
      { ok: false, error: "quote unavailable" },
      { status: 200 },
    );
  }
}
