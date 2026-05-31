export default function SpecPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl tracking-tight mb-6">Draw Tree Protocol — v0.2</h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          The full v0.2 specification lives in the{" "}
          <a
            href="https://drawtree.capital/spec"
            className="underline"
          >
            drawtree-api repo
          </a>
          . Quick reference:
        </p>
        <ul className="list-disc pl-5 text-muted space-y-1">
          <li>5 core entities: Tree, MarketConsensus, RootHypothesis, Branch, Hypothesis</li>
          <li>9 invariants enforced server-side at publish time</li>
          <li>6-state verdict vocabulary (Validated → Falsified)</li>
          <li>Aggregation: leaf → branch → H-0 → conviction → expected return</li>
          <li>Fibonacci-default branch weights, fully overridable</li>
          <li>Typed falsifications: observable / directional / mechanism</li>
          <li>Mandatory frozen market-consensus baseline</li>
          <li>Append-only narrative_history audit log</li>
        </ul>
        <h2 className="text-base mt-6 mb-2">The 5 verbs</h2>
        <pre className="bg-ink/5 rounded p-4 text-xs overflow-x-auto">
{`POST   /v1/trees                        publish a .drawtree.json
GET    /v1/trees/{ticker}                latest version
GET    /v1/trees/{ticker}/diff           semantic diff (verdict / kill / narrative)
POST   /v1/trees/{ticker}/disputes       counter-claim a leaf
SSE    /v1/stream                        live event subscription`}
        </pre>
      </div>
    </main>
  );
}
