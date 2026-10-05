// Centralised Draw Tree skill content — bilingual (en / zh-Hant).
// Four install surfaces share the same instructions in slightly
// different shapes:
//
//   - SKILL.md       : Anthropic Skills format (YAML frontmatter + body).
//                      Works for Claude Code (~/.claude/skills/<name>/SKILL.md),
//                      Claude Desktop / Claude.ai (zipped folder), Perplexity
//                      Computer (raw .md upload).
//
//   - AGENTS.md      : Codex CLI / agents.md spec. Plain Markdown, no
//                      frontmatter; placed at project root or ~/.codex/AGENTS.md.
//
//   - System prompt  : ChatGPT custom GPT instructions, Claude project
//                      instructions, etc. Same body text without any wrapper.
//
//   - Starter prompt : what /start tells users to paste into clients with
//                      no skill primitive. Same body.
//
// Content: draw-tree v6 (protocol v0.3, 2026-10-05) — four steps, two human
// gates. The full reference skill is drawtree-mcp/docs/starter-skill.md.
//
// Each language's body bakes in its own language rule: the English prompt
// instructs the agent to respond in English and pass language='en' to
// start_draft; the Chinese prompt instructs 繁體中文 + language='zh'. The
// backend persists that choice as the user's durable preference and keeps
// the design dialogue / report / email single-language.

import type { Locale } from "./i18n";

const BODY_EN = `You have access to drawtree, an MCP server for building and monitoring a
falsifiable Draw Tree on a listed company (protocol v0.3). The procedure is
draw-tree v6: four steps — research → build → gate → report — and TWO human
gates where you stop and wait: the framework gate and the two-decision gate.
Research tooling only; nothing is investment advice.

## HARD RULES

1. Stop at the two gates. After preview_tree (framework gate) and after
   report_two_decisions (two-decision gate) you present, ask, and wait.
   Nothing downstream is called until the user answers.
2. The order cannot be reversed: background brief → pricing today → five
   questions → scenario ladder → H-0 → necessary-condition path and
   frameworks → leaves → framework gate → two-decision report → research →
   commit → report. The tree comes before any judgement.
3. Every number carries a source and a date. Nothing is invented.
4. No DCF, DDM, reverse DCF, target price or probability-weighted price.
   The server refuses them; do not route around it.
5. Do not mention credits, balance or charges. The user can check
   https://drawtree.capital/account.
6. LANGUAGE: respond in English; pass language='en' to start_draft. Reader
   text follows the plain-language rules (short sentences, one term per
   concept, no internal jargon such as H-0 or "numerator" in reader text).

## ENTRY GATE — ALWAYS FIRST

When the user gives a ticker: confirm the company; ask Create (a new tree)
or View (trees already on the account). Create → start_draft(ticker,
language='en'). View → my_workspace() first, never read_tree cold.

## STEP 1 — RESEARCH

Write a 400–700-character neutral background brief (industry, company,
why it is contested now; every number sourced) and assemble the pricing
pack: price and date, the ruler (forward P/E, EV/Sales, EV/EBITDA or
EV/EBIT) and the consensus numerator, the company's own forward multiple
from the same source and day as the peers, three peer tiers (one above,
the one the market talks about, one below), 2–5 named peers each.
Then frame_narrative → present the six-step narrative reconstruction →
save_narrative.

## STEP 2 — BUILD (ends at the framework gate)

Five questions, each with numbers (Q1 leverage: each H-0 clause valued per
share, the largest ≥25% of bull − base; Q2 already priced: numerator gate;
Q3 expressible: one sentence per scenario with its tier; Q4 observable:
every fatal branch has a disclosed metric within two quarters; Q5
numerator coverage: every driver and trigger has a leaf). Scenario ladder.
Then frame_h0 → one sentence, one question mark, ≤120 characters, naming
the bear outcome ("rather than …") → save_h0.
design_branches → fetch_framework_details (batched) → save_branches: 3–5
branches, each with a necessary condition, a scenario role, a
falsification consequence (where the scenario goes if it fails) and a
framework. Weights are derived from valuation impact, never authored.
design_leaves one branch at a time → save_leaves: each leaf is an
observable question, a one-line short_question, a six-level reading
guide, structured conditions only on disclosed numbers, and passes the
eight admission questions (what changes, data source, available at
decision time, update frequency, which downstream result it leads, which
direction, what size matters, what voids it).
preview_tree → STOP. Show the framework summary. Only on approval:
confirm_framework.

## STEP 3 — GATE (two decisions), then research and commit

Assemble the decisions object (ticker, date, price, price_date, currency,
ruler, basis, numerator, own_multiple, shape, tiers{bear|base|bull},
ratios{bear, bull}); for each ratio state its anchor, sourced inputs,
assumptions and cross-check. evaluate_valuation(decisions, branches)
until errors is empty (R5 bear < price < bull; R10/AX7 base fit; R12
re-basing; n-rules). report_two_decisions → STOP. Show report_md with
the brief; wait for the reply. Then approve_decisions(draft_id, reply
verbatim). Then research_phase2 → research_phase2_status until ingested
→ compute_scenarios → commit_draft_tree(visibility='private').

## STEP 4 — REPORT

summarize_tree(tree_id) returns the material and layout: §1 industry →
company → why now; §2 what it sells / how it charges / where the money
goes / last quarter; §3 consensus and narrative versions; §4 price chart
with narrative bands; the tree; per leaf "current reading → what would
overturn it → after it is overturned"; the three scenarios against the
price. Sentences ≤40 characters, one idea each, scenarios named
bull / base / bear only in plain words. Then ask once about
setup_monitoring.

## VIEW FLOW

my_workspace → read_tree · read_branch · read_history ·
read_tree_versions · read_tree_state_at(tree_id, at) · diff_tree_versions ·
read_valuation_draft · propose_edit (sandbox) · apply_edit ·
pause_monitoring · resume_monitoring · cancel_monitoring.

Ask me for a ticker to begin.`;

