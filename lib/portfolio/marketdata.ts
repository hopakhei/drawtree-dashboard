/* =============================================================================
   Market-data helpers for the portfolio calculator — symbol search + quotes.

   Free, no-key Yahoo Finance endpoints, called server-side (Vercel) to avoid
   CORS and centralize provider logic. These are unofficial and can rate-limit;
   callers degrade gracefully when a lookup fails.
   ============================================================================= */

const FETCH_TIMEOUT_MS = 9000;
const UA = "Mozilla/5.0 (compatible; DrawtreeBot/1.0)";

export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  exchange: string;
  previousClose: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
};

/** Symbol autocomplete. Returns equities + ETFs, most-relevant first. */
export async function yahooSearch(q: string): Promise<SearchResult[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    q,
  )}&quotesCount=10&newsCount=0&listsCount=0`;
  const j = await fetchJSON(url);
  const quotes: any[] = Array.isArray(j?.quotes) ? j.quotes : [];
  return quotes
    .filter((x) => x?.symbol && (x.quoteType === "EQUITY" || x.quoteType === "ETF"))
    .map((x) => ({
      symbol: String(x.symbol),
      name: String(x.longname || x.shortname || x.symbol),
      exchange: String(x.exchDisp || x.exchange || ""),
      type: String(x.quoteType || ""),
    }));
}

/** Live snapshot for one symbol from the chart endpoint's meta block
 *  (works without the crumb the v7 quote endpoint now requires). */
export async function yahooQuote(symbol: string): Promise<Quote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=1d&interval=1d`;
  const j = await fetchJSON(url);
  const meta = j?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  const price = meta.regularMarketPrice as number;
  const prev =
    num(meta.chartPreviousClose) ?? num(meta.previousClose) ?? null;
  const changePct = prev && prev > 0 ? ((price - prev) / prev) * 100 : null;

  return {
    symbol: String(meta.symbol || symbol),
    name: String(meta.longName || meta.shortName || meta.symbol || symbol),
    price,
    currency: String(meta.currency || ""),
    exchange: String(meta.fullExchangeName || meta.exchangeName || ""),
    previousClose: prev,
    changePct,
    dayHigh: num(meta.regularMarketDayHigh),
    dayLow: num(meta.regularMarketDayLow),
    fiftyTwoWeekHigh: num(meta.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(meta.fiftyTwoWeekLow),
  };
}

// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------
export async function fetchJSON(url: string): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

function num(x: any): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}
