export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/api/admin/status/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Latest 10 Party Tyme runs
    const runs = await prisma.importRun.findMany({
      where: { source: "Party Tyme" },
      orderBy: [
        { startedAt: "desc" }, // your schema uses startedAt, not createdAt
        { id: "desc" },
      ],
      take: 10,
      select: {
        id: true,
        source: true,
        startedAt: true,
        finishedAt: true,
        added: true,
        updated: true,
        skipped: true,
        error: true,
        details: true,
      },
    });

    const last = runs[0] ?? null;

    return NextResponse.json({
      ok: true,
      last,
      history: runs,
      envSeen: {
        PARTYTYME_ZIP_URL: process.env.PARTYTYME_ZIP_URL ?? null,
        PARTYTYME_CSV_URL: process.env.PARTYTYME_CSV_URL ?? null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Failed to load status" },
      { status: 500 }
    );
  }
}
