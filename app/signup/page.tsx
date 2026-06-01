"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = "https://drawtree-api.onrender.com";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    api_key: string;
    balance_credits: number;
    handle: string;
    mcp_url: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/v1/account/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          display_name: displayName || null,
        }),
      });
      const body = await r.json();
      if (!r.ok) {
        if (r.status === 409 || body?.detail?.code === "EMAIL_ALREADY_REGISTERED") {
          setError(
            body?.detail?.message ||
              "An account with this email already exists. Sign in by email instead."
          );
        } else {
          setError(body?.detail?.message || body?.detail?.code || body?.detail || "Signup failed");
        }
      } else {
        setResult(body);
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-14">
        <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
          ← Drawtree
        </Link>
        <h1 className="text-3xl tracking-tight mt-3">Welcome.</h1>
        <p className="text-muted text-sm mt-2">
          Your account is ready. <strong>Copy your API key now</strong> — it
          will not be shown again.
        </p>

        <section className="mt-8 border border-line rounded p-6">
          <div className="text-xs uppercase tracking-wider text-muted mb-1">
            API key
          </div>
          <code className="text-sm font-mono break-all">{result.api_key}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.api_key);
            }}
            className="mt-3 px-3 py-1.5 text-xs border border-line rounded hover:bg-line/40"
          >
            Copy API key
          </button>
        </section>

        <section className="mt-6 border border-line rounded p-6 text-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-muted">Handle</span>
            <code>{result.handle}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Starting balance</span>
            <span>{result.balance_credits} credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">MCP server URL</span>
            <code className="text-xs">{result.mcp_url}</code>
          </div>
        </section>

        <section className="mt-6 border border-line rounded p-6">
          <h2 className="text-lg">Connect to Perplexity</h2>
          <ol className="text-sm text-muted list-decimal list-inside space-y-1 mt-3">
            <li>Settings → Connectors → + Custom → Remote</li>
            <li>MCP URL: <code>{result.mcp_url}</code></li>
            <li>Auth: API Key</li>
            <li>Header name: <code>Authorization</code></li>
            <li>Value: <code>Bearer {result.api_key.slice(0, 12)}…</code></li>
          </ol>
          <p className="text-xs text-muted mt-3">
            If the connector UI doesn't accept a <code>Bearer </code> prefix,
            use header name <code>api-key</code> and put the bare key as the
            value.
          </p>
        </section>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/account?api_key=${encodeURIComponent(result.api_key)}`}
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90"
          >
            Go to my account →
          </Link>
          <Link
            href="/start"
            className="px-4 py-2 text-sm border border-line rounded hover:bg-line/40"
          >
            Setup details
          </Link>
        </div>

        <div className="mt-12 p-4 border border-line rounded bg-line/10 text-xs text-muted">
          <strong>Tip:</strong> stash the API key in a password manager. If
          you lose it you can regenerate it from your account page — that
          invalidates the old key.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-14">
      <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
        ← Drawtree
      </Link>
      <h1 className="text-3xl tracking-tight mt-3">Sign up</h1>
      <p className="text-muted text-sm mt-2 leading-relaxed">
        Get your API key in under a minute. First-time email signups start
        with <strong>30 free credits</strong> — enough to try out the
        framework design flow.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full px-3 py-2 border border-line rounded text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted">
            Display name (optional)
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="leave blank to use your email prefix"
            className="mt-1 w-full px-3 py-2 border border-line rounded text-sm"
          />
        </label>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !email}
          className="w-full px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create my account"}
        </button>
      </form>

      <p className="text-xs text-muted mt-6 leading-relaxed">
        By signing up you agree that drawtree is structured research methodology
        software — not regulated investment advice. Your API key is yours alone;
        do not share it. We do not require email verification; the same email
        can only collect the free-credit bonus once.
      </p>
    </main>
  );
}
