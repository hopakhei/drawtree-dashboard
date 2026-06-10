// GET /api/skill/skill.zip?lang=en|zh
//
// Returns a ZIP archive containing drawtree/SKILL.md. This is the upload
// shape required by Claude Desktop and Claude.ai (Settings → Capabilities
// → Skills → Upload). Perplexity Computer also accepts ZIP uploads.

import { NextRequest } from "next/server";
import { buildSkillZip } from "@/lib/skill_content";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = isLocale(langParam) ? langParam : "en";
  const zip = buildSkillZip(lang);
  // Cast through ArrayBuffer to satisfy the Response constructor's
  // BodyInit type — a slice of the underlying buffer that matches the
  // Uint8Array exactly.
  const ab = zip.buffer.slice(
    zip.byteOffset,
    zip.byteOffset + zip.byteLength,
  ) as ArrayBuffer;
  return new Response(ab, {
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": 'attachment; filename="drawtree-skill.zip"',
      "Cache-Control":       "public, max-age=300, s-maxage=300",
      "Content-Length":      String(zip.byteLength),
    },
  });
}
