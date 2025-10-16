// app/api/admin/count-legacy/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db"; // ← uses the guarded Prisma client

export async function GET() {
  try {
    // If your model is named LegacyTrack in prisma/schema.prisma, this works.
    // If the model name is different, change "legacyTrack" accordingly.
    const legacyCount = await prisma.legacyTrack.count().catch(() => 0);
    const trackCount = await prisma.track.count().catch(() => 0);

    return NextResponse.json({
      ok: true,
      trackCount,
      legacyCount
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
