import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const upstream = process.env.NEXT_PUBLIC_API_BASE || "https://api.drawtree.capital";
  try {
    const r = await fetch(`${upstream}/v1/health`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json({ dashboard: "ok", upstream });
  } catch (e: any) {
    return NextResponse.json({ dashboard: "ok", upstream, upstream_error: e.message }, { status: 200 });
  }
}
