// app/api/admin/count/by-source/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Total rows in Track
    const trackCount = await prisma.track.count();

    // Group by "source" column (nullable)
    const groups = await prisma.track.groupBy({
      by: ["source"],
      _count: { _all: true },
    });

    // Convert to a simple object: { "Party Tyme": 123, "Karaoke Version": 456, "YouTube": 789, "null": 5 }
    const bySource: Record<string, number> = {};
    for (const g of groups) {
      const key = g.source ?? "null";
      bySource[key] = g._count._all;
    }

    // Optional legacy count: only if such a model exists on the client
    let legacyCount = 0;
    try {
      const p: any = prisma as any;
      if (p?.legacyTrack?.count) {
        legacyCount = await p.legacyTrack.count();
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      trackCount,
      legacyCount,     // will be 0 unless you add a legacy model later
      bySource,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
