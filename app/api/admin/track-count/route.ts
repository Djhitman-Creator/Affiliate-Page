// app/api/admin/track-count/route.ts
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
    // Primary count via Prisma
    let count = 0;
    try {
      count = await prisma.track.count();
    } catch (e) {
      // fall through to raw
    }

    // Raw fallback (Postgres)
    if (!count && provider !== "sqlite") {
      try {
        const row = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
          `SELECT COUNT(*)::bigint AS c FROM "Track";`
        );
        if (Array.isArray(row) && row[0]?.c != null) {
          count = Number(row[0].c);
        }
      } catch {
        // ignore
      }
    }

    // Also return a tiny sample row to prove we’re reading the same DB as the importer
    let sample: any = null;
    try {
      sample = await prisma.track.findFirst({
        select: { id: true, source: true, artist: true, title: true, brand: true, url: true },
        orderBy: { id: "desc" },
      });
    } catch {}

    // Report which DB this route sees
    return NextResponse.json({
      ok: true,
      provider,
      databaseUrl: mask(dbUrl),
      count,
      sample,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        provider,
        databaseUrl: mask(dbUrl),
        error: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}
