// app/api/admin/check-db/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function mask(url: string | undefined) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    if (u.username) u.username = "***";
    return u.toString();
  } catch {
    return (url || "").replace(/:\/\/([^:@]+):([^@]+)@/, "://***:***@");
  }
}

export async function GET() {
  const provider = (process.env.DB_PROVIDER || "").toLowerCase();
  const dbUrl = process.env.DATABASE_URL || "";

  try {
    // List tables by provider (SQLite vs Postgres)
    let tables: Array<{ name: string }> = [];
    if (provider === "sqlite") {
      tables = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`
      );
    } else {
      tables = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `SELECT table_name AS name
           FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;`
      );
    }

    // Optional counts (don’t fail if model doesn’t exist)
    const counts: Record<string, number> = {};
    try { counts.track = await prisma.track.count(); } catch {}
    try {
      const p: any = prisma as any;
      if (p?.legacyTrack?.count) counts.legacyTrack = await p.legacyTrack.count();
    } catch {}

    return NextResponse.json({
      ok: true,
      provider,
      databaseUrl: mask(dbUrl),
      tables,
      counts,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, provider, databaseUrl: mask(dbUrl), error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
