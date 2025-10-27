// app/api/admin/backfill/pt-links/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

function partyTymeSearchUrl(artist?: string | null, title?: string | null): string | null {
  const a = (artist || "").toString().trim();
  const t = (title || "").toString().trim();
  const q = [a, t].filter(Boolean).join(" ");
  if (!q) return null;
  const base = "https://www.partytyme.net/songshop/";
  // SPA hash route (avoids IIS 404) — /#/search/<query>
  return `${base}?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(q)}`;
}

export async function GET() {
  try {
    // Count BEFORE
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

    // Pull a stable page of rows to update (lowest id first)
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
      take: 1000,
    });

    if (!rows.length) {
      return NextResponse.json({
        ok: true,
        updated: 0,
        beforeRemaining,
        afterRemaining: 0,
        message: "Nothing left to backfill.",
      });
    }

    const updatedIds: number[] = [];
    for (const r of rows) {
      const link = partyTymeSearchUrl(r.artist, r.title);
      if (!link) continue;

      await prisma.track.update({
        where: { id: r.id },
        data: {
          // set both so the UI and any admin tools can use either
          url: link,
          purchaseUrl: link,
        },
      });

      updatedIds.push(r.id);
    }

    // Count AFTER (in the same request)
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

    return NextResponse.json({
      ok: true,
      updated: updatedIds.length,
      beforeRemaining,
      afterRemaining,
      sampleUpdatedIds: updatedIds.slice(0, 10),
      note:
        "Run again until afterRemaining reaches 0. Uses deterministic paging (id asc) to avoid reprocessing the same rows.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
