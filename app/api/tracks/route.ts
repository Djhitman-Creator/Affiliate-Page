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
// Karaoke Version (KV) — JSON payload via ?query=... (no special headers)
// Docs: https://affiliate.recisio.com/karaoke-version/webservice.html
// -------------------------
try {
  const kvDisabled = String(process.env.KV_DISABLED || "").toLowerCase() === "true";
  if (kvDisabled) {
    errors.kv = "disabled by KV_DISABLED env";
  } else {
    const kvEndpointRaw = (process.env.KV_SEARCH_ENDPOINT || "").trim();
    const kvEndpoint = kvEndpointRaw || "https://www.karaoke-version.com/api/search/";
    const affiliateId = Number(process.env.KV_AFFILIATE_ID || "1048");

    // Build the JSON payload they require, then URL-encode it into ?query=
    const payload = {
      affiliateId,
      function: "search",
      parameters: { query: q },
    };
    const qs = new URLSearchParams({ query: JSON.stringify(payload) });
    const kvUrl = `${kvEndpoint.replace(/\/+$/, "/")}?${qs.toString()}`;

    // No special headers needed per KV support
    const r = await fetch(kvUrl, { cache: "no-store" });
    const raw = await r.text();
    let data: any = raw;
    try { data = JSON.parse(raw); } catch {}

    // Accept either an array or { items: [...] }
    const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : null;

    if (r.ok && Array.isArray(arr)) {
      results.push(
        ...arr.map((it: any) => ({
          source: "Karaoke Version" as const,
          artist: it.artist || it.singer || "",
          title: it.title || it.name || "",
          brand: "Karaoke Version",
          url: it.url || it.link || undefined,
          imageUrl: it.imageUrl || it.image || it.cover || null,
        })),
      );
    } else {
      errors.kv = `${r.status} ${kvUrl}`;
      debug.kv = {
        status: r.status,
        kvUrl,
        body: typeof data === "string" ? String(data).slice(0, 500) : data,
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
