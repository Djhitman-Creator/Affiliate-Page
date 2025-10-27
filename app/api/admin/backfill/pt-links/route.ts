// app/api/admin/backfill/pt-links/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

function partyTymeSearchUrl(artist?: string | null, title?: string | null): string | null {
  const a = (artist || "").toString().trim();
  const t = (title || "").toString().trim();
  const q = [a, t].filter(Boolean).join(" ");
  if (!q) return null;
  const base = "https://www.partytyme.net/songshop/";
  // SPA hash route — avoids IIS 404s
  return `${base}?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(q)}`;
}

async function runBatch(limit = 1000) {
  const beforeRemaining = await prisma.track.count({
    where: {
      AND: [
        {
          OR: [
            { source: { equals: "Party Tyme", mode: "insensitive" } as any },
            { brand: { contains: "party tyme", mode: "insensitive" } as any },
          ],
        },
        { url: null },
        { purchaseUrl: null },
      ],
    },
  });

  const rows = await prisma.track.findMany({
    where: {
      AND: [
        {
          OR: [
            { source: { equals: "Party Tyme", mode: "insensitive" } as any },
            { brand: { contains: "party tyme", mode: "insensitive" } as any },
          ],
        },
        { url: null },
        { purchaseUrl: null },
      ],
    },
    select: { id: true, artist: true, title: true },
    orderBy: { id: "asc" },
    take: limit,
  });

  if (!rows.length) {
    return {
      ok: true,
      updated: 0,
      beforeRemaining,
      afterRemaining: 0,
      sampleUpdatedIds: [] as number[],
      message: "Nothing left to backfill.",
    };
  }

  const updatedIds: number[] = [];
  for (const r of rows) {
    const link = partyTymeSearchUrl(r.artist, r.title);
    if (!link) continue;
    await prisma.track.update({
      where: { id: r.id },
      data: { url: link, purchaseUrl: link },
    });
    updatedIds.push(r.id);
  }

  const afterRemaining = await prisma.track.count({
    where: {
      AND: [
        {
          OR: [
            { source: { equals: "Party Tyme", mode: "insensitive" } as any },
            { brand: { contains: "party tyme", mode: "insensitive" } as any },
          ],
        },
        { url: null },
        { purchaseUrl: null },
      ],
    },
  });

  return {
    ok: true,
    updated: updatedIds.length,
    beforeRemaining,
    afterRemaining,
    sampleUpdatedIds: updatedIds.slice(0, 10),
    note: "Forced dynamic/no-store so repeated calls progress.",
  };
}

function jsonNoStore(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function POST() {
  try {
    const out = await runBatch(1000);
    return jsonNoStore(out);
  } catch (e: any) {
    return jsonNoStore({ ok: false, error: e?.message || String(e) }, 500);
  }
}

export async function GET(req: Request) {
  try {
    // Accept ?limit=2000 and a ?ts=cachebuster for manual GETs in browser
    const u = new URL(req.url);
    const limit = Math.min(Math.max(Number(u.searchParams.get("limit")) || 1000, 1), 5000);
    const out = await runBatch(limit);
    return jsonNoStore(out);
  } catch (e: any) {
    return jsonNoStore({ ok: false, error: e?.message || String(e) }, 500);
  }
}
