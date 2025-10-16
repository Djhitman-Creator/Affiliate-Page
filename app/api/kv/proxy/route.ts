export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ ok: false, error: "Missing q" }, { status: 400 });

  const kvEndpoint = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff = process.env.KV_AFFILIATE_ID || "";
  const kvUrl = `${kvEndpoint}?q=${encodeURIComponent(q)}&aff=${aff}`;

  try {
    const r = await fetch(kvUrl, { cache: "no-store" });
    const txt = await r.text(); // return raw body so we can see errors
    return NextResponse.json({ ok: r.ok, status: r.status, kvUrl, body: tryParseJson(txt) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, kvUrl, error: e?.message || String(e) }, { status: 500 });
  }
}

function tryParseJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}
