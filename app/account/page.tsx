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

type DraftRow = {
  draft_id: string;
  ticker: string;
  stage: string;
  framework_confirmed: boolean;
  suggested_next_tool: string | null;
  created_at: string;
  updated_at: string;
};

type TreeRow = {
  tree_id: string;
  ticker: string;
  visibility: string;
  latest_verdict: any;
  committed_at: string | null;
  updated_at: string | null;
};

type Workspace = {
  drafts: DraftRow[];
  draft_count: number;
  trees: TreeRow[];
  tree_count: number;
};

type SignInState = "idle" | "sending" | "sent" | "verifying" | "error";

export default function Account() {
  const [apiKey, setApiKey] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  // Sign-in (magic link) UI state
  const [email, setEmail] = useState("");
  const [signInState, setSignInState] = useState<SignInState>("idle");
  const [signInMsg, setSignInMsg] = useState<string | null>(null);
  const [devModeLink, setDevModeLink] = useState<string | null>(null);
  const [showKeyFallback, setShowKeyFallback] = useState(false);

  // Top-up status banner (after returning from Stripe)
  const [topupBanner, setTopupBanner] = useState<
    null | { kind: "success" | "cancel" | "pending"; message: string }
  >(null);
  const [pollAttempts, setPollAttempts] = useState(0);

  // Workspace overview (drafts + trees)
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // On mount: look for ?token=... (magic link click), ?api_key=...,
  // or a previously-saved key in sessionStorage so Stripe-redirect
  // round-trips don't log the user out.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const token = qs.get("token");
    const fromQs = qs.get("api_key");

    if (token) {
      // Verify magic-link token → get new API key
      setSignInState("verifying");
      fetch(`${API_URL}/v1/account/verify_login_link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) {
            const code = d?.detail?.code || d?.code || "UNKNOWN";
            throw new Error(code);
          }
          return d;
        })
        .then((d) => {
          setApiKey(d.api_key);
          setNewKey(d.api_key);
          try {
            sessionStorage.setItem("drawtree_api_key", d.api_key);
          } catch {}
          setSignInState("idle");
          window.history.replaceState({}, "", "/account");
        })
        .catch((e) => {
          const code = String(e?.message || "");
          const friendly =
            code === "TOKEN_EXPIRED"
              ? "Your sign-in link has expired. Request a new one."
              : code === "TOKEN_ALREADY_USED"
              ? "This sign-in link has already been used. Request a new one."
              : code === "INVALID_TOKEN"
              ? "This sign-in link is invalid. Request a new one."
              : "Sign-in failed. Request a new link.";
          setSignInState("error");
          setSignInMsg(friendly);
          window.history.replaceState({}, "", "/account");
        });
      return;
    }

    if (fromQs) {
      setApiKey(fromQs);
      try {
        sessionStorage.setItem("drawtree_api_key", fromQs);
      } catch {}
      window.history.replaceState({}, "", "/account");
      return;
    }

    // Restore session from sessionStorage (Stripe redirect, refresh).
    try {
      const saved = sessionStorage.getItem("drawtree_api_key");
      if (saved) setApiKey(saved);
    } catch {}

    // Top-up return banner. Webhook usually credits within 3-10s.
    const topup = qs.get("topup");
    if (topup === "success") {
      setTopupBanner({
        kind: "pending",
        message:
          "Payment received. Adding credits to your account — this usually takes a few seconds.",
      });
      // Strip the query so a manual refresh doesn't re-trigger the banner.
      window.history.replaceState({}, "", "/account");
    } else if (topup === "cancel") {
      setTopupBanner({
        kind: "cancel",
        message:
          "Payment cancelled. No charges were made and your account is unchanged.",
      });
      window.history.replaceState({}, "", "/account");
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/v1/account/me`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }).then(async (r) => {
        if (!r.ok) throw new Error(`me ${r.status}`);
        return r.json();
      }),
      fetch(`${API_URL}/v1/account/workspace`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }).then(async (r) => {
        if (!r.ok) throw new Error(`workspace ${r.status}`);
        return r.json();
      }),
    ])
      .then(([m, w]) => {
        setMe(m);
        setWorkspace(w);
        setError(null);
      })
      .catch((e) => setError(`Lookup failed (${e?.message || "unknown"})`))
      .finally(() => setLoading(false));
  }, [apiKey]);

  // Poll for balance updates while a top-up is pending
  useEffect(() => {
    if (!apiKey || !me || !topupBanner || topupBanner.kind !== "pending")
      return;
    if (pollAttempts >= 12) {
      // ~24s elapsed; webhook clearly delayed.
      setTopupBanner({
        kind: "pending",
        message:
          "Your payment is confirmed but credits haven't landed yet. Refresh in a minute. If it still hasn't updated, email support@drawtree.capital.",
      });
      return;
    }
    const startBalance = me.balance;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/v1/account/me`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!r.ok) throw new Error(`${r.status}`);
        const d = await r.json();
        setMe(d);
        if (d.balance > startBalance) {
          const credited = d.balance - startBalance;
          setTopupBanner({
            kind: "success",
            message: `${credited} credits added. Your new balance is ${d.balance}.`,
          });
        } else {
          setPollAttempts((n) => n + 1);
        }
      } catch {
        setPollAttempts((n) => n + 1);
      }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, me?.balance, topupBanner?.kind, pollAttempts]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSignInState("sending");
    setSignInMsg(null);
    setDevModeLink(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/request_login_link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSignInState("error");
        setSignInMsg("Couldn't send link. Try again in a moment.");
        return;
      }
      if (d.unknown_email) {
        // Anti-enumeration: API doesn't tell us, but we still want UX.
        // Generic success message — if email exists, it'll arrive.
        setSignInState("sent");
        setSignInMsg(
          "If that email is registered, a sign-in link is on the way. Check your inbox (and spam)."
        );
        return;
      }
      if (d.dev_mode && d.magic_link) {
        // Email sender not configured yet — show the link so the user
        // can still sign in.
        setSignInState("sent");
        setDevModeLink(d.magic_link);
        setSignInMsg(
          "Email sender isn't configured yet — use this one-time sign-in link directly:"
        );
        return;
      }
      setSignInState("sent");
      setSignInMsg(
        "Check your inbox. The link expires in 30 minutes and can be used only once."
      );
    } catch (err: any) {
      setSignInState("error");
      setSignInMsg(`Network error (${err?.message || "unknown"}).`);
    }
  }

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

  async function releaseHolds() {
    if (!apiKey) return;
    const r = await fetch(`${API_URL}/v1/account/release_stale_holds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await r.json();
    if (r.ok) {
      // Refresh balance after release
      const m = await fetch(`${API_URL}/v1/account/me`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (m.ok) setMe(await m.json());
      setTopupBanner({
        kind: "success",
        message:
          body.released_count > 0
            ? `${body.released_count} stuck hold${
                body.released_count > 1 ? "s" : ""
              } released. Your available credits have been restored.`
            : "No stuck holds found.",
      });
    } else {
      setError(body?.detail?.code || "Release failed");
    }
  }

  async function regenerate() {
    if (!apiKey) return;
    if (
      !confirm(
        "Issue a new API key? Your current key will stop working immediately."
      )
    )
      return;
    const r = await fetch(`${API_URL}/v1/account/regenerate_key`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await r.json();
    if (r.ok && body.api_key) {
      setNewKey(body.api_key);
      setApiKey(body.api_key);
      try {
        sessionStorage.setItem("drawtree_api_key", body.api_key);
      } catch {}
    } else {
      setError(body?.detail?.code || "Regenerate failed");
    }
  }

  // ============================================================
  // Sign-in screen
  // ============================================================
  if (!apiKey) {
    return (
      <main className="max-w-md mx-auto px-6 py-14">
        <Link
          href="/"
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          ← Drawtree
        </Link>
        <h1 className="text-3xl tracking-tight mt-3">Sign in</h1>
        <p className="text-muted text-sm mt-2">
          Enter your email and we&apos;ll send you a one-time sign-in link.
          No password needed.
        </p>

        {signInState === "verifying" && (
          <div className="mt-6 text-sm text-muted">Signing you in…</div>
        )}

        {signInState !== "verifying" && (
          <form onSubmit={requestLink} className="mt-6 space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded text-sm"
            />
            <button
              type="submit"
              disabled={signInState === "sending"}
              className="w-full px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
            >
              {signInState === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )}

        {signInMsg && (
          <div
            className={`mt-4 text-sm rounded px-3 py-2 ${
              signInState === "error"
                ? "text-red-700 bg-red-50 border border-red-200"
                : "text-emerald-800 bg-emerald-50 border border-emerald-200"
            }`}
          >
            {signInMsg}
            {devModeLink && (
              <div className="mt-2">
                <a
                  href={devModeLink}
                  className="underline break-all text-xs font-mono"
                >
                  {devModeLink}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 border-t border-line pt-6 text-xs text-muted">
          <p>
            New here?{" "}
            <Link href="/signup" className="underline">
              Create an account
            </Link>
            .
          </p>
          <p className="mt-3">
            Have your API key?{" "}
            <button
              type="button"
              onClick={() => setShowKeyFallback((v) => !v)}
              className="underline"
            >
              Use it instead
            </button>
          </p>
          {showKeyFallback && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="dt_…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded text-sm font-mono"
              />
              <p className="text-[11px] text-muted mt-2">
                Your key stays in this browser — it is not stored on the server.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ============================================================
  // Signed-in view
  // ============================================================
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <Link
        href="/"
        className="text-xs text-muted underline-offset-4 hover:underline"
      >
        ← Drawtree
      </Link>
      <div className="mt-3 flex items-baseline justify-between">
        <h1 className="text-3xl tracking-tight">My account</h1>
        <button
          onClick={() => {
            try {
              sessionStorage.removeItem("drawtree_api_key");
            } catch {}
            setApiKey("");
            setMe(null);
            setNewKey(null);
            setTopupBanner(null);
          }}
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          Sign out
        </button>
      </div>

      {topupBanner && (
        <div
          className={`mt-5 text-sm rounded px-4 py-3 border ${
            topupBanner.kind === "success"
              ? "text-emerald-800 bg-emerald-50 border-emerald-200"
              : topupBanner.kind === "cancel"
              ? "text-muted bg-paper border-line"
              : "text-blue-800 bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-base leading-none">
              {topupBanner.kind === "success"
                ? "✓"
                : topupBanner.kind === "cancel"
                ? "—"
                : "⋯"}
            </span>
            <div className="flex-1">{topupBanner.message}</div>
            <button
              onClick={() => setTopupBanner(null)}
              className="text-xs opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-muted mt-4">Loading…</p>}
      {error && (
        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {newKey && (
        <section className="mt-6 border border-emerald-200 bg-emerald-50/60 rounded p-5">
          <div className="text-xs uppercase tracking-wider text-emerald-800 mb-1">
            Your API key — copy it now
          </div>
          <p className="text-xs text-emerald-900/70 mb-3">
            This is the only time it will be shown. You&apos;ll need it to
            connect your MCP client. If you lose it, sign in by email again
            to get a fresh one.
          </p>
          <code className="text-xs font-mono break-all block bg-white border border-emerald-200 rounded px-3 py-2">
            {newKey}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(newKey)}
            className="mt-3 px-3 py-1.5 text-xs border border-emerald-300 bg-white rounded hover:bg-emerald-50"
          >
            Copy
          </button>
        </section>
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
              Total balance {me.balance} · held {me.held} · lifetime spent{" "}
              {me.lifetime_spent}
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

          {workspace && (
            <section className="mt-6 border border-line rounded p-6">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg">My workspace</h2>
                <span className="text-xs text-muted">
                  {workspace.draft_count} draft{workspace.draft_count === 1 ? "" : "s"} ·{" "}
                  {workspace.tree_count} tree{workspace.tree_count === 1 ? "" : "s"}
                </span>
              </div>

              {workspace.draft_count === 0 && workspace.tree_count === 0 && (
                <p className="text-sm text-muted">
                  No work yet. Start a new tree by talking to your AI client with
                  the Draw Tree MCP connector set up.
                </p>
              )}

              {workspace.draft_count > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                    Drafts in progress
                  </h3>
                  <ul className="divide-y divide-line border border-line rounded">
                    {workspace.drafts.map((d) => (
                      <li
                        key={d.draft_id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{d.ticker}</div>
                          <div className="text-xs text-muted truncate">
                            {d.stage.toLowerCase().replace(/_/g, " ")} · next:{" "}
                            <code className="text-[11px]">
                              {d.suggested_next_tool || "—"}
                            </code>
                          </div>
                        </div>
                        <code className="text-[10px] text-muted shrink-0">
                          {d.draft_id.slice(0, 8)}…
                        </code>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted mt-2">
                    Resume any draft by asking your AI client to continue the
                    relevant ticker. The next tool to call is shown above.
                  </p>
                </div>
              )}

              {workspace.tree_count > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                    Committed trees
                  </h3>
                  <ul className="divide-y divide-line border border-line rounded">
                    {workspace.trees.map((t) => {
                      const v =
                        t.latest_verdict &&
                        typeof t.latest_verdict === "object"
                          ? t.latest_verdict.h0_verdict ||
                            t.latest_verdict.verdict ||
                            null
                          : null;
                      return (
                        <li
                          key={t.tree_id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">
                              {t.ticker}
                              <span className="ml-2 text-[10px] uppercase tracking-wider text-muted">
                                {t.visibility}
                              </span>
                            </div>
                            <div className="text-xs text-muted truncate">
                              {v ? `Verdict: ${v}` : "No verdict yet"}
                            </div>
                          </div>
                          <code className="text-[10px] text-muted shrink-0">
                            {t.tree_id.slice(0, 8)}…
                          </code>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          )}

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
                <code className="text-xs">Bearer {apiKey.slice(0, 8)}…</code>
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
              <h3 className="text-sm font-medium">Release stuck credits</h3>
              <p className="text-xs text-muted mt-1">
                If credits show as &ldquo;held&rdquo; but nothing is running
                (e.g. a tool crashed mid-call), this refunds every pending
                hold older than 5 minutes back to your available balance.
              </p>
              <button
                onClick={releaseHolds}
                className="mt-3 px-3 py-1.5 text-xs border border-line rounded hover:bg-line/40"
              >
                Release stuck credits
              </button>
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
            </div>
          </section>
        </>
      )}
    </main>
  );
}
