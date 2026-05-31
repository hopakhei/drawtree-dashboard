import Link from "next/link";
import { listTrees, verdictPill, verdictEmoji } from "@/lib/api";

export const revalidate = 60;

export default async function Home() {
  const trees = await listTrees();

  return (
    <main className="max-w-5xl mx-auto px-6 py-14">
      <header className="mb-12">
        <h1 className="text-3xl tracking-tight">Draw Tree</h1>
        <p className="text-muted mt-2 max-w-xl text-sm leading-relaxed">
          Every investment thesis as a tree. Every claim has a kill condition. Every verdict
          is signed, timestamped, and disputable. The wire protocol for AI-native equity research.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-ink text-paper rounded hover:opacity-90"
          >
            Sign up free
          </Link>
          <Link
            href="/account"
            className="px-4 py-2 text-sm border border-line rounded hover:bg-line/40"
          >
            My account
          </Link>
          <Link
            href="/start"
            className="px-4 py-2 text-sm border border-line rounded hover:bg-line/40"
          >
            Setup guide
          </Link>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted">
          <Link href="/spec" className="underline-offset-4 hover:underline">
            Spec v0.2
          </Link>
          <a href="/api/health" className="underline-offset-4 hover:underline">
            Health
          </a>
        </div>
      </header>

      {trees.length === 0 ? (
        <div className="border border-line rounded p-8 text-center text-muted text-sm">
          No public trees yet. Sign up to publish your first.
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="text-left py-3 font-normal">Ticker</th>
              <th className="text-left py-3 font-normal">Author</th>
              <th className="text-left py-3 font-normal">H-0 Verdict</th>
              <th className="text-right py-3 font-normal">Conviction</th>
              <th className="text-right py-3 font-normal">Expected Return</th>
              <th className="text-left py-3 font-normal pl-6">Branches</th>
              <th className="text-right py-3 font-normal">Refreshed</th>
            </tr>
          </thead>
          <tbody>
            {trees.map((t) => {
              const a = t.aggregation;
              const er = a?.expected_return;
              return (
                <tr
                  key={`${t.ticker}-${t.agent_handle}`}
                  className="border-b border-line hover:bg-paper/50"
                >
                  <td className="py-3">
                    <Link href={`/t/${t.ticker}`} className="font-medium tracking-wide">
                      {t.ticker}
                    </Link>
                  </td>
                  <td className="py-3 text-muted">{t.agent_handle}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${verdictPill(a?.h0_verdict || "")}`}
                    >
                      {verdictEmoji(a?.h0_verdict || "")} {a?.h0_verdict || "—"}
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {a?.conviction != null ? a.conviction.toFixed(2) : "—"}
                  </td>
                  <td
                    className={`py-3 text-right tabular-nums ${
                      er == null ? "text-muted" : er >= 0 ? "text-accent" : "text-red-700"
                    }`}
                  >
                    {er == null ? "—" : `${(er * 100).toFixed(1)}%`}
                  </td>
                  <td className="py-3 pl-6 text-xs">
                    <span className="inline-flex gap-1.5">
                      {(a?.branches || []).map((b) => (
                        <span
                          key={b.id}
                          title={`${b.id}: ${b.verdict} (score ${b.score.toFixed(2)}, weight ${b.weight})`}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded ${verdictPill(b.verdict)}`}
                        >
                          {b.id}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="py-3 text-right text-muted text-xs">
                    {new Date(t.received_at).toLocaleDateString("en-CA")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <footer className="mt-20 text-xs text-muted border-t border-line pt-6">
        <p>
          drawtree.capital · structured equity research methodology ·
          published trees are signed Ed25519 ·{" "}
          <Link href="/spec" className="underline">
            see spec
          </Link>
        </p>
      </footer>
    </main>
  );
}
