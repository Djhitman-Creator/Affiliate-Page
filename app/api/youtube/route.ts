// app/api/youtube/route.ts
/* eslint-disable no-console */
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * ENV + API constants
 */
const API_KEY = process.env.YOUTUBE_API_KEY || "";
const API = "https://www.googleapis.com/youtube/v3";
const MAX_CHANNELS = Math.max(1, Number(process.env.YOUTUBE_MAX_CHANNELS || 8));

/**
 * Types
 */
type ChannelCfg = { label: string; handle?: string; channelId?: string; active?: boolean };
type CachedVideo = {
  videoId: string;
  channelId: string;
  channelTitle?: string;
  title?: string;
  publishedAt?: string;
};

/**
 * Small utils
 */
function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s: string) {
  return norm(s).split(" ").filter(Boolean);
}
function ensureCacheDir() {
  const dir = path.resolve(".cache/youtube");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function readJSON(file: string) {
  try {
    if (!fs.existsSync(file)) return null;
    const txt = fs.readFileSync(file, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
function loadAllCachedVideos(): CachedVideo[] {
  const dir = ensureCacheDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const all: CachedVideo[] = [];
  for (const f of files) {
    const data = readJSON(path.join(dir, f));
    if (Array.isArray(data)) all.push(...data);
    else if (Array.isArray((data as any)?.items)) all.push(...(data as any).items);
  }
  return all;
}
function filterCachedByQuery(cached: CachedVideo[], artist: string, title: string) {
  const aT = tokens(artist);
  const tT = tokens(title);
  const queryTokens = [...aT, ...tT];

  return cached.filter(v => {
    const T = norm(v.title || "");

    // CASE 1: if no query at all, include everything
    if (queryTokens.length === 0) return true;

    // CASE 2: at least one token must match
    const hasMatch = queryTokens.some(t => T.includes(t));

    // CASE 3: also include if it contains the word "karaoke"
    const hasKaraoke = T.includes("karaoke");

    return hasMatch || hasKaraoke;
  });
}

function toClientItem(v: CachedVideo) {
  return {
    label: v.channelTitle || "YouTube",
    handle: v.channelId, // we may not know a @handle; channelId is stable
    title: v.title || "",
    videoId: v.videoId,
    url: `https://youtu.be/${v.videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
  };
}

/**
 * Dynamic channel loader — accepts any of:
 *   export default [...]
 *   export const YT_CHANNELS = [...]
 *   export const YTChannels  = [...]
 *   export const channels    = [...]
 */
async function loadChannels(): Promise<ChannelCfg[]> {
  try {
    const mod: any = await import("@/lib/youtubeChannels");
    const candidates = [mod.YT_CHANNELS, mod.YTChannels, mod.channels, mod.default].filter(
      (x) => Array.isArray(x)
    );
    if (candidates.length === 0) {
      console.warn(
        "youtube/route.ts: No channel array export found in lib/youtubeChannels.ts. Expected one of: default, YT_CHANNELS, YTChannels, channels."
      );
      return [];
    }
    const arr = candidates[0] as any[];
    return arr
      .map((c) => ({
        label: String(c.label ?? c.name ?? "YouTube"),
        handle: c.handle ? String(c.handle).replace(/^@/, "") : undefined,
        channelId: c.channelId ? String(c.channelId) : undefined,
        active: typeof c.active === "boolean" ? c.active : true,
      }))
      .filter((c) => c.label && c.active !== false);
  } catch (e) {
    console.warn("youtube/route.ts: failed to import lib/youtubeChannels.ts:", (e as any)?.message || e);
    return [];
  }
}

/**
 * YouTube helpers
 */
async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`${r.status} ${r.statusText} :: ${txt.slice(0, 200)}`);
  }
  return (await r.json()) as T;
}

// Resolve @handle → UC... channelId
async function resolveChannelIdFromHandle(handle: string): Promise<string | null> {
  try {
    const url = `${API}/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${API_KEY}`;
    const json = await fetchJSON<any>(url);
    return json?.items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

// search.list inside a channel (expensive vs uploads playlist, but fine for interactive queries)
async function searchInChannel(
  channelId: string,
  query: string,
  maxResults = 6
): Promise<CachedVideo[]> {
  const url = `${API}/search?part=snippet&channelId=${encodeURIComponent(
    channelId
  )}&q=${encodeURIComponent(
    query
  )}&type=video&maxResults=${maxResults}&videoEmbeddable=true&order=relevance&key=${API_KEY}`;
  const json = await fetchJSON<any>(url);
  const items = (json.items || []) as any[];
  return items
    .map((it) => ({
      videoId: it?.id?.videoId,
      channelId: it?.snippet?.channelId,
      channelTitle: it?.snippet?.channelTitle,
      title: it?.snippet?.title,
      publishedAt: it?.snippet?.publishedAt,
    }))
    .filter((v) => !!v.videoId);
}

/**
 * Route handler with debug “reasons”
 */
export async function GET(req: NextRequest) {
  const reasons: string[] = [];
  const why = (msg: string) => reasons.push(msg);

  if (!API_KEY) {
    why("Missing YOUTUBE_API_KEY");
    return jsonWithReasons({ items: [], cached: false, reasons }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  // --- DEBUG HANDLING ---
  // Show debug if ?debug=1 OR always when running in development mode
  const AUTO_DEBUG = (process.env.NEXT_PUBLIC_APP_ENV || "").toLowerCase() === "development";
  const debugParam = (searchParams.get("debug") || "").toLowerCase() === "1";
  const wantDebug = AUTO_DEBUG || debugParam;

  // Helper to return JSON with debug reasons and header
  function jsonWithReasons(body: any, status = 200) {
    const payload = wantDebug ? body : { ...body, reasons: undefined };
    const headers: HeadersInit = {};
    if (wantDebug && Array.isArray(body?.reasons)) {
      headers["X-Debug-Reasons"] = JSON.stringify(body.reasons.slice(0, 50));
    }
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "content-type": "application/json; charset=utf-8", ...headers }
    });
  }

  const debug = (searchParams.get("debug") || "").toLowerCase() === "1";

  // Accept artist/title OR q=
  let artist = searchParams.get("artist") || "";
  let title = searchParams.get("title") || "";
  const qParam = searchParams.get("q") || "";

  if (!artist && !title && qParam) {
    // Try to split "Artist - Title" patterns, else treat whole q as the title
    const q = qParam.trim();
    const parts = q.split(/\s+-\s+|–|—|:/);
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" ").trim();
      why(`Parsed q= into artist="${artist}" title="${title}"`);
    } else {
      title = q;
      why(`Using q= as title only: "${title}"`);
    }
  }

  const query = [artist, title].filter(Boolean).join(" ").trim();
  if (!query) {
    why("Empty query (no artist/title/q provided)");
    return jsonWithReasons({ items: [], cached: false, reasons: debug ? reasons : undefined });
  }

  // 1) Cache-first (quota-free)
  const cached = loadAllCachedVideos();
  if (cached.length > 0) {
    const hits = filterCachedByQuery(cached, artist, title);
    if (hits.length > 0) {
      why(`Cache hit: ${hits.length} items matched`);
      const items = hits.slice(0, 40).map(toClientItem);
      return jsonWithReasons({ items, cached: true, reasons: debug ? reasons : undefined });
    }
    why("Cache miss (no cached titles matched tokens)");
  } else {
    why("Cache is empty (no .cache/youtube/*.json files)");
  }

  // 2) Load configured channels (works with default/YT_CHANNELS/YTChannels/channels)
  const allChannels = await loadChannels();
  if (allChannels.length === 0) {
    why("No channels configured in lib/youtubeChannels.ts");
    return jsonWithReasons({ items: [], cached: false, reasons: debug ? reasons : undefined });
  }

  const channels = allChannels.slice(0, MAX_CHANNELS);
  why(`Scanning up to ${channels.length} channel(s)`);

  // Resolve any missing channelIds from handles
  const withIds = await Promise.all(
    channels.map(async (c) => {
      let cid = c.channelId || null;
      if (!cid && c.handle) cid = await resolveChannelIdFromHandle(c.handle);
      if (!cid) why(`Could not resolve channelId for "${c.label}"`);
      return { ...c, channelId: cid || c.channelId || null };
    })
  );

  const valid = withIds.filter((c) => !!c.channelId) as Array<
    typeof withIds[number] & { channelId: string }
  >;
  if (valid.length === 0) {
    why("No valid channelIds after resolution");
    return jsonWithReasons({ items: [], cached: false, reasons: debug ? reasons : undefined });
  }

  // Live search across channels
  const perChannel = 6; // raise/lower as needed
  let live: CachedVideo[] = [];

  await Promise.all(
    valid.map(async (c) => {
      try {
        const found = await searchInChannel(c.channelId, query, perChannel);
        if (found.length === 0) why(`No live results in ${c.label}`);
        live.push(...found.map((v) => ({ ...v, channelTitle: v.channelTitle || c.label })));

        // OPTIONAL: append to per-channel cache (merge by videoId)
        if (found.length > 0) {
          const file = path.join(ensureCacheDir(), `${c.channelId}.json`);
          const existing: CachedVideo[] = readJSON(file) ?? [];
          const byId = new Map<string, CachedVideo>();
          for (const v of existing) byId.set(v.videoId, v);
          for (const v of found) byId.set(v.videoId, v);
          const merged = Array.from(byId.values());
          fs.writeFileSync(file, JSON.stringify(merged, null, 2), "utf8");
        }
      } catch (e: any) {
        why(`API error for ${c.label}: ${e?.message || String(e)}`);
      }
    })
  );

  if (live.length > 0) {
    // Deduplicate by videoId and cap
    const seen = new Set<string>();
    const deduped = live.filter((v) => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });
    const items = deduped.slice(0, 40).map(toClientItem);
    return jsonWithReasons({ items, cached: false, reasons: debug ? reasons : undefined });
  }

  why("No results after live search");
  return jsonWithReasons({ items: [], cached: false, reasons: debug ? reasons : undefined });
}

