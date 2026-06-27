import Link from "next/link";
import { getServerMessages } from "@/lib/i18n/server";

export const revalidate = 60;

export default async function Home() {
  const { m } = getServerMessages();
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <header className="mb-12">
        <h1 className="text-4xl tracking-tight">{m.common.brand}</h1>
        <p className="text-muted mt-3 max-w-xl text-sm leading-relaxed">
          {m.home.tagline}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90"
          >
            {m.home.signUpFree}
          </Link>
          <Link
            href="/start"
            className="px-4 py-2 text-sm bg-ink/10 border border-ink rounded hover:bg-ink/20"
          >
            {m.home.setupGuide}
          </Link>
          <Link
            href="/account"
            className="px-4 py-2 text-sm border border-line rounded hover:bg-line/40"
          >
            {m.home.myAccount}
          </Link>
          <Link
            href="/portfolio"
            className="px-4 py-2 text-sm border border-line rounded hover:bg-line/40"
          >
            {m.portfolio.navLabel} →
          </Link>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted">
          <Link href="/spec" className="underline-offset-4 hover:underline">
            {m.home.protocol}
          </Link>
          <a href="/api/health" className="underline-offset-4 hover:underline">
            {m.home.health}
          </a>
        </div>
      </header>

      <section className="mt-12 border border-line rounded p-8">
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
