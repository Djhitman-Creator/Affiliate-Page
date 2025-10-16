// app/api/tracks/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`; // absolute base for SSR fetches
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ items: [], total: 0 });

  const results: any[] = [];
  const errors: Record<string, string> = {};

  // Party Tyme via Prisma (SQLite-safe: no mode:"insensitive")
  try {
    if ((process.env.DATABASE_URL || "").startsWith("file:")) {
      const pt = await prisma.track.findMany({
        where: {
          OR: [
            { artist: { contains: q } },
            { title:  { contains: q } },
          ],
        },
        take: 50,
      });
      results.push(...pt.map((r: any) => ({ ...r, source: "Party Tyme" })));
    } else {
      errors.partytyme = "Invalid DATABASE_URL (must start with file:)";
    }
  } catch (e: any) {
    console.error("Party Tyme DB error:", e?.message || e);
    errors.partytyme = e?.message || String(e);
  }

  // --- Karaoke Version (KV) robust call
try {
  const base = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff  = (process.env.KV_AFFILIATE_ID || "").trim();

  const payloads = [{ q }, { query: q }, { keyword: q }, { text: q }];
  const affParams = [
    (v: string) => `aff=${encodeURIComponent(v)}`,
    (v: string) => `affiliate=${encodeURIComponent(v)}`,
    (v: string) => `affiliate_id=${encodeURIComponent(v)}`,
    (v: string) => `partner=${encodeURIComponent(v)}`,
    (v: string) => `aid=${encodeURIComponent(v)}`,
  ];

  const protoHost = `${new URL(req.url).protocol}//${new URL(req.url).host}`;
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

  let added = 0;
  let lastDiag: any = null;

  for (const payload of payloads) {
    const qp = `query=${encodeURIComponent(JSON.stringify(payload))}`;
    const apList = aff ? affParams.map(fn => fn(aff)) : [""];
    for (const ap of apList) {
      const qs = ap ? `${qp}&${ap}` : qp;
      const kvUrl = `${base}?${qs}`;

      for (const hv of headerVariants) {
        try {
          const r = await fetch(kvUrl, { cache: "no-store", headers: { "User-Agent": "AffiliateKVProxy/1.0", ...hv.headers } });
          const raw = await r.text();
          let data: any = raw; try { data = JSON.parse(raw); } catch {}

          if (r.ok && Array.isArray(data?.items)) {
            results.push(...data.items.map((it: any) => ({
              source: "Karaoke Version",
              artist: it.artist,
              title:  it.title,
              url:    it.url,
              imageUrl: it.imageUrl,
            })));
            added += (data.items?.length || 0);
            break;
          } else {
            lastDiag = { status: r.status, kvUrl, variant: hv.name, body: typeof data === "string" ? data.slice(0, 200) : data };
          }
        } catch (e: any) {
          lastDiag = { kvUrl, variant: hv.name, error: e?.message || String(e) };
        }
      }
      if (added) break;
    }
    if (added) break;
  }

  if (!added && lastDiag) {
    errors.kv = lastDiag;
  }
} catch (e: any) {
  errors.kv = e?.message || String(e);
}



  // YouTube (absolute URL; don’t rely on NEXT_PUBLIC_APP_URL on the server)
  try {
    const ytRes = await fetch(`${base}/api/youtube?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const ytData = await ytRes.json();
    if (Array.isArray(ytData?.items)) {
      results.push(...ytData.items.map((it: any) => ({
        source: "YouTube",
        artist: it.artist || "",
        title: it.title,
        url: it.url,
        thumbnail: it.thumbnail,
      })));
    } else {
      errors.youtube = "YouTube returned no array";
    }
  } catch (e: any) {
    console.error("YouTube error:", e?.message || e);
    errors.youtube = e?.message || String(e);
  }

  return NextResponse.json({ items: results, total: results.length, errors });
}
