// app/api/admin/fix-pt-with-discid/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

function buildDirectUrl(trackId: string | null): string | null {
  if (!trackId) return null;
  
  // Check if it's a Party Tyme disc ID (PY or PH prefix)
  if (/^P[YH]\d+$/i.test(trackId)) {
    return `https://www.partytyme.net/songshop/cat/search/item/${trackId.toUpperCase()}?merchant=${PT_MERCHANT}`;
  }
  
  return null;
}

function buildSearchUrl(artist?: string | null, title?: string | null): string | null {
  const a = (artist || "").toString().trim();
  const t = (title || "").toString().trim();
  const q = [a, t].filter(Boolean).join(" ");
  if (!q) return null;
  const base = "https://www.partytyme.net/songshop/";
  return `${base}?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(q)}`;
}

export async function POST() {
  try {
    // Get ALL Party Tyme tracks
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
        title: true,
        trackId: true,
        brand: true
      }
    });

    let updatedWithDiscId = 0;
    let updatedWithSearch = 0;
    const sampleUrls: any[] = [];

    for (const track of tracks) {
      let newUrl: string | null = null;
      
      // First try to use disc ID if available
      if (track.trackId) {
        newUrl = buildDirectUrl(track.trackId);
        if (newUrl) {
          updatedWithDiscId++;
          if (sampleUrls.length < 3) {
            sampleUrls.push({ 
              artist: track.artist,
              title: track.title,
              trackId: track.trackId,
              url: newUrl 
            });
          }
        }
      }
      
      // Fall back to search URL if no disc ID or invalid format
      if (!newUrl) {
        newUrl = buildSearchUrl(track.artist, track.title);
        if (newUrl) {
          updatedWithSearch++;
        }
      }
      
      if (newUrl) {
        await prisma.track.update({
          where: { id: track.id },
          data: {
            url: newUrl,
            purchaseUrl: newUrl
          }
        });
      }
    }

    return NextResponse.json({
      ok: true,
      totalTracks: tracks.length,
      updatedWithDiscId,
      updatedWithSearch,
      sampleUrls,
      message: `Updated ${updatedWithDiscId} with direct disc ID links, ${updatedWithSearch} with search links`
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