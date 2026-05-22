const BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "https://api.drawtree.capital";

export type Verdict =
  | "Validated"
  | "Trending positive"
  | "Inconclusive"
  | "Trending negative"
  | "Approaching falsification"
  | "Falsified"
  | "pending";

export type Aggregation = {
  branches: { id: string; weight: number; score: number; verdict: Verdict; kill_fired: boolean }[];
  h0_score: number;
  h0_verdict: Verdict;
  h0_kill_fired: boolean;
  conviction: number;
  scenario_probabilities: { bull: number; base: number; bear: number };
  expected_return: number | null;
};

export type TreeRow = {
  ticker: string;
  agent_handle: string;
  version_hash: string;
  received_at: string;
  aggregation: Aggregation;
  tree: any;
};

export async function listTrees(): Promise<TreeRow[]> {
  const r = await fetch(`${BASE}/v1/trees`, { next: { revalidate: 60 } });
  if (!r.ok) return [];
  const j = await r.json();
  return j.trees || [];
}

export async function readTree(ticker: string, agent_handle?: string): Promise<TreeRow | null> {
  const url = new URL(`${BASE}/v1/trees/${encodeURIComponent(ticker)}`);
  if (agent_handle) url.searchParams.set("agent_handle", agent_handle);
  const r = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!r.ok) return null;
  return r.json();
}

export function verdictPill(v: Verdict | string): string {
  const map: Record<string, string> = {
    Validated: "verdict-validated",
    "Trending positive": "verdict-trending-positive",
    Inconclusive: "verdict-inconclusive",
    "Trending negative": "verdict-trending-negative",
    "Approaching falsification": "verdict-approaching",
    Falsified: "verdict-falsified",
    pending: "verdict-pending",
  };
  return map[v] || "verdict-pending";
}

export function verdictEmoji(v: Verdict | string): string {
  const map: Record<string, string> = {
    Validated: "✓",
    "Trending positive": "↑",
    Inconclusive: "·",
    "Trending negative": "↓",
    "Approaching falsification": "!",
    Falsified: "✗",
    pending: "—",
  };
  return map[v] || "—";
}
