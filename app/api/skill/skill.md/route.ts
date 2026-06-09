// GET /api/skill/skill.md
//
// Returns the Anthropic-format SKILL.md file with YAML frontmatter so it
// can be saved directly into ~/.claude/skills/drawtree/SKILL.md or
// uploaded as-is to Perplexity Computer's skills UI.

import { SKILL_MD } from "@/lib/skill_content";

export const dynamic = "force-static";  // file content is constant; cache aggressively

export async function GET() {
  return new Response(SKILL_MD, {
    headers: {
      "Content-Type":        "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="SKILL.md"',
      "Cache-Control":       "public, max-age=300, s-maxage=300",
    },
  });
}
