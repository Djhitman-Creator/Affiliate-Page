// app/api/admin/clear-partytyme/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Optional secret protection
    const secret = process.env.PT_IMPORT_SECRET;
    if (secret) {
      const url = new URL(req.url);
      const provided = url.searchParams.get("secret") || req.headers.get("x-pt-secret") || "";
      if (provided !== secret) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    }

    // Count before deletion
    const beforeCount = await prisma.track.count({
      where: { source: "Party Tyme" }
    });

    // Delete all Party Tyme tracks
    const result = await prisma.track.deleteMany({
      where: { source: "Party Tyme" }
    });

    // Count after (should be 0)
    const afterCount = await prisma.track.count({
      where: { source: "Party Tyme" }
    });

    const totalRemaining = await prisma.track.count();

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      beforeCount,
      afterCount,
      totalRemaining,
      message: `Deleted ${result.count} Party Tyme tracks`
    });
  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: e?.message || String(e) 
    }, { status: 500 });
  }
}

// Allow GET for browser access
export async function GET(req: Request) {
  return POST(req);
}