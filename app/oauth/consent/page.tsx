"use client";

// OAuth 2.1 consent screen — the user lands here from /oauth/authorize
// on drawtree-api, signed-in or not. We:
//   1. Read all OAuth params from the query string (client_id, scope,
//      code_challenge, resource, redirect_uri, state, …).
//   2. If the user isn't signed in, send them to /account?next=… with
//      the full consent URL preserved so they come back here after.
//   3. Otherwise render: "ChatGPT wants to access your Draw Tree
//      account with [scopes]" + Approve/Deny.
//   4. On Approve we POST /v1/oauth/approve (Bearer dts_…) which mints
//      a single-use authorization code; we then redirect back to the
//      MCP client's redirect_uri with ?code=…&state=….
//
// Critical: the dashboard session token (dts_) is the ONLY thing that
// crosses domain — the actual OAuth access tokens (dtoa_/dtor_/JWT)
// are minted server-side and travel via redirect back to the MCP
// client. The user's MCP API key (dt_) is never touched.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Next.js 14 requires useSearchParams() consumers to be wrapped in a
// Suspense boundary so static-prerender doesn't blow up. We split the
// component into an inner client component (uses the hook) plus a
// default export that wraps it in Suspense.
export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-md mx-auto px-6 py-14">
          <p className="text-sm text-muted">Loading authorization request…</p>
        </main>
      }
    >
      <ConsentInner />
    </Suspense>
  );
}

const API_URL = "https://drawtree-api.onrender.com";

const SCOPE_DESCRIPTIONS: Record<string, { label: string; tagline: string }> = {
  "drawtree:read": {
    label: "Read your trees",
    tagline:
      "Browse committed trees, view verdicts, conviction, and scenario prices.",
  },
  "drawtree:write": {
    label: "Create and edit drafts",
    tagline:
      "Open new research drafts, save framework + leaves, commit trees, and trigger Phase 2 research (costs credits).",
  },
  "drawtree:monitor": {
    label: "Change monitoring frequency",
    tagline:
      "Set weekly / daily / off cadence on a committed tree. Recurring credit cost.",
  },
};

