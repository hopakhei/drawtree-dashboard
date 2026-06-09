// GET /api/skill/agents.md
//
// Returns the Codex-format AGENTS.md (no YAML frontmatter, agents.md spec).
// User drops it at ~/.codex/AGENTS.md (global) or project root.

import { AGENTS_MD } from "@/lib/skill_content";

export const dynamic = "force-static";

export async function GET() {
  return new Response(AGENTS_MD, {
    headers: {
      "Content-Type":        "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="AGENTS.md"',
      "Cache-Control":       "public, max-age=300, s-maxage=300",
    },
  });
}
