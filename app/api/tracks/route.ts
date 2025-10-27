// app/api/tracks/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ensureSqliteTables } from "@/lib/ensureSchema"; // no-op on Postgres

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

function sanitize(s: any): string {
  return (s ?? "").toString().trim();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const rawQ = sanitize(url.searchParams.get("q"));
  if (!rawQ) return NextResponse.json({ items: [], total: 0 });

  // SQLite safety (no-op for Postgres)
  await ensureSqliteTables();

  const results: TrackResult[] = [];
  const errors: Errors = {};
  const debug: Record<string, any> = {};

  // -------------------------
  // Build smart WHERE for Party Tyme / DB search
  // -------------------------
  // Supports:
  //   "Artist - Title"
  //   "Artist – Title" (en dash)
  //   "Artist — Title" (em dash)
  //   "Artist | Title"
  //   "Artist Title" (tokens across both fields)
  //   plain substring in either artist or title
  const q = rawQ;
  const cut = q.match(/^\s*(.+?)\s*[-–—|]\s*(.+)\s*$/); // artist-title separators
  const artistPart = cut?.[1]?.trim();
  const titlePart = cut?.[2]?.trim();

  // Token AND logic across artist/title (e.g., "george amarillo")
  const tokens = q.split(/\s+/).filter(Boolean);
  const tokenAND = tokens.length > 1
    ? tokens.map((t) => ({
        OR: [
          { artist: { contains: t, mode: "insensitive" as const } },
          { title: { contains: t, mode: "insensitive" as const } },
        ],
      }))
    : [];

  // Final WHERE
  const where = {
    OR: [
      // Exact split form: Artist - Title
      ...(artistPart && titlePart
        ? [
            {
              AND: [
                { artist: { contains: artistPart, mode: "insensitive" as const } },
                { title: { contains: titlePart, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),

      // Tokens across artist/title (AND of token presence)
      ...(tokenAND.length ? [{ AND: tokenAND }] : []),

      // Simple fallback: substring in either field
      {
        OR: [
          { artist: { contains: q, mode: "insensitive" as const } },
          { title: { contains: q, mode: "insensitive" as const } },
        ],
      },
    ],
  };

  // -------------------------
  // Party Tyme results (any provider)
  // -------------------------
  try {
    const pt = await prisma.track.findMany({
      where,
      orderBy: [{ id: "desc" }], // newer imports first
      take: 50,
      select: {
        artist: true,
        title: true,
        brand: true,
        imageUrl: true,
        // prefer purchaseUrl if present; also return url
        purchaseUrl: true as any,
        url: true,
        source: true,
      } as any,
    });

    results.push(
      ...pt.map((r: any) => ({
        source: (r.source as string) || ("Party Tyme" as const),
        artist: r.artist || "",
        title: r.title || "",
        brand: r.brand || "Party Tyme",
        // Make View/Buy link show: prefer purchaseUrl, fallback to url
        url: r.purchaseUrl ?? r.url ?? undefined,
        imageUrl: r.imageUrl ?? null,
      }))
    );
  } catch (e: any) {
    errors.partytyme = e?.message || String(e);
  }

  // -------------------------
  // Karaoke Version (KV) — feature-flag guarded, JSON query per KV support
  // -------------------------
  try {
    const kvDisabled = String(process.env.KV_DISABLED || "").toLowerCase() === "true";
    if (kvDisabled) {
      errors.kv = "disabled by KV_DISABLED env";
    } else {
      const kvEndpoint = (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "") || "https://www.karaoke-version.com/api/search";
      const affiliateId = (process.env.KV_AFFILIATE_ID || "").trim() || "1048";

      // KV expects a single 'query=' param containing JSON:
      // {
      //   "affiliateId": 1048,
      //   "function": "search",
      //   "parameters": { "query": "George Strait" }
      // }
      const kvPayload = {
        affiliateId,
        function: "search",
        parameters: { query: q },
      };
      const qs = new URLSearchParams({ query: JSON.stringify(kvPayload) });
      const kvUrl = `${kvEndpoint}/?${qs.toString()}`;

      const r = await fetch(kvUrl, { cache: "no-store" });
      const raw = await r.text();
      let data: any = raw;
      try {
        data = JSON.parse(raw);
      } catch {}

      if (r.ok && Array.isArray((data as any)?.items)) {
        results.push(
          ...(data as any).items.map((it: any) => ({
            source: "Karaoke Version" as const,
            artist: it.artist || "",
            title: it.title || "",
            brand: "Karaoke Version",
            url: it.url, // KV provides a product URL
            imageUrl: it.imageUrl ?? null,
          }))
        );
      } else {
        errors.kv = `KV ${r.status}`;
        debug.kv = { kvUrl, body: typeof data === "string" ? data.slice(0, 300) : data };
      }
    }
  } catch (e: any) {
    errors.kv = e?.message || String(e);
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
        }))
      );
    } else {
      errors.youtube = "YouTube returned no array";
      debug.youtube = { status: ytRes.status, body: ytData };
    }
  } catch (e: any) {
    errors.youtube = e?.message || String(e);
  }

  return NextResponse.json({ items: results, total: results.length, errors, debug, parsed: { q, artistPart, titlePart, tokens } });
}
