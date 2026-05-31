"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "https://drawtree-api.onrender.com";
const MCP_URL = "https://drawtree-mcp.onrender.com/mcp";

type Me = {
  agent_id: string;
  handle: string;
  display_name: string;
  email: string;
  balance: number;
  held: number;
  available: number;
  lifetime_spent: number;
  lifetime_refunded: number;
};

export default function Account() {
  const [apiKey, setApiKey] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    const fromQs = new URLSearchParams(window.location.search).get("api_key");
    if (fromQs) {
      setApiKey(fromQs);
      // Clear the URL so the key doesn't sit in history
      window.history.replaceState({}, "", "/account");
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    setLoading(true);
    fetch(`${API_URL}/v1/account/me`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => {
        setMe(d);
        setError(null);
      })
      .catch((e) => setError(`Lookup failed (${e?.message || "unknown"})`))
      .finally(() => setLoading(false));
  }, [apiKey]);

  async function startTopup(preset: "5" | "20" | "50" | "100") {
    if (!apiKey) return;
    const r = await fetch(`${API_URL}/v1/account/topup_checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ preset }),
    });
    const body = await r.json();
    if (r.ok && body.checkout_url) {
      window.location.href = body.checkout_url;
    } else {
      setError(body?.detail?.message || body?.detail?.code || "Top-up failed");
    }
  }

  async function regenerate() {
    if (!apiKey) return;
    if (!confirm("Issue a new API key? Your current key will stop working immediately.")) return;
    const r = await fetch(`${API_URL}/v1/account/regenerate_key`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await r.json();
    if (r.ok && body.api_key) {
      setNewKey(body.api_key);
      setApiKey(body.api_key);
    } else {
      setError(body?.detail?.code || "Regenerate failed");
    }
  }

  // Step 1 — ask for the key
  if (!apiKey) {
    return (
      <main className="max-w-md mx-auto px-6 py-14">
        <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
          ← Drawtree
        </Link>
        <h1 className="text-3xl tracking-tight mt-3">Account</h1>
        <p className="text-muted text-sm mt-2">
          Paste your API key to view your balance and top up. The key stays in
          your browser — it is not stored on this server.
        </p>
        <input
          type="text"
          placeholder="dt_…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mt-6 w-full px-3 py-2 border border-line rounded text-sm font-mono"
        />
        <p className="text-xs text-muted mt-4">
          No account yet?{" "}
          <Link href="/signup" className="underline">
            Sign up free
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
        ← Drawtree
      </Link>
      <h1 className="text-3xl tracking-tight mt-3">My account</h1>

      {loading && <p className="text-sm text-muted mt-4">Loading…</p>}
      {error && (
        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {me && (
        <>
          <section className="mt-8 border border-line rounded p-6">
            <div className="text-xs uppercase tracking-wider text-muted mb-1">
              Balance
            </div>
            <div className="text-4xl tracking-tight">
              {me.available}
              <span className="text-sm text-muted ml-2">available credits</span>
            </div>
            <div className="text-xs text-muted mt-2">
              Total balance {me.balance} · held {me.held} · lifetime spent {me.lifetime_spent}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(["5", "20", "50", "100"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => startTopup(p)}
                  className="px-3 py-2 text-sm border border-line rounded hover:bg-line/40"
                >
                  + ${p} ({Number(p) * 8} credits)
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 border border-line rounded p-6">
            <h2 className="text-lg">MCP setup</h2>
            <p className="text-xs text-muted mt-1 mb-4">
              Add a custom MCP connector in your AI client with these details.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">MCP server URL</span>
                <code className="text-xs">{MCP_URL}</code>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Auth header</span>
                <code className="text-xs">Authorization</code>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Value</span>
                <code className="text-xs">
                  Bearer {apiKey.slice(0, 8)}…
                </code>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(MCP_URL)}
                className="px-3 py-1.5 text-xs border border-line rounded hover:bg-line/40"
              >
                Copy MCP URL
              </button>
              <Link
                href="/start"
                className="px-3 py-1.5 text-xs border border-line rounded hover:bg-line/40"
              >
                Setup guide →
              </Link>
            </div>
          </section>

          <section className="mt-6 border border-line rounded p-6">
            <h2 className="text-lg">Account details</h2>
            <div className="mt-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Email</span>
                <span>{me.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Handle</span>
                <code className="text-xs">{me.handle}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Display name</span>
                <span>{me.display_name}</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-line">
              <h3 className="text-sm font-medium">Rotate API key</h3>
              <p className="text-xs text-muted mt-1">
                If you suspect your key is compromised. Your current key stops
                working immediately.
              </p>
              <button
                onClick={regenerate}
                className="mt-3 px-3 py-1.5 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50"
              >
                Regenerate key
              </button>
              {newKey && (
                <div className="mt-4 p-4 bg-line/10 border border-line rounded">
                  <div className="text-xs uppercase tracking-wider text-muted mb-1">
                    Your new API key — copy it now
                  </div>
                  <code className="text-xs font-mono break-all">{newKey}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(newKey)}
                    className="mt-2 px-2 py-1 text-xs border border-line rounded hover:bg-line/40"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
