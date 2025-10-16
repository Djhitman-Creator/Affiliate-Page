// pages/api/diag.ts
import type { NextApiRequest, NextApiResponse } from "next";

function coerceDbUrlForVercel() {
  const raw = process.env.DATABASE_URL || "";
  let effective = raw;
  if (process.env.VERCEL && (!raw || !raw.startsWith("file:"))) {
    effective = "file:/tmp/dev.db";
  }
  return { raw, effective };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers.host as string) || "localhost:3000";
  const base = `${proto}://${host}`;

  const { raw, effective } = coerceDbUrlForVercel();
  const dbCheck = {
    present: !!raw,
    rawStartsWithFile: raw.startsWith("file:"),
    rawSample: raw.slice(0, 24),
    effectiveStartsWithFile: effective.startsWith("file:"),
    effectiveSample: effective.slice(0, 24),
  };

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
    KV_DISABLED: process.env.KV_DISABLED ?? null,
    VERCEL: process.env.VERCEL ? "true" : "false",
    VERCEL_ENV: process.env.VERCEL_ENV ?? null
  };

  const checks: Record<string, any> = {};

  // Internal YouTube check (no external quota hit)
  try {
    const yt = await fetch(`${base}/api/youtube?q=george%20strait`, { cache: "no-store" }).then(r => r.json());
    checks.youtube = { ok: Array.isArray(yt?.items), count: Array.isArray(yt?.items) ? yt.items.length : 0 };
  } catch (e: any) {
    checks.youtube = { ok: false, error: e?.message || String(e) };
  }

  // KV check, honoring KV_DISABLED and using realistic request shape/headers
  const kvDisabled = String(process.env.KV_DISABLED || "").toLowerCase() === "true";
  if (kvDisabled) {
    checks.kv = { ok: true, skipped: true, reason: "KV_DISABLED=true" };
  } else {
    try {
      const endpoint = process.env.KV_SEARCH_ENDPOINT || "";
      const queryParam = encodeURIComponent(JSON.stringify({ q: "george strait" }));
      const kvUrl = `${endpoint}?query=${queryParam}`;

      const kvRes = await fetch(kvUrl, {
        headers: {
          "Referer": base,
          "Origin": base,
          "Accept": "application/json"
        },
        cache: "no-store"
      });

      let kvBody: any = null;
      const text = await kvRes.text();
      try { kvBody = JSON.parse(text); } catch { kvBody = text.slice(0, 300); }

      checks.kv = {
        ok: kvRes.ok && Array.isArray((kvBody as any)?.items),
        status: kvRes.status,
        count: Array.isArray((kvBody as any)?.items) ? (kvBody as any).items.length : 0,
        sample: typeof kvBody === "string" ? kvBody : undefined
      };
    } catch (e: any) {
      checks.kv = { ok: false, error: e?.message || String(e) };
    }
  }

  res.status(200).json({ ok: true, whoami: "pages-api-diag", env, dbCheck, checks, base });
}

