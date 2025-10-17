// app/api/admin/check-db/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // List tables in the SQLite file
    const tables = await prisma.$queryRawUnsafe<any[]>(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const hasTrack = tables.some(t => String(t.name).toLowerCase() === "track");
    const count = hasTrack ? await prisma.track.count() : null;

    return NextResponse.json({
      ok: true,
      db: process.env.DATABASE_URL,
      hasTrack,
      count,
      tables: tables.map(t => t.name).slice(0, 30)
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