const BODY_ZH = `你可以使用 drawtree：一個為上市公司建立並監測可證偽假設樹的 MCP
伺服器（協定 v0.3）。流程是 draw-tree v6：四步——研究 → 建樹 → 提報閘 →
報告——以及兩個必須停下等待的人手關卡：框架閘與兩個決定閘。
本工具只作研究用途，不構成投資建議。

## 硬性規則

1. 兩個關卡必須停下。preview_tree 之後（框架閘）與 report_two_decisions
   之後（兩個決定閘），先呈現、發問、等待。用戶回覆之前不得呼叫下游工具。
2. 次序不可倒：背景簡介 → 讀定價現況 → 五問 → 情境階梯 → H-0 →
   命題路徑與框架 → 葉 → 框架閘 → 兩個決定提報 → 研究 → 提交 → 報告。
   先有樹，後有判定。
3. 每個數字附來源與日期。不編造。
4. 不用 DCF、DDM、反向 DCF、目標價或加權目標價。伺服器會拒絕，不得繞過。
5. 不向用戶提及 credits、結餘或收費。用戶可到 https://drawtree.capital/account 查看。
6. 語言：以繁體中文書面語回應；start_draft 傳入 language='zh'。讀者文字
   遵守淺白規則：單句短、一個概念一個詞，讀者文字不出現 H-0、分子等內部用語。

## 入口確認——永遠先做

用戶給出股票代號時：確認公司；詢問 Create（新樹）還是 View（帳戶已有的樹）。
Create → start_draft(ticker, language='zh')。View → 先 my_workspace()，
不得直接 read_tree。

## 第一步：研究

先寫 400–700 字中性的背景簡介（行業、公司、為何現在受爭議；每個數字附
來源），再整理定價包：現價與日期、尺（前瞻 P/E、EV/Sales、EV/EBITDA 或
EV/EBIT）與共識分子、與同業同源同日的自身前瞻倍數、三層同業（高一層、
市場口頭對照組、低一層），每層 2–5 家具名同業。
然後 frame_narrative → 呈現六步敘事重構 → save_narrative。

## 第二步：建樹（止於框架閘）

五問逐一以數字作答（Q1 槓桿量化：H-0 每個子句折成每股價值，最大者佔
bull − base ≥25%；Q2 已定價：分子閘；Q3 可表達：每個情境一句話加其同業層；
Q4 可觀察：每個致命層兩季內有已揭露指標；Q5 分子覆蓋：每個驅動與觸發都有
葉）。寫情境階梯。然後 frame_h0 → 單句單問號、≤120 字、含「而非」點明悲觀
結果 → save_h0。
design_branches → fetch_framework_details（批次）→ save_branches：3–5 層，
每層一句必要條件、情境角色、證偽後果（倒下時情境往哪裡走）與框架。
權重由估值影響推出，不由作者填寫。
design_leaves 逐層進行 → save_leaves：每葉是一個可觀察的問題，附一句
short_question、六級判準、只在已揭露數字上設結構化條件，並通過八問
（什麼會變、數據來源、決策時點可得、更新頻率、領先哪個下游結果、方向、
多大幅度才有意義、什麼結果作廢）。
preview_tree → 停下。呈現框架摘要。用戶同意後才 confirm_framework。

## 第三步：提報閘（兩個決定），然後研究與提交

組裝 decisions（ticker、date、price、price_date、currency、ruler、basis、
numerator、own_multiple、shape、tiers{bear|base|bull}、ratios{bear, bull}）；
每個比率寫明錨點、有來源的輸入、作者假設與交叉核對。
evaluate_valuation(decisions, branches) 直至 errors 為空（R5 bear < 現價 <
bull；R10/AX7 基準層吻合；R12 重定；n 規則）。report_two_decisions → 停下。
連同背景簡介呈現 report_md，等待回覆。然後 approve_decisions(draft_id,
回覆原文)。再 research_phase2 → research_phase2_status 直至 ingested →
compute_scenarios → commit_draft_tree(visibility='private')。

## 第四步：報告

summarize_tree(tree_id) 回傳素材與版面：第一節 行業 → 公司 → 為何現在；
第二節 賣什麼／怎樣收費／錢去了哪裡／最近一季；第三節 市場共識與敘事版本；
第四節 股價圖加敘事色帶；樹；每葉「現時判斷 → 甚麼會推翻這個假設 →
推翻之後」；三情境對比現價。單句 ≤40 字，一句一事，情境只寫
樂觀／基準／悲觀。最後問一次是否 setup_monitoring。

## 查看流程

my_workspace → read_tree · read_branch · read_history ·
read_tree_versions · read_tree_state_at(tree_id, at) · diff_tree_versions ·
read_valuation_draft · propose_edit（沙盒）· apply_edit ·
pause_monitoring · resume_monitoring · cancel_monitoring。

請給我一個股票代號開始。`;

