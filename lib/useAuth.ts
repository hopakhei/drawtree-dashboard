"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://api.drawtree.capital";

export type AuthState = "checking" | "in" | "out";

export type Auth = {
  state: AuthState;
  loggedIn: boolean;
  handle: string | null;
  accountId: string | null;
};

/**
 * Shared read-only view of "is this browser signed in?".
 *
 * The token is written to sessionStorage by /account (magic link or 6-digit
 * code). Signed in = GET /v1/account/me returns 200 — deliberately NOT
 * "returns a handle", because some accounts have none and gating on the
 * field once caused a redirect loop between /portfolio and /account.
 *
 * This is display state only. It decides which nav entry to show and which
 * optional nudges appear; it must never be the thing that stands between a
 * visitor and a tool they can use anonymously.
 */
export function useAuth(): Auth {
  const [state, setState] = useState<AuthState>("checking");
  const [handle, setHandle] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let key: string | null = null;
    try {
      key = sessionStorage.getItem("drawtree_api_key");
    } catch {}
    if (!key) {
      setState("out");
      return;
    }
    fetch(`${API_BASE}/v1/account/me`, {
      headers: { Authorization: `Bearer ${key}` },
    })
      .then((r) => (r.ok ? r.json().catch(() => ({})) : null))
      .then((me) => {
        if (cancelled) return;
        if (me) {
          setAccountId(String(me.agent_id || me.handle || me.email || "account"));
          setHandle(me.handle || me.display_name || me.email || null);
          setState("in");
        } else {
          setState("out");
        }
      })
      .catch(() => {
        if (!cancelled) setState("out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { state, loggedIn: state === "in", handle, accountId };
}
