"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/useAuth";
import LangSwitcher from "./LangSwitcher";

// Routes that are their own self-contained flow — an OAuth consent screen
// with a nav bar inviting you elsewhere mid-authorization is a trap.
const BARE_ROUTES = ["/oauth/consent"];

/**
 * The one persistent header. Two jobs:
 *
 *  1. Make the position sizer reachable from anywhere, by a name that says
 *     what it does.
 *  2. Give "sign in" a fixed, obvious home. It used to live only inside
 *     /account, behind a link labelled "My account" — which reads as
 *     "somewhere I go once I'm already in", so returning users never found
 *     it. Signed out: an explicit Sign in. Signed in: your handle.
 */
export default function SiteNav() {
  const { m } = useI18n();
  const pathname = usePathname();
  const { state, handle } = useAuth();

  if (BARE_ROUTES.some((r) => pathname?.startsWith(r))) return null;

  // `minor` links fold away on narrow screens — on a phone the bar has room
  // for the sizer and the auth entry, and nothing else without truncating.
  const links: { href: string; label: string; minor?: boolean }[] = [
    { href: "/portfolio", label: m.portfolio.navLabel },
    { href: "/start", label: m.nav.setup, minor: true },
    { href: "/spec", label: m.nav.protocol, minor: true },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-sm">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 sm:gap-5">
        <Link
          href="/"
          className="text-sm tracking-tight shrink-0 hover:opacity-70 transition"
        >
          {m.common.brand}
        </Link>

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`text-xs whitespace-nowrap underline-offset-4 transition ${
                  l.minor ? "hidden sm:inline" : ""
                } ${active ? "text-ink underline" : "text-muted hover:text-ink"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <LangSwitcher />
          {state === "in" ? (
            <Link
              href="/account"
              className="px-2.5 py-1.5 text-xs border border-line rounded hover:bg-line/40 max-w-[9rem] truncate"
            >
              {handle ? `@${handle}` : m.common.myAccount}
            </Link>
          ) : state === "out" ? (
            <>
              <Link
                href="/account"
                className="px-2.5 py-1.5 text-xs border border-line rounded hover:bg-line/40 whitespace-nowrap"
              >
                {m.nav.signIn}
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-block px-2.5 py-1.5 text-xs bg-ink text-paper rounded hover:opacity-90 whitespace-nowrap"
              >
                {m.nav.signUp}
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
