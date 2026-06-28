# Portfolio MCP integration — Phase 2 handoff

This document specifies the MCP tools to add to **`hopakhei/drawtree-mcp`** so registered
users can drive the portfolio calculator from an AI client: pull their thesis data, size a
portfolio, and produce a one-click broker rebalance.

It is self-contained — a new Claude Code session scoped to `drawtree-mcp` can implement
everything here. Phase 1 (the compute backbone) is already built and deployed in
`drawtree-dashboard`; these tools are thin wrappers over it.

---

## Architecture (decided)

**Agent-orchestrated execution.** The Draw Tree MCP server never holds broker credentials
and never places trades. It returns a broker-native *order list*; the user's own connected
**Futu MCP / IBKR MCP** executes after a preview-confirm.

```
User's AI client has 3 MCP servers connected: Draw Tree + Futu + IBKR
  1. draw_tree.get_portfolio_ideas()         → ideas pulled from the user's trees
  2. draw_tree.size_portfolio(ideas|tickers) → target weights + correlation table
  3. (agent) futu.get_positions()/ibkr ...   → current positions + NLV
  4. draw_tree.build_rebalance(weights,...)  → broker-native order list (PREVIEW)
  5. user confirms → (agent) futu.place_order()/ibkr.place_order()  [paper-first]
```

---

## The compute backbone (already live)

All math runs in one stateless endpoint in the dashboard — **do not re-implement the
engine in Python**, just call it:

```
POST https://drawtree.capital/api/portfolio/size-and-rebalance
Content-Type: application/json
```

### Request
```jsonc
{
  "ideas": [
    { "ticker": "NVDA", "bull": 260, "bear": 120, "current": 170,
      "conviction": 0.68, "conviction_source": "mcp", "hypothesis": "…",
      "lot_size": 1, "sector": "Technology" }
  ],
  "params": {                      // all optional; defaults shown
    "kelly_fraction": 0.25,
    "position_cap": 0.33,
    "haircut_lambda": 0.9,
    "no_trade_threshold": 0.01
  },
  "execution": {                   // optional — include to get an order list
    "broker": "futu",             // "futu" | "ibkr"
    "nlv": 1000000,                // account net liquidation value
    "positions": [{ "ticker": "NVDA", "shares": 1000 }],
    "trd_env": "SIMULATE"         // "SIMULATE" (default, paper) | "REAL"
  },
  "fetch_prices": true             // fill missing `current` from live quotes
}
```

### Response (prod-spec §11 shape)
```jsonc
{
  "ok": true,
  "allocations": [
    { "ticker": "NVDA", "target_weight": 0.33, "raw_kelly": 0.43, "flag": "capped",
      "current_weight": 0.17, "action": "BUY", "delta_value": 160000,
      "qty": 941, "lot_size": 1 }
  ],
  "cash": 0.01,
  "cash_reason": "diversification_limit",
  "portfolio_conviction": 1.04,
  "excluded": [{ "ticker": "BAD", "flag": "do_not_buy", "reason": "…" }],
  "correlation": {
    "tickers": ["NVDA","…"], "used": [[1,…]], "sameDay": [[1,…]],
    "window": 5, "obs": 126, "source": "yahoo", "missing": []
  },
  "rebalance_command": {
    "type": "place_orders", "broker": "futu", "trd_env": "SIMULATE",
    "orders": [{ "code": "NVDA", "side": "BUY", "qty": 941, "order_type": "NORMAL" }],
    "skipped": [], "note": "…"
  },
  "warnings": ["…"]
}
```

