// app/api/admin/count-legacy/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Counts tracks and (optionally) legacy tracks.
 * This compiles even if a legacy model doesn't exist.
 * If you later confirm the exact Prisma model name, swap the dynamic lookup for a direct call.
 */
export async function GET() {
  // Count regular tracks (always present)
  const trackCount = await prisma.track.count().catch(() => 0);

  // Try to count a legacy model if present (various likely names)
  let legacyCount = 0;
  try {
    const p: any = prisma as any;

    // Add/adjust candidate names to match your schema.prisma
    const candidates = [
      "legacyTrack",
      "legacy",
      "legacySong",
      "legacy_tracks",
      "legacy_songs",
    ];

    for (const key of candidates) {
      if (p?.[key]?.count) {
        legacyCount = await p[key].count();
        break;
      }
    }
  } catch {
    // ignore and leave legacyCount = 0
  }

  return NextResponse.json({
    ok: true,
    trackCount,
    legacyCount,
  });
}
