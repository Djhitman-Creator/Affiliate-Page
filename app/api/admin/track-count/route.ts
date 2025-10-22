// app/api/admin/track-count/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ensureSqliteTables } from "@/lib/ensureSchema";

export async function GET() {
  try {
    await ensureSqliteTables();
    const count = await prisma.track.count();
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