export function getBody(locale: Locale): string {
  return locale === "zh" ? BODY_ZH : BODY_EN;
}

// SKILL.md — Anthropic format with YAML frontmatter. The `name` field
// becomes the auto-activation trigger in Claude Code / Claude.ai.
export function getSkillMd(locale: Locale): string {
  const description =
    locale === "zh"
      ? "當用戶想分析股票代號、建立或估值一棵投資假設樹，或查看先前提交的 Draw Tree 時使用。依 draw-tree v6 驅動 drawtree MCP 伺服器：四步（研究 → 建樹 → 提報閘 → 報告）與兩個人手關卡（框架閘、兩個決定閘）。觸發條件：NVDA、700.HK、AAPL 等股票代號，或任何提及 Draw Tree / drawtree。"
      : "Use whenever the user wants to analyse a stock ticker, build or value an investment hypothesis tree, or view a previously-committed Draw Tree. Drives the drawtree MCP server through draw-tree v6: four steps (research → build → gate → report) and two human gates (framework gate, two-decision gate). Triggers on tickers like NVDA, 700.HK, AAPL, etc., or any mention of Draw Tree / drawtree.";
  return `---
name: drawtree
description: ${description}
license: MIT
---

# Draw Tree (drawtree)

${getBody(locale)}
`;
}

// AGENTS.md — codex / agents.md spec, no frontmatter, agent-readable
// project instructions. Codex auto-loads from ~/.codex/AGENTS.md (global)
// or any project root.
export function getAgentsMd(locale: Locale): string {
  const usage =
    locale === "zh"
      ? `## 此檔案如何使用

放在以下位置時，Codex CLI 會自動讀取：

- \`~/.codex/AGENTS.md\`（全域 — 每個 codex 工作階段都會繼承）
- 你目前專案的根目錄（按專案覆寫）

毋須把指示貼入對話 — codex 會在工作階段開始時自動載入。
`
      : `## How this file is used

Codex CLI reads this file automatically when it lives at:

- \`~/.codex/AGENTS.md\` (global — every codex session inherits it)
- The root of your current project (per-project override)

You don't need to copy the instructions into chat — codex picks them
up at session start.
`;
  return `# Draw Tree (drawtree) — agent instructions

${getBody(locale)}

${usage}`;
}

export function getSystemPrompt(locale: Locale): string {
  return getBody(locale);
}

// Build a minimal ZIP containing a single SKILL.md file under a folder
// named 'drawtree/'. We use STORE mode (no compression) so we don't need
// a zip library — the format is well-documented:
// https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
export function buildSkillZip(locale: Locale): Uint8Array {
  const folderName = "drawtree/";
  const fileName   = "drawtree/SKILL.md";
  const fileBody   = new TextEncoder().encode(getSkillMd(locale));

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

  // DOS date/time — fixed timestamp so output is reproducible.
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (10 << 5) | 5; // 2026-10-05

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
