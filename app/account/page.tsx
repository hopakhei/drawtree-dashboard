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

  // On mount: look for ?token=... (magic link click) or ?api_key=...
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
      <h1 className="text-3xl tracking-tight mt-3">My account</h1>

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
