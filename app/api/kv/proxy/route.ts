export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ ok: false, status: 400, body: { error: "Missing q" } }, { status: 400 });

  const kvEndpoint = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff = (process.env.KV_AFFILIATE_ID || "").trim();
  const kvUrl = `${kvEndpoint}?query=${encodeURIComponent(q)}${aff ? `&aff=${aff}` : ""}`;

  try {
    const r = await fetch(kvUrl, { cache: "no-store" });
    const txt = await r.text();
    return NextResponse.json({ ok: r.ok, status: r.status, kvUrl, body: tryParseJson(txt) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, status: 500, kvUrl, body: e?.message || String(e) }, { status: 500 });
  }
}

function tryParseJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}

