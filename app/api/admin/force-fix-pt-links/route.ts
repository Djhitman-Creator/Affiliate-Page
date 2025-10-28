// app/api/admin/force-fix-pt-links/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

function partyTymeSearchUrl(artist?: string | null, title?: string | null): string | null {
  const a = (artist || "").toString().trim();
  const t = (title || "").toString().trim();
  const q = [a, t].filter(Boolean).join(" ");
  if (!q) return null;
  const base = "https://www.partytyme.net/songshop/";
  return `${base}?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(q)}`;
}

export async function POST() {
  try {
    // Get ALL Party Tyme tracks, not just ones with null URLs
    const tracks = await prisma.track.findMany({
      where: {
        OR: [
          { source: "Party Tyme" },
          { brand: { contains: "party tyme", mode: "insensitive" } as any }
        ]
      },
      select: {
        id: true,
        artist: true,
        title: true
      }
    });

    let updated = 0;
    const sampleUrls: string[] = [];

    // Update ALL tracks with correct URL format
    for (const track of tracks) {
      const newUrl = partyTymeSearchUrl(track.artist, track.title);
      if (newUrl) {
        await prisma.track.update({
          where: { id: track.id },
          data: {
            url: newUrl,
            purchaseUrl: newUrl
          }
        });
        updated++;
        if (sampleUrls.length < 3) {
          sampleUrls.push(newUrl);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      totalTracks: tracks.length,
      updated,
      sampleUrls,
      message: `Force updated ${updated} Party Tyme URLs`
    });
  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: e?.message || String(e) 
    }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}