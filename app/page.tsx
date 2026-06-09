import Link from "next/link";

export const revalidate = 60;

export default async function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <header className="mb-12">
        <h1 className="text-4xl tracking-tight">Drawtree</h1>
        <p className="text-muted mt-3 max-w-xl text-sm leading-relaxed">
          Every investment thesis as a tree. Every claim has a kill condition. Every verdict
          is signed, timestamped, and disputable. The wire protocol for AI-native equity research.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90"
          >
            Sign up free
          </Link>
          <Link
            href="/start"
            className="px-4 py-2 text-sm bg-ink/10 border border-ink rounded hover:bg-ink/20"
          >
            Setup guide →
          </Link>
          <Link
            href="/account"
            className="px-4 py-2 text-sm border border-line rounded hover:bg-line/40"
          >
            My account
          </Link>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted">
          <Link href="/spec" className="underline-offset-4 hover:underline">
            Protocol v0.3
          </Link>
          <a href="/api/health" className="underline-offset-4 hover:underline">
            Health
          </a>
        </div>
      </header>

      <section className="mt-12 border border-line rounded p-8">
        <h2 className="text-xl tracking-tight mb-3">What you get</h2>
        <ul className="text-sm text-muted space-y-2 leading-relaxed list-disc list-inside">
          <li>An MCP server that co-designs falsifiable hypothesis trees with your favourite AI client (Perplexity, Claude Desktop, any Remote-MCP host).</li>
          <li>164 strategy frameworks indexed with canonical full-text — the AI grounds its leaf design in real source material, not generic questions.</li>
          <li>Live peer-price data fetch, three-scenario peer valuation, weekly cron monitoring with verdict alerts.</li>
          <li>50 free credits on signup — enough to publish your first tree end-to-end. No credit-card prompt. Trees you commit stay private to you.</li>
        </ul>
        <div className="mt-6 text-xs text-muted">
          All committed trees are private by default. There is no public directory of users or trees.
        </div>
      </section>

      <footer className="mt-20 text-xs text-muted border-t border-line pt-6">
        <p>
          drawtree.capital · structured equity research methodology ·
          published trees are content-addressed and append-only ·{" "}
          <Link href="/spec" className="underline">
            see protocol
          </Link>
        </p>
      </footer>
    </main>
  );
}
