// lib/kv.ts

import { prisma } from "./prisma";

const KV_BASE = (process.env.KV_API_BASE || "https://www.karaoke-version.com/api").replace(/\/+$/, "");
const KV_AFFILIATE_ID = Number(process.env.KV_AFFILIATE_ID || 0);

export type UnifiedKVItem = {
  source: "Karaoke Version";
  artist: string;
  title: string;
  trackId: string | null;
  brand: "Karaoke Version";
  purchaseUrl: string;
  previewUrl?: string;
  imageUrl?: string;
  url?: string;
  createdAt: null;
};

export type KVArtist = { id: number; name: string };
export type KVSong = {
  id: number;
  artistId: number;
  name: string;
  url: string;
  previewUrl?: string;
  imgUrl?: string;
  mp3Count?: number;
  wmvCount?: number;
  cdgCount?: number;
  hasMulti?: boolean;
  multiUrl?: string;
  dateAdded?: string;
};

// ------------------ Affiliate Link Helper ------------------

export function kvAffLink(artist: string, song: string) {
  const params = new URLSearchParams({
    aff: String(KV_AFFILIATE_ID),
    action: "redirect",
    part: "karaoke",
    artist,
    song,
  });
  return `https://www.karaoke-version.com/afflink.html?${params.toString()}`;
}

// ------------------ Artist Lookup ------------------

async function kvListArtists(ids: number[]): Promise<KVArtist[]> {
  if (!ids.length) return [];
  const body = {
    affiliateId: KV_AFFILIATE_ID,
    function: "list",
    parameters: { id: ids },
  };
  const q = encodeURIComponent(JSON.stringify(body));
  const url = `${KV_BASE}/artist/?query=${q}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`KV artist/list ${res.status}`);
  const json = (await res.json()) as { artists?: KVArtist[] };
  return json.artists || [];
}

// ------------------ KV Search ------------------

export async function kvSearchSongs(q: string, limit = 25, offset = 0): Promise<UnifiedKVItem[]> {
  if (!q) return [];

  // Build JSON body for KV search
  const body = {
    affiliateId: KV_AFFILIATE_ID,
    function: "song",
    parameters: {
      query: q,
      limit,
      offset,
    },
  };

  const query = encodeURIComponent(JSON.stringify(body));
  const url = `${KV_BASE}/search/?query=${query}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`KV search ${res.status}`);
  const data: any = await res.json();

  // Debug log (optional)
  // console.log("KV raw response:", JSON.stringify(data, null, 2));

  const songs: KVSong[] = Array.isArray(data.songs) ? data.songs : [];
  if (!songs.length) return [];

  // Lookup artist names by ID
  const artistIds = [...new Set(songs.map((s) => s.artistId))];
  const artists = await kvListArtists(artistIds);
  const byId = new Map(artists.map((a) => [a.id, a.name]));

  // Map into unified items
  return songs.map<UnifiedKVItem>((s) => {
    const artist = byId.get(s.artistId) || q; // fallback to query string if not resolved
    const title = s.name || "";
    return {
      source: "Karaoke Version",
      artist,
      title,
      trackId: String(s.id),
      brand: "Karaoke Version",
     purchaseUrl: (() => {
    let fixedUrl = s.url || kvAffLink(artist, title);
    if (fixedUrl.includes("/mp3-backingtrack/")) {
      fixedUrl = fixedUrl.replace("/mp3-backingtrack/", "/karaoke/");
    }
    return fixedUrl;
  })(),
  previewUrl: s.previewUrl,
  imageUrl: s.imgUrl,
  url: s.url,
  createdAt: null,
};
  });
}

