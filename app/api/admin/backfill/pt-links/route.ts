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

  // Party Tyme SPA uses hash router: /#/search/<query>
  const base = "https://www.partytyme.net/songshop/";
  return `${base}?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(q)}`;
}

export async function GET() {
  try {
    // Batch any PT rows missing both url and purchaseUrl
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
      take: 1000,
    });

    let updated = 0;
    for (const r of rows) {
      const link = partyTymeSearchUrl(r.artist, r.title);
      if (!link) continue;
      await prisma.track.update({
        where: { id: r.id },
        data: { url: link },
      });
      updated++;
    }

    const remaining = await prisma.track.count({
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

    return NextResponse.json({ ok: true, updated, remaining });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
