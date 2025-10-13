// app/api/admin/refresh/partytyme/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import type { NextRequest } from "next/server";

/**
 * Placeholder endpoint so the build succeeds and confirms the prisma alias works.
 * Replace this later with your real Party Tyme importer.
 */
async function refreshPartyTyme() {
  try {
    // Simple ping to ensure Prisma gets bundled and can run a query
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, message: "Party Tyme refresh placeholder ran." };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
}

export async function POST(_req: NextRequest) {
  const res = await refreshPartyTyme();
  return Response.json(res, { status: res.ok ? 200 : 500 });
}

// Allow GET for quick testing in the browser
export async function GET() {
  const res = await refreshPartyTyme();
  return Response.json(res, { status: res.ok ? 200 : 500 });
}
