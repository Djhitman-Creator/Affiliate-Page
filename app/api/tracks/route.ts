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

// --- Karaoke Version (KV) single-variant request + gentle retry
try {
  const base = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff  = (process.env.KV_AFFILIATE_ID || "").trim();
  const protoHost = `${new URL(req.url).protocol}//${new URL(req.url).host}`;

  const qs = new URLSearchParams({
    query: JSON.stringify({ q }),
    ...(aff ? { aff } : {}),
  });
  const kvUrl = `${base}?${qs.toString()}`;
  const headers = {
    "User-Agent": "AffiliateKVProxy/1.0",
    Referer: protoHost,
    Origin: protoHost,
    ...(aff ? { "X-Affiliate-Id": aff } : {}),
  };

  const hit = async () => {
    const r = await fetch(kvUrl, { cache: "no-store", headers });
    const raw = await r.text();
    let data: any = raw; try { data = JSON.parse(raw); } catch {}
    return { r, data, raw };
  };

  let { r, data } = await hit();
  if ((!r.ok || !Array.isArray(data?.items)) && (r.status === 429 || r.status >= 500)) {
    await new Promise(res => setTimeout(res, 600));
    ({ r, data } = await hit());
  }

  if (r.ok && Array.isArray(data?.items)) {
    results.push(...data.items.map((it: any) => ({
      source: "Karaoke Version",
      artist: it.artist,
      title:  it.title,
      url:    it.url,
      imageUrl: it.imageUrl,
    })));
  } else {
    errors.kv = { status: r.status, kvUrl, body: typeof data === "string" ? data.slice(0, 200) : data };
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
