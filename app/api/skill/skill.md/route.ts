// GET /api/skill/skill.md?lang=en|zh
//
// Returns the Anthropic-format SKILL.md file with YAML frontmatter so it
// can be saved directly into ~/.claude/skills/drawtree/SKILL.md or
// uploaded as-is to Perplexity Computer's skills UI.

import { NextRequest } from "next/server";
import { getSkillMd } from "@/lib/skill_content";
import { isLocale } from "@/lib/i18n";

// Content varies with ?lang= — must read the query string at request time.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = isLocale(langParam) ? langParam : "en";
  return new Response(getSkillMd(lang), {
    headers: {
      "Content-Type":        "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="SKILL.md"',
      "Cache-Control":       "public, max-age=300, s-maxage=300",
    },
  });
}
