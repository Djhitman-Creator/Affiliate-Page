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

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";
function withMerchant(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(String(url));
    if (!u.searchParams.has("merchant")) u.searchParams.set("merchant", PT_MERCHANT);
    return u.toString();
  } catch {
    const s = String(url);
    return s.includes("?") ? `${s}&merchant=${PT_MERCHANT}` : `${s}?merchant=${PT_MERCHANT}`;
  }
}
function partyTymeSearchUrl(artist?: string | null, title?: string | null): string | null {
  const a = (artist || "").toString().trim();
  const t = (title || "").toString().trim();
  const q = [a, t].filter(Boolean).join(" ");
  if (!q) return null;
  return withMerchant(`https://www.partytyme.net/songshop/search?q=${encodeURIComponent(q)}`);
}

function sanitize(s: any): string {
  return (s ?? "").toString().trim();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const rawQ = sanitize(url.searchParams.get("q"));
  if (!rawQ) return NextResponse.json({ items: [], total: 0 });

  await ensureSqliteTables(); // no-op on Postgres

  const results: TrackResult[] = [];
  const errors: Errors = {};
  const debug: Record<string, any> = {};

  // ------------ smart WHERE ------------
  const q = rawQ;
  const cut = q.match(/^\s*(.+?)\s*[-–—|]\s*(.+)\s*$/);
  const artistPart = cut?.[1]?.trim();
  const titlePart = cut?.[2]?.trim();

  const tokens = q.split(/\s+/).filter(Boolean);
  const tokenAND =
    tokens.length > 1
      ? tokens.map((t) => ({
          OR: [
            { artist: { contains: t, mode: "insensitive" as const } },
            { title: { contains: t, mode: "insensitive" as const } },
          ],
        }))
      : [];

  const where = {
    OR: [
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
      ...(tokenAND.length ? [{ AND: tokenAND }] : []),
      {
        OR: [
          { artist: { contains: q, mode: "insensitive" as const } },
          { title: { contains: q, mode: "insensitive" as const } },
        ],
      },
    ],
  };

  // ------------ Party Tyme ------------
  try {
    const pt = await prisma.track.findMany({
      where,
      orderBy: [{ id: "desc" }],
      take: 50,
      select: {
        artist: true,
        title: true,
        brand: true,
        imageUrl: true,
        purchaseUrl: true,
        url: true,
        source: true,
      },
    });

    results.push(
      ...pt.map((r) => {
        const src: "Party Tyme" | "Karaoke Version" | "YouTube" =
          r.source === "Karaoke Version"
            ? "Karaoke Version"
            : r.source === "YouTube"
            ? "YouTube"
            : "Party Tyme";

        // Fallback: if no purchaseUrl/url in DB, generate a Party Tyme search link on the fly
        const bestUrl =
          (r as any).purchaseUrl ??
          r.url ??
          (src === "Party Tyme" ? partyTymeSearchUrl(r.artist, r.title) ?? undefined : undefined);

        return {
          source: src,
          artist: r.artist || "",
          title: r.title || "",
          brand: r.brand || "Party Tyme",
          url: bestUrl,
          imageUrl: r.imageUrl ?? null,
        } satisfies TrackResult;
      })
    );
  } catch (e: any) {
    errors.partytyme = e?.message || String(e);
  }

  // ------------ Karaoke Version ------------
  try {
    const kvDisabled = String(process.env.KV_DISABLED || "").toLowerCase() === "true";
    if (kvDisabled) {
      errors.kv = "disabled by KV_DISABLED env";
    } else {
      const kvEndpoint =
        (process.env.KV_SEARCH_ENDPOINT || "").replace(/\/+$/, "") ||
        "https://www.karaoke-version.com/api/search";
      const affiliateId = (process.env.KV_AFFILIATE_ID || "").trim() || "1048";

      const kvPayload = { affiliateId, function: "search", parameters: { query: q } };
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
            url: it.url,
            imageUrl: it.imageUrl ?? null,
          }))
        );
      } else {
        errors.kv = `KV ${r.status}`;
        debug.kv = { kvUrl, body: typeof data === "string" ? String(data).slice(0, 300) : data };
      }
    }
  } catch (e: any) {
    errors.kv = e?.message || String(e);
  }

  // ------------ YouTube ------------
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

  return NextResponse.json({
    items: results,
    total: results.length,
    errors,
    debug,
    parsed: { q, artistPart, titlePart, tokens },
  });
}
