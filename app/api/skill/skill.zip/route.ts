// GET /api/skill/skill.zip
//
// Returns a ZIP archive containing drawtree/SKILL.md. This is the upload
// shape required by Claude Desktop and Claude.ai (Settings \u2192 Capabilities
// \u2192 Skills \u2192 Upload). Perplexity Computer also accepts ZIP uploads.

import { buildSkillZip } from "@/lib/skill_content";

export const dynamic = "force-static";

export async function GET() {
  const zip = buildSkillZip();
  // Cast through ArrayBuffer to satisfy the Response constructor's
  // BodyInit type \u2014 a slice of the underlying buffer that matches the
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
