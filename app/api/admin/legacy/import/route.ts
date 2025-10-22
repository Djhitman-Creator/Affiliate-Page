// app/api/admin/legacy/import/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return NextResponse.json({ ok: false, error: "Empty body" }, { status: 400 });
    }

    // Header detection: if first line includes 'artist,title' assume it's a header and skip it
    const startIdx = /artist\s*,\s*title/i.test(lines[0]) ? 1 : 0;

    const rows = [];
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(",").map(s => s.trim());
      // Ensure at least artist + title
      const [artist = "", title = "", brand = "", discId = "", url = ""] = parts;
      if (!artist || !title) continue;
      rows.push({
        artist,
        title,
        brand: brand || null,
        discId: discId || null,
        url: url || null,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "No valid rows (need at least artist,title)" }, { status: 400 });
    }

    const res = await prisma.legacyTrack.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return NextResponse.json({
      ok: true,
      received: lines.length,
      inserted: res.count,
      skipped: rows.length - res.count,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
