export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ ok: false, status: 400, body: { error: "Missing q" } }, { status: 400 });

  const base = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff  = (process.env.KV_AFFILIATE_ID || "").trim();
  const protoHost = getBase(req);
  const tried: Array<{ kvUrl: string; status: number; ok: boolean; body: any; variant: string }> = [];

  // KV says "query" must be a JSON object. We'll try a few shapes.
  const payloads = [
    { q },
    { query: q },
    { keyword: q },
    { text: q },
    { artist: q },
  ];

  // Try common affiliate param names
  const affParams = [
    (v: string) => `aff=${encodeURIComponent(v)}`,
    (v: string) => `affiliate=${encodeURIComponent(v)}`,
    (v: string) => `affiliate_id=${encodeURIComponent(v)}`,
    (v: string) => `partner=${encodeURIComponent(v)}`,
    (v: string) => `aid=${encodeURIComponent(v)}`,
  ];

  // We also try header-based identification if KV supports it
  const headerVariants = [
    { name: "none", headers: {} as Record<string, string> },
    { name: "with-referer", headers: { Referer: protoHost } },
    { name: "with-origin", headers: { Origin: protoHost } },
    { name: "with-both", headers: { Referer: protoHost, Origin: protoHost } },
    { name: "with-x-affiliate", headers: aff ? { "X-Affiliate-Id": aff } : {} },
    { name: "with-all", headers: ((): Record<string,string> => {
        const h: Record<string,string> = { Referer: protoHost, Origin: protoHost };
        if (aff) h["X-Affiliate-Id"] = aff;
        return h;
      })()
    },
  ];

  for (const payload of payloads) {
    const queryParam = `query=${encodeURIComponent(JSON.stringify(payload))}`;
    const affPieces = aff ? affParams.map(fn => fn(aff)) : [""]; // if no aff, try without
    for (const ap of affPieces) {
      const qs = ap ? `${queryParam}&${ap}` : queryParam;
      const kvUrl = `${base}?${qs}`;

      for (const hv of headerVariants) {
        try {
          const r   = await fetch(kvUrl, {
            cache: "no-store",
            headers: {
              "User-Agent": "AffiliateKVProxy/1.0",
              ...hv.headers,
            }
          });
          const txt = await r.text();
          const body = tryParseJson(txt);

          if (r.ok && Array.isArray((body as any)?.items)) {
            return NextResponse.json({ ok: true, status: r.status, kvUrl, variant: hv.name, body });
          }
          tried.push({ kvUrl, status: r.status, ok: r.ok, body, variant: hv.name });
        } catch (e: any) {
          tried.push({ kvUrl, status: 0, ok: false, body: e?.message || String(e), variant: hv.name });
        }
      }
    }
  }

  // If we still fail with 403 "Affiliate not identified", it likely means your KV
  // affiliate must be tied to an approved domain. Ask KV to whitelist your production domain.
  return NextResponse.json({
    ok: false,
    status: 502,
    hint: "If all variants show 403 Affiliate not identified, your KV affiliate likely requires a whitelisted domain (Referer/Origin). Ask KV to whitelist your production hostname.",
    hostWeSent: protoHost,
    tried
  }, { status: 502 });
}

function tryParseJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}

function getBase(req: Request) {
  // Build https://host.example from the incoming request
  const url = new URL(req.url);
  const proto = (url.protocol || "https:").replace(":", "");
  const host = url.host;
  return `${proto}://${host}`;
}