The endpoint is pure compute (no auth). It does Kelly → Fundamental-Law correlation haircut
→ 33% cap → cash fallback, and (when `execution.nlv` is given) the rebalance deltas with
board-lot rounding + no-trade threshold. `correlation.used` is the cross-market-adjusted
matrix (overlapping multi-day returns, so ADR/local dual listings aren't understated);
`sameDay` is the raw figure for transparency.

---

## Tool 1 — `get_portfolio_ideas`

Pull the caller's committed theses and map them to engine ideas. Runs under the user's
Draw Tree identity (same auth as the other account tools).

- **Input:** `{ "tickers"?: string[] }` — optional filter; default = all the user's trees.
- **Source:** the existing trees API (same data the dashboard reads), per ticker:
  ```
  GET {API_BASE}/v1/trees/{ticker}        # or the user's workspace listing
  ```
- **Mapping (exact field paths):**
  | idea field | from tree |
  |---|---|
  | `ticker` | `tree.ticker` |
  | `current` | `tree.tree.valuation.snapshot_price` |
  | `bull` | `tree.tree.valuation.scenarios.bull.target_price` |
  | `bear` | `tree.tree.valuation.scenarios.bear.target_price` |
  | `conviction` | `tree.aggregation.conviction` |
  | `conviction_source` | `"mcp"` |
- **Output:** `{ "ideas": Idea[] }` ready to pass to `size_portfolio`.

## Tool 2 — `size_portfolio`

- **Input:** `{ "ideas"?: Idea[], "tickers"?: string[], "params"?: {...}, "fetch_prices"?: bool }`
  - If `tickers` given but not `ideas`, call `get_portfolio_ideas` first.
- **Action:** `POST /api/portfolio/size-and-rebalance` with `{ ideas, params, fetch_prices }`
  (no `execution`).
- **Output:** `allocations`, `cash`, `portfolio_conviction`, `correlation`, `warnings`.

## Tool 3 — `build_rebalance`

- **Input:** `{ "ideas": Idea[], "broker": "futu"|"ibkr", "nlv": number,
  "positions": [{ticker,shares}], "params"?: {...}, "trd_env"?: "SIMULATE"|"REAL" }`
- **Action:** same endpoint, **with** the `execution` block.
- **Output:** `rebalance_command` (broker-native order list) + enriched `allocations`.
- **Safety:** default `trd_env="SIMULATE"`; never auto-place; the response `note` tells the
  agent to preview-then-confirm and hand orders to the user's Futu/IBKR MCP.

### Reference implementation sketch (adapt to this server's tool-registration pattern)
```python
import os, httpx

DASH = os.environ.get("DASHBOARD_BASE", "https://drawtree.capital")

async def _size_and_rebalance(payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(f"{DASH}/api/portfolio/size-and-rebalance", json=payload)
        r.raise_for_status()
        return r.json()

# size_portfolio
async def size_portfolio(ideas=None, tickers=None, params=None, fetch_prices=True):
    if ideas is None and tickers:
        ideas = (await get_portfolio_ideas(tickers))["ideas"]
    return await _size_and_rebalance({"ideas": ideas, "params": params or {},
                                      "fetch_prices": fetch_prices})

# build_rebalance
async def build_rebalance(ideas, broker, nlv, positions, params=None, trd_env="SIMULATE"):
    return await _size_and_rebalance({
        "ideas": ideas, "params": params or {},
        "execution": {"broker": broker, "nlv": nlv,
                      "positions": positions, "trd_env": trd_env},
    })
```

---

## Agent playbook (one-click rebalance)

Ship as a short skill/prompt so the model runs the loop conversationally:

1. `get_portfolio_ideas` → confirm the ticker set with the user (they can drop/add names).
2. `size_portfolio(selected)` → show target weights + the correlation table.
3. Read the user's account via their broker MCP: `futu.get_positions` / `ibkr.get_positions`
   + NLV.
4. `build_rebalance(...)` → show the order list (paper-first).
5. **Confirm**, then place each order via the broker MCP (`place_order`). Honor
   `unlock_trade` (Futu) / disable read-only (IBKR) before any REAL order.

---

## Open decisions for Phase 2

- **Credit metering:** are these tools free or paid (like the other paid MCP tools)?
  `size_portfolio` is cheap compute; `get_portfolio_ideas` reads existing data.
- **Persistence:** add `save_portfolio` / `get_portfolio` (DB) so a constructed portfolio
  survives between sessions? Needs a table in `drawtree-api`.
- **Symbol convention:** the endpoint accepts both Yahoo (`0700.HK`) and Futu (`HK.00700`)
  styles; pick one canonical form for the tool I/O.
```
