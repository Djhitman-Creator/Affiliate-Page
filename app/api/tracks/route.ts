// app/api/tracks/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ensureSqliteTables } from "@/lib/ensureSchema";

type TrackResult = {
  source: "Party Tyme" | "Karaoke Version" | "YouTube";
  artist: string;
  title: string;
  brand?: string | null;
  url?: string;
  imageUrl?: string | null;
  thumbnail?: string | null;
};

type Errors = Record<string, any>;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ items: [], total: 0 });

  // No-op on Postgres; harmless to keep
  await ensureSqliteTables();

  const results: TrackResult[] = [];
  const errors: Errors = {};
  const debug: Record<string, any> = {};

  // -------------------------
  // Party Tyme (Prisma on any provider)
  // -------------------------
  try {
    const pt = await prisma.track.findMany({
      where: {
        OR: [
          { artist: { contains: q } },
          { title:  { contains: q } },
        ],
      },
      take: 50,
    });

    results.push(
      ...pt.map((r: any) => ({
        source: "Party Tyme" as const,
        artist: r.artist || "",
        title: r.title || "",
        brand: r.brand || "Party Tyme",
        url: r.url || undefined,
        imageUrl: (r as any).imageUrl ?? null,
      })),
    );
  } catch (e: any) {
    errors.partytyme = e?.message || String(e);
  }

  // -------------------------
  // Karaoke Version (KV) — feature-flag guarded
  // -------------------------
  try {
    const kvDisabled = String(process.env.KV_DISABLED || "").toLowerCase() === "true";
    if (kvDisabled) {
      errors.kv = "disabled by KV_DISABLED env"; // keep string
    } else {
      const kvEndpoint = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "");
      const aff = (process.env.KV_AFFILIATE_ID || "").trim();

      const qs = new URLSearchParams({
        query: JSON.stringify({ q }),
        ...(aff ? { aff } : {}),
      });

      const kvUrl = `${kvEndpoint}?${qs.toString()}`;
      const headers: Record<string, string> = {
        "User-Agent": "AffiliateKVProxy/1.0",
        Referer: baseUrl,
        Origin: baseUrl,
        ...(aff ? { "X-Affiliate-Id": aff } : {}),
        Accept: "application/json",
      };

      const hit = async () => {
        const r = await fetch(kvUrl, { cache: "no-store", headers });
        const raw = await r.text();
        let data: any = raw;
        try { data = JSON.parse(raw); } catch {}
        return { r, data };
      };

      let { r, data } = await hit();
      if ((!r.ok || !Array.isArray((data as any)?.items)) && (r.status === 429 || r.status >= 500)) {
        await new Promise(res => setTimeout(res, 600));
        ({ r, data } = await hit());
      }

      if (r.ok && Array.isArray((data as any)?.items)) {
        results.push(
          ...(data as any).items.map((it: any) => ({
            source: "Karaoke Version" as const,
            artist: it.artist || "",
            title: it.title || "",
            brand: "Karaoke Version",
            url: it.url,
            imageUrl: it.imageUrl ?? null,
          })),
        );
      } else {
        errors.kv = `${r.status} ${kvUrl}`; // keep error as string
        debug.kv = {
          status: r.status,
          kvUrl,
          body: typeof data === "string" ? String(data).slice(0, 300) : data,
        };
      }
    }
  } catch (e: any) {
    errors.kv = e?.message || String(e);
    debug.kv = { error: e?.message || String(e) };
  }

  // -------------------------
  // YouTube (App route proxy)
  // -------------------------
  try {
    const ytRes = await fetch(`${baseUrl}/api/youtube?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const ytData = await ytRes.json();
    if (Array.isArray(ytData?.items)) {
      results.push(
        ...ytData.items.map((it: any) => ({
          source: "YouTube" as const,
          artist: it.artist || "",
          title: it.title || "",
          brand: it.brand || "YouTube",
          url: it.url,
          thumbnail: it.thumbnail ?? null,
        })),
      );
    } else {
      errors.youtube = "YouTube returned no array";
      debug.youtube = { status: ytRes.status, body: ytData };
    }
  } catch (e: any) {
    errors.youtube = e?.message || String(e);
  }

  return NextResponse.json({ items: results, total: results.length, errors, debug });
}