function ConsentInner() {
  const qs = useSearchParams();
  const clientId       = qs.get("client_id")             || "";
  const clientName     = qs.get("client_name")           || "An MCP client";
  const logoUri        = qs.get("logo_uri")              || "";
  const redirectUri    = qs.get("redirect_uri")          || "";
  const requestedScope = qs.get("scope")                 || "";
  const state          = qs.get("state")                 || "";
  const codeChallenge  = qs.get("code_challenge")        || "";
  const codeChallengeMethod = qs.get("code_challenge_method") || "S256";
  const resource       = qs.get("resource")              || "";

  // All scopes the client asked for, intersected with the three we
  // actually support. The user can untoggle individual ones below.
  const requestedScopes = useMemo(
    () =>
      (requestedScope || "")
        .split(/\s+/)
        .map((s) => s.trim())
        .filter((s) => s && SCOPE_DESCRIPTIONS[s]),
    [requestedScope],
  );

  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [agentEmail, setAgentEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Inline sign-in state. We keep the user ON THIS PAGE (rather than
  // bouncing them to /account) so the consent query string survives
  // the magic-link round trip. The user types a 6-digit code from
  // the email and lands back on the approve step.
  const [signInEmail, setSignInEmail] = useState("");
  const [signInCode,  setSignInCode]  = useState("");
  const [signInStage, setSignInStage] = useState<"email" | "code">("email");
  const [signInBusy,  setSignInBusy]  = useState(false);
  const [signInErr,   setSignInErr]   = useState<string | null>(null);
  const [signInChecked, setSignInChecked] = useState(false);

  // Init: read session token (skip the bounce — we now render an
  // inline sign-in form below if there's no session).
  useEffect(() => {
    try {
      const k = sessionStorage.getItem("drawtree_api_key");
      if (k && k.startsWith("dts_")) {
        setApiKey(k);
      }
    } catch {}
    setSignInChecked(true);
    const defaults: Record<string, boolean> = {};
    for (const s of requestedScopes) defaults[s] = true;
    setGranted(defaults);
  }, [requestedScopes]);

  // Fetch the signed-in user's email so we can show "Signed in as …".
  useEffect(() => {
    if (!apiKey) return;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/v1/account/me`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (r.ok) {
          const d = await r.json();
          setAgentEmail(d.email || null);
        }
      } catch {}
    })();
  }, [apiKey]);

  function toggle(scope: string) {
    setGranted((g) => ({ ...g, [scope]: !g[scope] }));
  }

  async function approve() {
    if (!apiKey) return;
    const scopeGranted = Object.entries(granted)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(" ");
    if (!scopeGranted) {
      setErr("Pick at least one permission, or click Deny to cancel.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`${API_URL}/oauth/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          client_id:             clientId,
          redirect_uri:          redirectUri,
          code_challenge:        codeChallenge,
          code_challenge_method: codeChallengeMethod,
          resource:              resource,
          scope_granted:         scopeGranted,
          state:                 state,
        }),
      });
      const body = await r.json();
      if (!r.ok) {
        setErr(
          body?.detail?.error_description ||
            body?.detail?.error ||
            `Approval failed (${r.status}).`,
        );
        setBusy(false);
        return;
      }
      // Server returns the URL we should send the user back to.
      window.location.href = body.redirect_to;
    } catch (e: any) {
      setErr(e?.message || "Network error during approval.");
      setBusy(false);
    }
  }

  async function requestCode() {
    if (!signInEmail.includes("@")) {
      setSignInErr("Please enter a valid email.");
      return;
    }
    setSignInBusy(true);
    setSignInErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/request_login_link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail.trim().toLowerCase() }),
      });
      const body = await r.json();
      if (body?.unknown_email) {
        setSignInErr(
          "That email isn't registered. Sign up at drawtree.capital/signup first.",
        );
        setSignInBusy(false);
        return;
      }
      // Move to the code-entry stage even on transient send failures —
      // the user can hit 'resend' from there.
      setSignInStage("code");
    } catch (e: any) {
      setSignInErr(e?.message || "Network error sending code.");
    }
    setSignInBusy(false);
  }

  async function verifyCode() {
    const cleaned = signInCode.replace(/\D/g, "");
    if (cleaned.length !== 6) {
      setSignInErr("The code is 6 digits.");
      return;
    }
    setSignInBusy(true);
    setSignInErr(null);
    try {
      const r = await fetch(`${API_URL}/v1/account/verify_login_code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signInEmail.trim().toLowerCase(),
          code:  cleaned,
        }),
      });
      const body = await r.json();
      if (!r.ok) {
        const c = body?.detail?.code || "";
        const msg =
          c === "INVALID_CODE"        ? "That code doesn't match. Double-check the latest email." :
          c === "CODE_ALREADY_USED"   ? "That code was already used. Request a new one." :
          c === "CODE_EXPIRED"        ? "That code has expired. Request a new one." :
          c === "INVALID_CODE_FORMAT" ? "The code must be 6 digits." :
          `Sign-in failed (${r.status}).`;
        setSignInErr(msg);
        setSignInBusy(false);
        return;
      }
      // Persist the dts_ session and switch into the consent UI.
      const tok = body.session_token;
      try {
        sessionStorage.setItem("drawtree_api_key", tok);
      } catch {}
      setApiKey(tok);
      setAgentEmail(body.email);
      setSignInBusy(false);
    } catch (e: any) {
      setSignInErr(e?.message || "Network error verifying code.");
      setSignInBusy(false);
    }
  }

  function deny() {
    if (!redirectUri) return;
    const sep = redirectUri.includes("?") ? "&" : "?";
    const u = new URL(
      `${redirectUri}${sep}error=access_denied&error_description=${encodeURIComponent(
        "User denied the request.",
      )}${state ? `&state=${encodeURIComponent(state)}` : ""}`,
    );
    window.location.href = u.toString();
  }

  // Bad request — missing critical params.
  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <main className="max-w-md mx-auto px-6 py-14">
        <Link
          href="/account"
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          ← My account
        </Link>
        <div className="mt-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          This authorization request is missing required parameters. Try
          starting the connection from your AI client again.
        </div>
      </main>
    );
  }

  // Pre-init: still checking sessionStorage for an existing dts_ token.
  if (!signInChecked) {
    return (
      <main className="max-w-md mx-auto px-6 py-14">
        <p className="text-sm text-muted">Checking sign-in…</p>
      </main>
    );
  }

  // No session — render the inline email-code sign-in form. Critically,
  // we DO NOT leave this page: doing so would lose the OAuth query
  // string and break the consent flow.
  if (!apiKey) {
    return (
      <main className="max-w-md mx-auto px-6 py-12">
        <Link
          href="/account"
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          ← My account
        </Link>

        <div className="mt-6 border border-line rounded p-6">
          <div className="text-xs uppercase tracking-wider text-muted">
            Authorize connection
          </div>
          <div className="text-lg font-medium mt-1">
            Sign in to approve {clientName}
          </div>
          <p className="text-xs text-muted mt-2">
            We&apos;ll email you a 6-digit code. Type it here so you
            don&apos;t lose this approval page.
          </p>

          {signInStage === "email" ? (
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs text-muted">Email</span>
                <input
                  type="email"
                  inputMode="email"
                  autoFocus
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !signInBusy) requestCode();
                  }}
                  placeholder="you@example.com"
                  className="w-full mt-1 px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-ink"
                />
              </label>
              <button
                onClick={requestCode}
                disabled={signInBusy || !signInEmail}
                className="w-full px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
              >
                {signInBusy ? "Sending…" : "Email me a 6-digit code"}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="text-xs text-muted">
                Code sent to <strong className="text-ink">{signInEmail}</strong>.
                Check your inbox (and spam) for a 6-digit code.
              </div>
              <label className="block">
                <span className="text-xs text-muted">6-digit code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={11}
                  value={signInCode}
                  onChange={(e) => setSignInCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !signInBusy) verifyCode();
                  }}
                  placeholder="123 456"
                  className="w-full mt-1 px-3 py-2 text-lg font-mono tracking-widest text-center border border-line rounded focus:outline-none focus:border-ink"
                />
              </label>
              <button
                onClick={verifyCode}
                disabled={signInBusy || signInCode.replace(/\D/g, "").length !== 6}
                className="w-full px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
              >
                {signInBusy ? "Verifying…" : "Sign in & continue"}
              </button>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <button
                  onClick={() => {
                    setSignInStage("email");
                    setSignInCode("");
                    setSignInErr(null);
                  }}
                  className="underline-offset-4 hover:underline"
                  disabled={signInBusy}
                >
                  ← Change email
                </button>
                <button
                  onClick={() => {
                    setSignInCode("");
                    requestCode();
                  }}
                  className="underline-offset-4 hover:underline"
                  disabled={signInBusy}
                >
                  Resend code
                </button>
              </div>
            </div>
          )}

          {signInErr && (
            <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {signInErr}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <Link
        href="/account"
        className="text-xs text-muted underline-offset-4 hover:underline"
      >
        ← My account
      </Link>

      <div className="mt-6 border border-line rounded p-6">
        <div className="flex items-center gap-3 mb-4">
          {logoUri && (
            <img
              src={logoUri}
              alt=""
              className="w-10 h-10 rounded border border-line bg-white"
            />
          )}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">
              Authorize connection
            </div>
            <div className="text-lg font-medium">
              {clientName} wants to access your Draw Tree account
            </div>
          </div>
        </div>

        {agentEmail && (
          <div className="text-xs text-muted mb-4">
            Signed in as <strong className="text-ink">{agentEmail}</strong>.
            Not you?{" "}
            <Link
              href="/account?signout=1"
              className="underline-offset-4 hover:underline"
            >
              Sign out
            </Link>
            .
          </div>
        )}

        <div className="text-xs uppercase tracking-wider text-muted mt-4 mb-2">
          Requested permissions
        </div>
        <ul className="space-y-2">
          {requestedScopes.length === 0 && (
            <li className="text-sm text-muted">
              The client did not request any specific permissions. We&apos;ll
              grant <code>drawtree:read</code> by default.
            </li>
          )}
          {requestedScopes.map((s) => {
            const meta = SCOPE_DESCRIPTIONS[s];
            return (
              <li key={s}>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!granted[s]}
                    onChange={() => toggle(s)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      {meta.label}
                    </span>
                    <span className="block text-xs text-muted">
                      {meta.tagline}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="text-[11px] text-muted mt-5 border-t border-line pt-3">
          You can revoke this connection any time on{" "}
          <Link
            href="/account"
            className="underline-offset-4 hover:underline"
          >
            /account
          </Link>
          . Your existing MCP API key (<code>dt_</code>) is unaffected.
        </div>

        {err && (
          <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={approve}
            disabled={busy}
            className="flex-1 px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={deny}
            disabled={busy}
            className="flex-1 px-4 py-2 text-sm border border-line rounded hover:bg-line/30 disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
