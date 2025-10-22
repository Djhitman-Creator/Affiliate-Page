// app/api/admin/refresh/all/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ensureSqliteTables } from "@/lib/ensureSchema";

/**
 * Orchestrates all data refreshers.
 * - Calls Party Tyme importer in chunks
 * - Calls KV refresher once
 *
 * Query params (all optional):
 *   total   = total rows to attempt for PT (default 60000)
 *   chunk   = batch size per PT request (default 2000)
 *   delayMs = pause between PT batches (default 500)
 *   secret  = must match PT_IMPORT_SECRET if that is set (auth gate)
 */
export async function POST(req: Request) {
  await ensureSqliteTables();

  // Simple auth gate: reuse PT_IMPORT_SECRET
  const need = (process.env.PT_IMPORT_SECRET || "").trim();
  const u = new URL(req.url);
  const got = u.searchParams.get("secret") || req.headers.get("x-pt-secret") || "";
  if (need && got !== need) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Parse options
  const total = Math.max(0, Number(u.searchParams.get("total") || "60000"));
  const chunk = Math.max(1, Number(u.searchParams.get("chunk") || "2000"));
  const delayMs = Math.max(0, Number(u.searchParams.get("delayMs") || "500"));

  const baseOrigin = `${u.protocol}//${u.host}`;
  const headers: Record<string, string> = {
    Referer: baseOrigin,
    Origin: baseOrigin,
    "User-Agent": "RefreshAll/1.0",
  };
  if (need) headers["x-pt-secret"] = need;

  // Helper
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // ---------------------------
  // 1) Party Tyme in chunks
  // ---------------------------
  const ptUrlBase = `${baseOrigin}/api/admin/refresh/partytyme`;
  let processed = 0;
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let lastDbCount = 0;
  const ptRuns: any[] = [];

  for (let skip = 0; skip < total; skip += chunk) {
    const url = `${ptUrlBase}?skip=${skip}&limit=${chunk}`;
    const r = await fetch(url, { method: "POST", headers, cache: "no-store" });
    const j: any = await r.json().catch(() => ({}));

    ptRuns.push({ at: { skip, chunk }, ok: r.ok && j?.ok !== false, stats: j?.stats ?? null });

    if (!r.ok || j?.ok === false) {
      return NextResponse.json(
        { ok: false, step: "partytyme", error: "PT importer failed", at: { skip, chunk }, detail: j || (await r.text()) },
        { status: 500 }
      );
    }
    processed += j?.stats?.processed || 0;
    added += j?.stats?.added || 0;
    updated += j?.stats?.updated || 0;
    skipped += j?.stats?.skipped || 0;
    lastDbCount = j?.stats?.dbCount ?? lastDbCount;

    if (delayMs) await sleep(delayMs);
    if ((j?.stats?.processed || 0) === 0) break; // stop when no more data
  }

  // ---------------------------
  // 2) Karaoke Version refresh (single call)
  // ---------------------------
  // Your repo has app/api/admin/refresh/KV/route.ts (capitalized) — URLs on Vercel are case-sensitive.
  // Try lowercase first, then capitalized fallback.
  const kvPaths = ["/api/admin/refresh/kv", "/api/admin/refresh/KV"];
  let kvResult: any = null;
  let kvOk = false;
  for (const p of kvPaths) {
    const kvUrl = `${baseOrigin}${p}`;
    const r = await fetch(kvUrl, { method: "POST", headers, cache: "no-store" });
    try {
      const j = await r.json();
      kvResult = { path: p, ok: r.ok && j?.ok !== false, body: j };
      kvOk = !!(r.ok && j?.ok !== false);
    } catch {
      kvResult = { path: p, ok: false, body: await r.text().catch(() => "") };
      kvOk = false;
    }
    if (kvOk) break;
  }

  return NextResponse.json({
    ok: kvOk, // all-good if KV also returned OK; set true even if KV missing? up to you.
    summary: {
      pt: { totalRequested: total, chunk, processed, added, updated, skipped, dbCount: lastDbCount },
      kv: kvResult,
    },
    details: {
      ptRuns, // small per-batch log for debugging
    },
  });
}

// Convenience for browser:
export async function GET(req: Request) {
  return POST(req);
}
