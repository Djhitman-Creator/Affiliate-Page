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
      results.push(...pt.map(r => ({ ...r, source: "Party Tyme" })));
    } else {
      errors.partytyme = "Invalid DATABASE_URL (must start with file:)";
    }
  } catch (e: any) {
    console.error("Party Tyme DB error:", e?.message || e);
    errors.partytyme = e?.message || String(e);
  }

  // Karaoke Version
  try {
    const kvUrl = `${process.env.KV_SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}&aff=${process.env.KV_AFFILIATE_ID}`;
    const kvRes = await fetch(kvUrl, { cache: "no-store" });
    const kvData = await kvRes.json();
    if (Array.isArray(kvData?.items)) {
      results.push(...kvData.items.map((it: any) => ({
        source: "Karaoke Version",
        artist: it.artist,
        title: it.title,
        url: it.url,
        imageUrl: it.imageUrl,
      })));
    } else {
      errors.kv = "KV returned no array";
    }
  } catch (e: any) {
    console.error("KV error:", e?.message || e);
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
