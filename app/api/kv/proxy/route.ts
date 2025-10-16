export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ ok: false, status: 400, body: { error: "Missing q" } }, { status: 400 });

  const base = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff  = (process.env.KV_AFFILIATE_ID || "").trim();

  // Canonical guess KV accepts: query is a JSON object, and we pass the affiliate id.
  // We also include Referer/Origin = your production host.
  const protoHost = getBase(req);
  const qs = new URLSearchParams({
    query: JSON.stringify({ q }),               // <-- single shape
    ...(aff ? { aff } : {})
  });

  const kvUrl = `${base}?${qs.toString()}`;

  // one shot + one gentle retry if 429/5xx
  const headers = {
    "User-Agent": "AffiliateKVProxy/1.0",
    Referer: protoHost,
    Origin: protoHost,
    ...(aff ? { "X-Affiliate-Id": aff } : {})
  };

  const first = await fetch(kvUrl, { cache: "no-store", headers });
  let txt = await first.text();
  let body: any = tryParseJson(txt);

  if (first.ok && Array.isArray(body?.items)) {
    return NextResponse.json({ ok: true, status: first.status, kvUrl, body });
  }

  if (first.status === 429 || first.status >= 500) {
    await sleep(600); // 0.6s backoff
    const second = await fetch(kvUrl, { cache: "no-store", headers });
    txt = await second.text();
    body = tryParseJson(txt);
    if (second.ok && Array.isArray(body?.items)) {
      return NextResponse.json({ ok: true, status: second.status, kvUrl, retried: true, body });
    }
    return NextResponse.json({ ok: false, status: second.status, kvUrl, body, retried: true }, { status: 502 });
  }

  return NextResponse.json({ ok: false, status: first.status, kvUrl, body }, { status: first.status || 502 });
}

function tryParseJson(s: string) { try { return JSON.parse(s); } catch { return s; } }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function getBase(req: Request) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}
