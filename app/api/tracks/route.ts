// app/api/tracks/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ items: [], total: 0 });

  const results: any[] = [];
  const errors: Record<string, string> = {};

  // Party Tyme via Prisma (safe)
  try {
    if ((process.env.DATABASE_URL || "").startsWith("file:")) {
      const pt = await prisma.track.findMany({
        where: {
          OR: [
            { artist: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 50,
      });
      results.push(...pt.map(r => ({ ...r, source: "Party Tyme" })));
    } else {
      errors.partytyme = "Invalid DATABASE_URL (not file:)";
    }
  } catch (e: any) {
    console.error("Party Tyme DB error:", e?.message || e);
    errors.partytyme = e?.message || String(e);
  }

  // KV
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

  // YouTube
  try {
    const ytUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/youtube?q=${encodeURIComponent(q)}`;
    const ytRes = await fetch(ytUrl, { cache: "no-store" });
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
