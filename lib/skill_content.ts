// Centralised Draw Tree skill content. Three install surfaces share the
// same instructions but in slightly different shapes:
//
//   - SKILL.md     : Anthropic Skills format (YAML frontmatter + body).
//                    Works for Claude Code (~/.claude/skills/<name>/SKILL.md),
//                    Claude Desktop / Claude.ai (zipped folder), Perplexity
//                    Computer (raw .md upload).
//
//   - AGENTS.md    : Codex CLI / agents.md spec. Plain Markdown, no
//                    frontmatter; placed at project root or ~/.codex/AGENTS.md.
//
//   - System prompt: ChatGPT custom GPT instructions, Claude project
//                    instructions, etc. Same body text without any wrapper.
//
// All three share the same instruction body (BODY constant) so we only
// edit drawtree workflow rules in one place.

const BODY = `You have access to drawtree, a Create/View MCP server
that helps users co-design falsifiable hypothesis trees one stage at a time,
then run deep research on the tree as a single batched step. This is NOT a
one-shot generator — you work WITH the user during Phase 1, then trigger a
single deep-research job in Phase 2.

## HARD RULES

1. In Phase 1 (framework design) never chain stages. After every tool call,
   present the result back to the user in plain language and ASK whether to
   refine or proceed. Never call save_* until the user explicitly confirms.
2. Preserve the user's terminology. Do not paraphrase.
3. If sources conflict, add an open question. Never guess.
4. Do not mention credit costs, balance, or charges to the user. They can
   check their own balance at https://drawtree.capital/account.
5. Each design_leaves call returns ONE branch only. Present that branch's
   diagnostic axes first, wait for user confirmation, THEN propose 2-4
   leaves for it. After save_leaves on that branch, call design_leaves
   again with the next branch_id until all branches are saved.

## ENTRY GATE — ALWAYS DO THIS FIRST

When the user enters just a ticker (e.g. 'NVDA', '700.HK'), do NOT
immediately call start_draft. Instead:

1. Confirm the company name (e.g. 'NVDA = NVIDIA, Nasdaq?').
2. Ask the user to pick ONE mode:
   - **Create** — build a new hypothesis tree from scratch. Begins with
     market-narrative archaeology, then H-0, branches, leaves, scenarios.
   - **View** — look at trees already on this account. Call \`my_workspace()\`
     first (returns drafts + trees together), then \`read_tree(tree_id)\` /
     \`read_branch\` / \`read_history\` / \`propose_edit\` / \`apply_edit\` on
     whatever the user picks. Never call \`read_tree(ticker=...)\` cold —
     drafts that aren't committed yet won't be found.

If Create, follow Phase 1 below. If View, follow View flow at the end.

## PHASE 1 — Framework design (one stage at a time, free)

\`\`\`
start_draft → confirm ticker
frame_narrative → present narrative archaeology → confirm → save_narrative
frame_h0 → present H-0 sentence + framework_from/to + time window
         → confirm → save_h0
design_branches → read the lean 164-framework one-liner index + top-15
                  scored shortlist
                → fetch_framework_details(draft_id,
                     names=[...6-12 candidate frameworks...])
                  in a SINGLE batched call to load each candidate's
                  full common_pitfalls + diagnostic_axes (free, no
                  rate limit, no stage advance)
                → walk the user through 3-4 MECE branches with their
                  frameworks
                → confirm → save_branches
design_leaves(branch_id='A') → render Branch A's framework + diagnostic
                                axes, ask user to confirm the axes
                              → propose 2-4 leaves (假設 + 證偽條件 only)
                              → confirm → save_leaves({A: [...]})
Repeat design_leaves for branch B, C, ... until is_last_branch is true.
design_scenarios → walk through Bull / Base / Bear peer tiers
                 → confirm → save_scenarios
preview_tree → confirm_framework (only after user approves the framework)
\`\`\`

\`confirm_framework\` charges a single flat Phase 2 bundle and unlocks Phase 2.

## PHASE 2 — Deep research (server-side, one button)

After \`confirm_framework\`, do NOT pause between steps.

\`\`\`
research_phase2(draft_id, model='pro')
  → Server starts a Tavily deep-research job covering all narrative
    pillars and every leaf's falsification metric in one shot.
    Returns immediately with a tavily_request_id and poll_after_seconds.

research_phase2_status(draft_id) every 30-60 seconds until
  status='ingested'. Typical total time 60-180 seconds for 'pro' model.
  If status='still_running' just wait and poll again. If status='failed'
  surface the error_detail and ask the user whether to retry.

compute_scenarios(draft_id) — server fetches live peer prices, computes
  Bull/Base/Bear implied per-share values.

commit_draft_tree(draft_id, visibility='private') — publish the tree.

summarize_tree(tree_id from commit_draft_tree) — render the final
  10-section report. Present the FULL summarize_tree output to the user
  as the conclusion. Then ask once: 'Set up weekly monitoring?'
\`\`\`

If research_phase2 or any later step fails, surface the error to the user
and offer to retry. Earlier saved data is preserved.

## VIEW FLOW (existing trees)

\`\`\`
my_workspace (start here) → read_tree · read_branch · read_history ·
propose_edit (sandbox) · apply_edit ·
pause_monitoring · resume_monitoring · cancel_monitoring.
\`\`\`

Ask me for a ticker to begin.`;

