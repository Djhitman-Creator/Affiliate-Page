export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ ok: false, status: 400, body: { error: "Missing q" } }, { status: 400 });

  const base = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff  = (process.env.KV_AFFILIATE_ID || "").trim();

  // Try a few possible JSON shapes that vendors commonly require
  const payloads = [
    { q },                    // { "q": "George Strait" }
    { query: q },             // { "query": "George Strait" }
    { keyword: q },           // { "keyword": "George Strait" }
    { text: q },              // { "text": "George Strait" }
    { artist: q },            // { "artist": "George Strait" }
  ];

  const tried: Array<{ kvUrl: string; status: number; ok: boolean; body: any }> = [];

  for (const payload of payloads) {
    const qs = `query=${encodeURIComponent(JSON.stringify(payload))}${aff ? `&aff=${aff}` : ""}`;
    const kvUrl = `${base}?${qs}`;
    try {
      const r   = await fetch(kvUrl, { cache: "no-store" });
      const txt = await r.text();
      const body = tryParseJson(txt);

      // If KV gives us items[], return immediately
      if (r.ok && Array.isArray((body as any)?.items)) {
        return NextResponse.json({ ok: true, status: r.status, kvUrl, body });
      }

      tried.push({ kvUrl, status: r.status, ok: r.ok, body });
    } catch (e: any) {
      tried.push({ kvUrl, status: 0, ok: false, body: e?.message || String(e) });
    }
  }

  return NextResponse.json({ ok: false, status: 502, tried });
}

function tryParseJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}

