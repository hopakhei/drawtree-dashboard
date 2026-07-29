import Link from "next/link";
import { getServerMessages } from "@/lib/i18n/server";

export const revalidate = 60;

// The landing page presents two doors, deliberately the same size.
//
// Left: the position sizer — usable by a stranger, right now, with no
// account. It is the page's job to make that obvious, because the value
// has to land before anyone will consider signing up.
//
// Right: the MCP protocol — what an account is actually for.
export default async function Home() {
  const { m } = getServerMessages();
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
      <header className="max-w-2xl">
        <h1 className="text-4xl sm:text-5xl tracking-tight">{m.common.brand}</h1>
        <p className="text-muted mt-4 text-sm leading-relaxed">{m.home.tagline}</p>
        <div className="mt-4 flex gap-4 text-xs text-muted">
          <Link href="/spec" className="underline-offset-4 hover:underline">
            {m.home.protocol}
          </Link>
          <a href="/api/health" className="underline-offset-4 hover:underline">
            {m.home.health}
          </a>
        </div>
      </header>

      <div className="mt-14 grid gap-5 md:grid-cols-2 items-stretch">
        {/* Door 1 — no account required */}
        <section className="flex flex-col border border-ink/25 rounded p-7 bg-raised">
          <span className="self-start px-2 py-1 text-[10px] uppercase tracking-wider rounded bg-ink text-paper">
            {m.home.toolBadge}
          </span>
          <h2 className="mt-4 text-2xl tracking-tight font-serif">
            {m.portfolio.navLabel}
          </h2>
          <p className="mt-1 text-base font-serif text-clay">{m.home.toolLede}</p>
          <p className="mt-3 text-sm text-muted leading-relaxed font-serif">
            {m.home.toolBody}
          </p>
          <div className="mt-auto pt-6">
            <Link
              href="/portfolio"
              className="inline-block px-4 py-2.5 text-sm bg-ink text-paper rounded hover:opacity-90"
            >
              {m.home.toolCta}
            </Link>
          </div>
        </section>

        {/* Door 2 — the protocol */}
        <section className="flex flex-col border border-line rounded p-7">
          <span className="self-start px-2 py-1 text-[10px] uppercase tracking-wider rounded border border-line text-muted">
            {m.home.protocolBadge}
          </span>
          <h2 className="mt-4 text-2xl tracking-tight font-serif">
            {m.home.protocolTitle}
          </h2>
          <p className="mt-1 text-base font-serif text-clay">
            {m.home.protocolLede}
          </p>
          <p className="mt-3 text-sm text-muted leading-relaxed font-serif">
            {m.home.protocolBody}
          </p>
          <div className="mt-auto pt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-block px-4 py-2.5 text-sm border border-ink rounded hover:bg-ink/10"
            >
              {m.home.protocolCta}
            </Link>
            <Link
              href="/start"
              className="text-sm text-muted underline-offset-4 hover:underline hover:text-ink"
            >
              {m.home.protocolCtaSecondary}
            </Link>
          </div>
        </section>
      </div>

      <p className="mt-6 text-xs text-muted">
        {m.home.haveAccount}{" "}
        <Link href="/account" className="underline underline-offset-4 hover:text-ink">
          {m.home.signIn}
        </Link>
      </p>

      <section className="mt-14 border border-line rounded p-8">
        <h2 className="text-xl tracking-tight mb-3">{m.home.whatYouGet}</h2>
        <ul className="text-sm text-muted space-y-2 leading-relaxed list-disc list-inside">
          {m.home.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <div className="mt-6 text-xs text-muted">{m.home.privacyNote}</div>
      </section>

      <footer className="mt-20 text-xs text-muted border-t border-line pt-6">
        <p>
          {m.home.footer}
          <Link href="/spec" className="underline">
            {m.home.seeProtocol}
          </Link>
        </p>
      </footer>
    </main>
  );
}