// SKILL.md \u2014 Anthropic format with YAML frontmatter. The `name` field
// becomes the auto-activation trigger in Claude Code / Claude.ai.
export const SKILL_MD = `---
name: drawtree
description: Use whenever the user wants to analyse a stock ticker, build an investment hypothesis tree, or view a previously-committed Draw Tree. Drives the drawtree MCP server through Phase 1 (framework design, user-confirmed step by step) and Phase 2 (server-side deep research). Triggers on tickers like NVDA, 700.HK, AAPL, etc., or any mention of Draw Tree / drawtree.
license: MIT
---

# Draw Tree (drawtree)

${BODY}
`;

// AGENTS.md \u2014 codex / agents.md spec, no frontmatter, agent-readable
// project instructions. Codex auto-loads from ~/.codex/AGENTS.md (global)
// or any project root.
export const AGENTS_MD = `# Draw Tree (drawtree) \u2014 agent instructions

${BODY}

## How this file is used

Codex CLI reads this file automatically when it lives at:

- \`~/.codex/AGENTS.md\` (global \u2014 every codex session inherits it)
- The root of your current project (per-project override)

You don't need to copy the instructions into chat \u2014 codex picks them
up at session start.
`;

export const SYSTEM_PROMPT = BODY;

// Build a minimal ZIP containing a single SKILL.md file under a folder
// named 'drawtree/'. We use STORE mode (no compression) so we don't need
// a zip library \u2014 the format is well-documented:
// https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
export function buildSkillZip(): Uint8Array {
  const folderName = "drawtree/";
  const fileName   = "drawtree/SKILL.md";
  const fileBody   = new TextEncoder().encode(SKILL_MD);

  // CRC32 table.
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[i] = c >>> 0;
    }
    return t;
  })();
  function crc32(data: Uint8Array): number {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // DOS date/time \u2014 fixed timestamp so output is reproducible.
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (6 << 5) | 9; // 2026-06-09

  type Entry = { name: string; body: Uint8Array; offset: number };
  const entries: Entry[] = [];
  const parts: Uint8Array[] = [];
  let cursor = 0;

  function pushLocal(name: string, body: Uint8Array) {
    const nameBytes = new TextEncoder().encode(name);
    const crc = crc32(body);
    const header = new ArrayBuffer(30);
    const dv = new DataView(header);
    dv.setUint32(0,  0x04034b50, true);   // signature
    dv.setUint16(4,  20, true);            // version needed
    dv.setUint16(6,  0, true);             // general purpose flag
    dv.setUint16(8,  0, true);             // method = 0 (store)
    dv.setUint16(10, dosTime, true);
    dv.setUint16(12, dosDate, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, body.length, true);   // compressed size
    dv.setUint32(22, body.length, true);   // uncompressed size
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);             // extra length
    entries.push({ name, body, offset: cursor });
    parts.push(new Uint8Array(header), nameBytes, body);
    cursor += 30 + nameBytes.length + body.length;
  }

  // Add directory entry first, then file. Most clients tolerate either order.
  pushLocal(folderName, new Uint8Array(0));
  pushLocal(fileName,   fileBody);

  // Central directory.
  const cdParts: Uint8Array[] = [];
  let cdSize = 0;
  for (const e of entries) {
    const nameBytes = new TextEncoder().encode(e.name);
    const crc = crc32(e.body);
    const header = new ArrayBuffer(46);
    const dv = new DataView(header);
    dv.setUint32(0,  0x02014b50, true);  // central dir signature
    dv.setUint16(4,  20, true);           // version made by
    dv.setUint16(6,  20, true);           // version needed
    dv.setUint16(8,  0, true);            // gp flag
    dv.setUint16(10, 0, true);            // method
    dv.setUint16(12, dosTime, true);
    dv.setUint16(14, dosDate, true);
    dv.setUint32(16, crc, true);
    dv.setUint32(20, e.body.length, true);
    dv.setUint32(24, e.body.length, true);
    dv.setUint16(28, nameBytes.length, true);
    dv.setUint16(30, 0, true);            // extra len
    dv.setUint16(32, 0, true);            // comment len
    dv.setUint16(34, 0, true);            // disk number
    dv.setUint16(36, 0, true);            // internal attrs
    dv.setUint32(38, 0, true);            // external attrs
    dv.setUint32(42, e.offset, true);
    cdParts.push(new Uint8Array(header), nameBytes);
    cdSize += 46 + nameBytes.length;
  }
  const cdOffset = cursor;

  // End of central directory record.
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0,  0x06054b50, true);
  ev.setUint16(4,  0, true);              // disk number
  ev.setUint16(6,  0, true);              // start disk
  ev.setUint16(8,  entries.length, true); // entries on this disk
  ev.setUint16(10, entries.length, true); // total entries
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdOffset, true);
  ev.setUint16(20, 0, true);              // comment length

  // Concatenate.
  const total = cursor + cdSize + 22;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts)   { out.set(p, pos); pos += p.length; }
  for (const p of cdParts) { out.set(p, pos); pos += p.length; }
  out.set(new Uint8Array(eocd), pos);
  return out;
}
