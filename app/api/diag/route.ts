/* Minimal deploy diagnostics for Vercel */
import type { NextRequest } from "next/server";

export const runtime = "nodejs"; // ensure Node, not Edge

type Check = { name: string; ok: boolean; note?: string };

async function head(url: string, name: string): Promise<Check> {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    return { name, ok: r.ok, note: `${r.status} ${r.statusText}` };
  } catch (e: any) {
    return { name, ok: false, note: e?.message || String(e) };
  }
}

export async function GET(_req: NextRequest) {
  const checks: Check[] = [];

  // 1) Environment variable presence
  const envKeys = [
    "KV_API_BASE",
    "KV_SEARCH_ENDPOINT",
    "KV_AFFILIATE_ID",
    "PARTYTYME_MERCHANT",
    "PARTYTYME_ZIP_URL",
    "PARTYTYME_CSV_URL",
    "YOUTUBE_API_KEY",
    "YOUTUBE_MAX_CHANNELS",
    "YT_INDEX_MAX",
    "YT_WARM_DAILY_CHANNELS",
    "YT_WARM_SECRET",
    "NEXT_PUBLIC_APP_ENV",
  ];

  const envReport = envKeys.map((k) => ({ key: k, present: !!process.env[k] }));

  // 2) Try importing channels
  let channelsLoaded = 0;
  let channelsNote = "not loaded";
  try {
    const mod: any = await import("@/lib/youtubeChannels");
    const arr =
      [mod.YT_CHANNELS, mod.YTChannels, mod.channels, mod.default].find(
        (x) => Array.isArray(x)
      ) || [];
    channelsLoaded = Array.isArray(arr) ? arr.length : 0;
    channelsNote = `channels=${channelsLoaded}`;
  } catch (e: any) {
    channelsNote = `import failed: ${e?.message || String(e)}`;
  }
  checks.push({ name: "youtubeChannels import", ok: channelsLoaded > 0, note: channelsNote });

  // 3) Network checks (HEAD) to external services
  if (process.env.KV_API_BASE) {
    checks.push(await head(process.env.KV_API_BASE, "KV_API_BASE HEAD"));
  } else {
    checks.push({ name: "KV_API_BASE HEAD", ok: false, note: "KV_API_BASE missing" });
  }

  if (process.env.KV_SEARCH_ENDPOINT) {
    checks.push(await head(process.env.KV_SEARCH_ENDPOINT, "KV_SEARCH_ENDPOINT HEAD"));
  } else {
    checks.push({ name: "KV_SEARCH_ENDPOINT HEAD", ok: false, note: "KV_SEARCH_ENDPOINT missing" });
  }

  if (process.env.PARTYTYME_ZIP_URL) {
    checks.push(await head(process.env.PARTYTYME_ZIP_URL, "PARTYTYME_ZIP_URL HEAD"));
  } else {
    checks.push({ name: "PARTYTYME_ZIP_URL HEAD", ok: false, note: "PARTYTYME_ZIP_URL missing" });
  }

  if (process.env.PARTYTYME_CSV_URL) {
    checks.push(await head(process.env.PARTYTYME_CSV_URL, "PARTYTYME_CSV_URL HEAD"));
  } else {
    checks.push({ name: "PARTYTYME_CSV_URL HEAD", ok: false, note: "PARTYTYME_CSV_URL missing" });
  }

  // 4) SQLite reminder (Vercel)
  // Vercel’s serverless FS is ephemeral; Prisma + SQLite won't persist.
  // If Legacy uses Prisma/SQLite, it'll work locally but not as a durable DB on Vercel.
  const sqliteWarning =
    (process.env.DB_PROVIDER || "sqlite").toLowerCase() === "sqlite"
      ? "On Vercel, SQLite is ephemeral. Legacy/DB features may not persist. Prefer Postgres in production."
      : "DB is not SQLite; ok.";

  return Response.json({
    runtime,
    env: envReport,
    checks,
    sqliteWarning,
    hint: "If KV/PT HEAD fail or env vars are missing, fix Vercel Environment Variables and redeploy. If routes still return no results, add export const runtime='nodejs' at the top of those API routes."
  });
}
