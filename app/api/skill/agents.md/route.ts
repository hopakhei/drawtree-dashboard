// GET /api/skill/agents.md?lang=en|zh
//
// Returns the Codex-format AGENTS.md (no YAML frontmatter, agents.md spec).
// User drops it at ~/.codex/AGENTS.md (global) or project root.

import { NextRequest } from "next/server";
import { getAgentsMd } from "@/lib/skill_content";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = isLocale(langParam) ? langParam : "en";
  return new Response(getAgentsMd(lang), {
    headers: {
      "Content-Type":        "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="AGENTS.md"',
      "Cache-Control":       "public, max-age=300, s-maxage=300",
    },
  });
}
