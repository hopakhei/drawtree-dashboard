/* =============================================================================
   POST /api/portfolio/correlations
   Estimates a return-correlation matrix for Layer 2 of the sizing engine from
   real historical daily prices. Thin wrapper over lib/portfolio/history.ts so
   the data pipeline lives in one place (shared with size-and-rebalance).
   ============================================================================= */
import { NextRequest, NextResponse } from "next/server";
import { computeCorrelations } from "@/lib/portfolio/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }
  const tickers: string[] = Array.isArray(body?.tickers) ? body.tickers : [];
  const payload = await computeCorrelations(tickers);
  return NextResponse.json(payload);
}
