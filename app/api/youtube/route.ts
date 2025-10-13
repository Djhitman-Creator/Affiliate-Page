// app/api/youtube/route.ts
/* eslint-disable no-console */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Small JSON helper that accepts a numeric status, so TS is happy.
 * Usage: return jsonWithReasons({ ok: true }, 200)
 */
function jsonWithReasons<T>(data: T, status = 200) {
  return NextResponse.json(data as any, { status });
}

/**
 * ENV + API constants
 */
const API_KEY = process.env.YOUTUBE_API_KEY || "";
const API = "https://www.googleapis.com/youtube/v3";
const MAX_CHANNELS = Math.max(1, Number(process.env.YOUTUBE_MAX_CHANNELS || 8));

/**
 * Types
 */
type ChannelCfg = {
  label: string;
  handle?: string;     // e.g. "karafun"
  channelId?: string;  // e.g. "UCxxx..."
  active?: boolean;
};

type CachedVideo = {
  videoId: string;
  channelId: string;
  channelTitle?: string;
  title?: string;
  publishedAt?: string;
};

type YouTubeSearchItem = {
  id?: { videoId?: string; kind?: string };
  snippet?: {
    channelId?: string;
    channelTitle?: string;
    title?: string;
    publishedAt?: string;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
  nextPageToken?: string;
  pageInfo?: { totalResults?: number; resultsPerPage?: number };
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

function writeJSON(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // ignore cache write errors
  }
}

function loadAllCachedVideos(): CachedVideo[] {
  const dir = ensureCacheDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
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

  return cached.filter((v) => {
    const T = norm(v.title || "");

    // CASE 1: if no query at all, include everything
    if (queryTokens.length === 0) return true;

    // CASE 2: at least one token must match
    const hasMatch = queryTokens.some((t) => T.includes(t));

    // CASE 3: also include if it contains the word "karaoke"
    const hasKaraoke = T.includes("karaoke");

    return hasMatch || hasKaraoke;
  });
}

function toClientItem(v: CachedVideo) {
  return {
    label: v.channelTitle || "YouTube",
    handle: v.channelId, // we may not know an @handle; channelId is stable
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
    console.warn(
      "youtube/route.ts: failed to import lib/youtubeChannels.ts:",
      (e as any)?.message || e
    );
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

function buildSearchQuery(artist: string, title: string, q: string) {
  const parts = [artist, title, q].map((s) => s.trim()).filter(Boolean);
  // Favor artist + title when both provided
  if (artist && title) return `${artist} ${title} karaoke`;
  // Otherwise combine whatever we have and bias "karaoke"
  const base = parts.join(" ");
  return base ? `${base} karaoke` : "karaoke";
}

async function searchChannelVideos(
  channelId: string,
  q: string,
  maxResults = 10
): Promise<CachedVideo[]> {
  const url =
    `${API}/search?part=snippet&type=video&order=relevance` +
    `&channelId=${encodeURIComponent(channelId)}` +
    `&maxResults=${maxResults}` +
    `&q=${encodeURIComponent(q)}` +
    `&key=${encodeURIComponent(API_KEY)}`;

  const data = await fetchJSON<YouTubeSearchResponse>(url);
  const items = (data.items || []).filter((it) => it.id?.videoId);
  return items.map((it) => ({
    videoId: String(it.id!.videoId!),
    channelId: String(it.snippet?.channelId || ""),
    channelTitle: it.snippet?.channelTitle || "YouTube",
    title: it.snippet?.title || "",
    publishedAt: it.snippet?.publishedAt,
  }));
}

async function searchGeneralVideos(q: string, maxResults = 10): Promise<CachedVideo[]> {
  const url =
    `${API}/search?part=snippet&type=video&order=relevance` +
    `&maxResults=${maxResults}` +
    `&q=${encodeURIComponent(q)}` +
    `&key=${encodeURIComponent(API_KEY)}`;

  const data = await fetchJSON<YouTubeSearchResponse>(url);
  const items = (data.items || []).filter((it) => it.id?.videoId);
  return items.map((it) => ({
    videoId: String(it.id!.videoId!),
    channelId: String(it.snippet?.channelId || ""),
    channelTitle: it.snippet?.channelTitle || "YouTube",
    title: it.snippet?.title || "",
    publishedAt: it.snippet?.publishedAt,
  }));
}

/**
 * API handler
 */
export async function GET(req: NextRequest) {
  const reasons: string[] = [];
  const why = (s: string) => reasons.push(s);

  const { searchParams } = new URL(req.url);
  const artist = (searchParams.get("artist") || "").trim();
  const title = (searchParams.get("title") || "").trim();
  const qParam = (searchParams.get("q") || "").trim();
  const dbOnly = searchParams.get("dbOnly") === "1";

  // 1) Try cached results first (no API quota)
  const cached = loadAllCachedVideos();
  const qForFilterArtist = artist || "";
  const qForFilterTitle = title || qParam || "";
  const cachedHits = filterCachedByQuery(cached, qForFilterArtist, qForFilterTitle);

  if (cachedHits.length > 0) {
    why(`cache: ${cachedHits.length} items`);
    const items = cachedHits.slice(0, 40).map(toClientItem);
    return jsonWithReasons({ items, cached: true, reasons }, 200);
  }

  // 2) If dbOnly=true, return empty without calling the API
  if (dbOnly) {
    why("dbOnly=1, skipping API");
    return jsonWithReasons({ items: [], cached: true, reasons }, 200);
  }

  // 3) If no API key and no cache hits, error out
  if (!API_KEY) {
    why("Missing YOUTUBE_API_KEY");
    return jsonWithReasons({ items: [], cached: false, reasons }, 500);
  }

  // 4) Build search query
  const q = buildSearchQuery(artist, title, qParam);
  why(`query="${q}"`);

  // 5) Load channels list (optional targeting)
  const channels = (await loadChannels()).slice(0, MAX_CHANNELS);
  const out: CachedVideo[] = [];

  if (channels.length > 0) {
    // Search each configured channel by channelId if provided
    for (const ch of channels) {
      const cid = ch.channelId;
      if (!cid) continue;
      try {
        const vids = await searchChannelVideos(cid, q, 10);
        out.push(...vids);
        // cache per-channel results
        const dir = ensureCacheDir();
        const file = path.join(dir, `${cid}.json`);
        writeJSON(file, vids);
      } catch (e: any) {
        why(`channel ${cid} failed: ${e?.message || e}`);
      }
    }
  }

  // 6) If no channel-specific results, do a general search
  if (out.length === 0) {
    try {
      const vids = await searchGeneralVideos(q, 12);
      out.push(...vids);
      // cache a generic bucket
      const dir = ensureCacheDir();
      const file = path.join(dir, `_general.json`);
      writeJSON(file, vids);
    } catch (e: any) {
      why(`general search failed: ${e?.message || e}`);
    }
  }

  const items = out.map(toClientItem);
  return jsonWithReasons({ items, cached: false, reasons }, 200);
}

export async function POST(req: NextRequest) {
  // Mirror GET to simplify client usage
  return GET(req);
}
