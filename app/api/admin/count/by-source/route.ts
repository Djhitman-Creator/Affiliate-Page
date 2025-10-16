export const runtime = "nodejs";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const trackCount = await prisma.track.count();
    const legacyCount = await prisma.legacyTrack.count().catch(() => 0);
    return NextResponse.json({ ok: true, trackCount, legacyCount });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
