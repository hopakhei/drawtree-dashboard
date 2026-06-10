"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";

const API_URL = "https://drawtree-api.onrender.com";

export default function Signup() {
  const { m } = useI18n();
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
          setError(body?.detail?.message || m.signup.emailExists);
        } else {
          setError(body?.detail?.message || body?.detail?.code || body?.detail || m.signup.signupFailed);
        }
      } else {
        setResult(body);
        // SECURITY: do NOT write the api_key to localStorage. The
        // key is the user's long-lived MCP secret — storing it in
        // shared browser storage leaks it to anyone else who later
        // signs in on the same device. The signup success page
        // already displays it once with a 'save it to your password
        // manager' callout; that's the only persistence we offer.
      }
    } catch (e: any) {
      setError(e?.message || m.signup.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-14">
        <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
          {m.common.backToHome}
        </Link>
        <h1 className="text-3xl tracking-tight mt-3">{m.signup.welcome}</h1>
        <p className="text-muted text-sm mt-2">{m.signup.accountReady}</p>

        <section className="mt-8 border border-line rounded p-6">
          <div className="text-xs uppercase tracking-wider text-muted mb-1">
            {m.signup.apiKey}
          </div>
          <code className="text-sm font-mono break-all">{result.api_key}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.api_key);
            }}
            className="mt-3 px-3 py-1.5 text-xs border border-line rounded hover:bg-line/40"
          >
            {m.signup.copyApiKey}
          </button>
        </section>

        <section className="mt-6 border border-line rounded p-6 text-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-muted">{m.signup.handle}</span>
            <code>{result.handle}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{m.signup.startingBalance}</span>
            <span>{m.signup.credits(result.balance_credits)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{m.signup.mcpServerUrl}</span>
            <code className="text-xs">{result.mcp_url}</code>
          </div>
        </section>

        <section className="mt-6 border border-line rounded p-6">
          <h2 className="text-lg">{m.signup.connectPerplexity}</h2>
          <ol className="text-sm text-muted list-decimal list-inside space-y-1 mt-3">
            {m.signup.perplexitySteps.map((step, i) => (
              <li key={i}>
                {i === 1 ? (
                  <>
                    MCP URL: <code>{result.mcp_url}</code>
                  </>
                ) : i === 4 ? (
                  <>
                    <code>Bearer {result.api_key.slice(0, 12)}…</code>
                  </>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted mt-3">{m.signup.bearerFallback}</p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/start"
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90"
          >
            {m.signup.continueToSetup}
          </Link>
          <Link
            href={`/account?api_key=${encodeURIComponent(result.api_key)}`}
            className="px-4 py-2 text-sm border border-line rounded hover:bg-line/40"
          >
            {m.signup.openMyAccount}
          </Link>
        </div>

        <div className="mt-12 p-4 border border-line rounded bg-line/10 text-xs text-muted">
          {m.signup.tip}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-14">
      <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
        {m.common.backToHome}
      </Link>
      <h1 className="text-3xl tracking-tight mt-3">{m.signup.title}</h1>
      <p className="text-muted text-sm mt-2 leading-relaxed">{m.signup.intro}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted">
            {m.signup.emailLabel}
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={m.signup.emailPlaceholder}
            className="mt-1 w-full px-3 py-2 border border-line rounded text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted">
            {m.signup.displayNameLabel}
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={m.signup.displayNamePlaceholder}
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
          {submitting ? m.signup.creating : m.signup.createAccount}
        </button>
      </form>

      <p className="text-xs text-muted mt-6 leading-relaxed">{m.signup.legal}</p>
    </main>
  );
}
