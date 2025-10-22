// app/api/legacy/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ensureSqliteTables } from "@/lib/ensureSchema";

export async function GET(req: Request) {
  try {
    await ensureSqliteTables();
    const u = new URL(req.url);
    const artist = (u.searchParams.get("artist") || "").trim();
    const title  = (u.searchParams.get("title")  || "").trim();
    if (!artist && !title) {
      return NextResponse.json({ ok: false, error: "artist or title required" }, { status: 400 });
    }

    const items = await prisma.legacyTrack.findMany({
      where: {
        AND: [
          artist ? { artist: { contains: artist } } : {},
          title  ? { title:  { contains: title } } : {},
        ],
      },
      take: 50,
    });

    // Shape for UI
    const links = items.map((r: any) => ({
      id: r.id,
      artist: r.artist ?? "",
      title:  r.title  ?? "",
      brand:  r.brand  ?? "Legacy",
      url:    r.url    ?? null,
    }));

    return NextResponse.json({ ok: true, count: links.length, items: links });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
