/* eslint-disable no-console */
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { YT_CHANNELS } from "@/lib/youtubeChannels";

export const runtime = "nodejs";
const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY || "";
const MAX_PER_CHANNEL = Math.max(50, Number(process.env.YT_INDEX_MAX || 300));
const SECRET = process.env.YT_WARM_SECRET || "";
const DAILY_COUNT = Math.max(1, Number(process.env.YT_WARM_DAILY_CHANNELS || 12));

function ensureCacheDir() {
  const d = path.resolve(".cache/youtube");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function writeChannelCache(channelId: string, videos: any[]) {
  const file = path.join(ensureCacheDir(), `${channelId}.json`);
  let existing: any[] = [];
  if (fs.existsSync(file)) {
    try { existing = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
  }
  const seen = new Set(existing.map(v => v.videoId));
  for (const v of videos) if (!seen.has(v.videoId)) existing.push(v);
  fs.writeFileSync(file, JSON.stringify(existing, null, 2), "utf8");
}

async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  const body = await r.text();
  if (!r.ok) {
    // include a short snippet of Google’s JSON error so we can see the real reason
    throw new Error(`${r.status} ${r.statusText} :: ${body.slice(0, 300)}`);
  }
  return JSON.parse(body) as T;
}


async function resolveChannelId(handleOrId?: string): Promise<string | null> {
  if (!handleOrId) return null;
  if (handleOrId.startsWith("UC")) return handleOrId;
  const url = `${API}/channels?part=id&forHandle=${encodeURIComponent(handleOrId)}&key=${KEY}`;
  const json = await fetchJSON<any>(url);
  return json?.items?.[0]?.id ?? null;
}

async function getUploadsPlaylistId(channelId: string): Promise<string | null> {
  const url = `${API}/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${KEY}`;
  const json = await fetchJSON<any>(url);
  return json?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

async function listPlaylistItems(playlistId: string, max: number) {
  const out: any[] = [];
  let next: string | undefined;
  while (out.length < max) {
    const remain = Math.min(50, max - out.length);
    const url = `${API}/playlistItems?part=snippet&maxResults=${remain}&playlistId=${encodeURIComponent(playlistId)}${next ? `&pageToken=${next}` : ""}&key=${KEY}`;
    const json = await fetchJSON<any>(url);
    const items = (json.items || []).map((it: any) => ({
      videoId: it?.snippet?.resourceId?.videoId,
      channelId: it?.snippet?.channelId,
      channelTitle: it?.snippet?.channelTitle,
      title: it?.snippet?.title,
      publishedAt: it?.snippet?.publishedAt,
    })).filter((v: any) => v.videoId);
    out.push(...items);
    next = json.nextPageToken;
    if (!next) break;
  }
  return out;
}

export async function GET(req: NextRequest) {
  if (!KEY) return Response.json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const s = searchParams.get("secret") || "";
  if (!SECRET || s !== SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dir = ensureCacheDir();
  const manifestFile = path.join(dir, "_manifest.json");

  // --- Determine where to start ---
  let startIndex = 0;
  try {
    if (fs.existsSync(manifestFile)) {
      const prev = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
      startIndex = Number(prev?.nextIndex || 0);
    }
  } catch { startIndex = 0; }

  const limitParam = Number(searchParams.get("limit") || "");
  const startParam = Number(searchParams.get("start") || "");
  const count = Math.max(1, Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DAILY_COUNT);
  const start = Number.isFinite(startParam) && startParam >= 0 ? startParam % YT_CHANNELS.length : startIndex;

  // --- Pick channels for this round ---
  const selected: typeof YT_CHANNELS = [];
  for (let i = 0; i < Math.min(count, YT_CHANNELS.length); i++) {
    selected.push(YT_CHANNELS[(start + i) % YT_CHANNELS.length]);
  }

  // --- Warm only selected channels ---
  const summary: any[] = [];
  for (const ch of selected) {
    try {
      const id = ch.channelId || await resolveChannelId(ch.handle?.replace(/^@/, ""));
      if (!id) { summary.push({ label: ch.label, status: "skip (no id)" }); continue; }
      const uploads = await getUploadsPlaylistId(id);
      if (!uploads) { summary.push({ label: ch.label, channelId: id, status: "no uploads playlist" }); continue; }
      const vids = await listPlaylistItems(uploads, MAX_PER_CHANNEL);
      writeChannelCache(id, vids);
      summary.push({ label: ch.label, channelId: id, added: vids.length });
      console.log(`✓ ${ch.label} (${id}) → +${vids.length}`);
    } catch (e: any) {
      summary.push({ label: ch.label, error: e?.message || String(e) });
      console.warn(`! ${ch.label} failed:`, e?.message || e);
    }
  }

  // --- Save manifest so next run resumes later ---
  const nextIndex = (start + selected.length) % YT_CHANNELS.length;
  fs.writeFileSync(
    manifestFile,
    JSON.stringify({ ranAt: new Date().toISOString(), summary, nextIndex, totalChannels: YT_CHANNELS.length }, null, 2),
    "utf8"
  );

  return Response.json({ ok: true, warmed: selected.map(c => c.label), nextIndex, summary });
}
