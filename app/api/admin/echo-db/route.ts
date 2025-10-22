// app/api/admin/echo-db/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ensureSqliteTables } from "@/lib/ensureSchema";
import fs from "node:fs/promises";

export async function GET() {
  const db = process.env.DATABASE_URL || "";
  const isFile = db.startsWith("file:");
  let filePath = "";
  let fileExists = false;
  let fileSize = 0;

  try {
    await ensureSqliteTables();
  } catch {}

  try {
    if (isFile) {
      filePath = db.replace(/^file:/, "");
      const st = await fs.stat(filePath);
      fileExists = !!st;
      fileSize = (st as any).size ?? 0;
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    ok: true,
    DATABASE_URL: db,
    isFile,
    resolvedPath: filePath || null,
    fileExists,
    fileSize,
  });
}
