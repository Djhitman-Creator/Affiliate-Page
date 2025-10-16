// pages/api/diag.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dbUrl = process.env.DATABASE_URL || "";
  const dbCheck = {
    present: !!dbUrl,
    startsWithFile: dbUrl.startsWith("file:"),
    sample: dbUrl.slice(0, 16) // e.g. "file:/tmp/dev.db"
  };

  // Minimal, safe env echo (do not print secrets)
  const env = {
    DB_PROVIDER: process.env.DB_PROVIDER ?? null,
    KV_API_BASE: process.env.KV_API_BASE ? "set" : "missing",
    KV_SEARCH_ENDPOINT: process.env.KV_SEARCH_ENDPOINT ? "set" : "missing",
    KV_AFFILIATE_ID: process.env.KV_AFFILIATE_ID ? "set" : "missing",
    PARTYTYME_MERCHANT: process.env.PARTYTYME_MERCHANT ? "set" : "missing",
    PARTYTYME_ZIP_URL: process.env.PARTYTYME_ZIP_URL ? "set" : "missing",
    PARTYTYME_CSV_URL: process.env.PARTYTYME_CSV_URL ? "set" : "missing",
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ? "set" : "missing",
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? null,
  };

  // Lightweight live checks (won’t crash if offline)
  const checks: Record<string, any> = {};
  try {
    const yt = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/youtube?q=george%20strait`).then(r => r.json());
    checks.youtube = { ok: Array.isArray(yt?.items), count: Array.isArray(yt?.items) ? yt.items.length : 0 };
  } catch (e: any) {
    checks.youtube = { ok: false, error: e?.message || String(e) };
  }

  try {
    const kvUrl = `${process.env.KV_SEARCH_ENDPOINT}?q=george%20strait&aff=${process.env.KV_AFFILIATE_ID}`;
    const kv = await fetch(kvUrl).then(r => r.json());
    checks.kv = { ok: Array.isArray(kv?.items), count: Array.isArray(kv?.items) ? kv.items.length : 0 };
  } catch (e: any) {
    checks.kv = { ok: false, error: e?.message || String(e) };
  }

  // Don’t import Prisma here; keep diag cheap. DB validity is shown by dbCheck.

  res.status(200).json({
    ok: true,
    whoami: "pages-api-diag",
    env,
    dbCheck,
    checks
  });
}
