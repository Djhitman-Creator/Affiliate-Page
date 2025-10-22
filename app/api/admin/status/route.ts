// app/api/admin/status/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Basic counts
    const trackCount = await prisma.track.count().catch(() => 0);

    // Latest timestamps (useful “freshness” signal)
    const latestTrack = await prisma.track.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }).catch(() => null);

    // Optional: legacy count if you added the model
    let legacyCount = 0;
    let latestLegacy: Date | null = null;
    try {
      const p: any = prisma as any;
      if (p?.legacyTrack?.count) {
        legacyCount = await p.legacyTrack.count();
      }
      if (p?.legacyTrack?.findFirst) {
        const ll = await p.legacyTrack.findFirst({
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        latestLegacy = ll?.createdAt ?? null;
      }
    } catch {
      // ignore if model doesn't exist
    }

    // Optional: import runs if you *later* add an ImportRun model
    let runs: Array<any> = [];
    try {
      const p: any = prisma as any;
      if (p?.importRun?.findMany) {
        runs = await p.importRun.findMany({
          where: { source: "Party Tyme" },
          orderBy: [{ startedAt: "desc" }],
          take: 10,
        });
      }
    } catch {
      // ignore if model doesn't exist
    }

    return NextResponse.json({
      ok: true,
      counts: {
        tracks: trackCount,
        legacy: legacyCount,
      },
      latest: {
        trackCreatedAt: latestTrack?.createdAt ?? null,
        legacyCreatedAt: latestLegacy,
      },
      runs, // empty array unless an ImportRun model exists
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

