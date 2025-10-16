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

  // --- Karaoke Version (KV) with JSON-encoded `query`
try {
  const base = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const aff  = (process.env.KV_AFFILIATE_ID || "").trim();
  const payloads = [{ q }, { query: q }, { keyword: q }, { text: q }];

  let added = 0;
  let lastError: any = null;

  for (const payload of payloads) {
    const qs   = `query=${encodeURIComponent(JSON.stringify(payload))}${aff ? `&aff=${aff}` : ""}`;
    const kvUrl = `${base}?${qs}`;

    try {
      const kvRes = await fetch(kvUrl, { cache: "no-store" });
      const raw   = await kvRes.text();
      let data: any = raw; try { data = JSON.parse(raw); } catch {}

      if (kvRes.ok && Array.isArray(data?.items)) {
        results.push(...data.items.map((it: any) => ({
          source: "Karaoke Version",
          artist: it.artist,
          title:  it.title,
          url:    it.url,
          imageUrl: it.imageUrl,
        })));
        added = added + (data.items?.length || 0);
        break; // success
      } else {
        lastError = { status: kvRes.status, kvUrl, body: typeof data === "string" ? data.slice(0, 200) : data };
      }
    } catch (e: any) {
      lastError = { kvUrl, error: e?.message || String(e) };
    }
  }

  if (!added && lastError) {
    errors.kv = lastError;
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
