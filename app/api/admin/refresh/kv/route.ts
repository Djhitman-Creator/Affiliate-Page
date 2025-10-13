// app/api/admin/refresh/kv/route.ts
import { NextResponse } from "next/server";
import { upsertTrack } from "../../../../../lib/importers";
import * as kv from "../../../../../lib/kv";

// app/api/admin/refresh/kv/route.ts (only replace the picker)
function pickKvFetcher(mod: any) {
  // 1) Try common names
  const candidates = [
    "searchKv", "getKvTracks", "kvSearch", "fetchKv", "kv", "search"
  ];
  for (const name of candidates) {
    if (typeof mod[name] === "function") return mod[name];
  }
  // 2) Otherwise, pick the first exported function that's not kvAffLink
  for (const [key, val] of Object.entries(mod)) {
    if (typeof val === "function" && key !== "kvAffLink") return val as any;
  }
  // 3) Fallback to default export if it’s a function
  if (typeof mod.default === "function") return mod.default as any;
  return null;
}


// Optional: use kvAffLink if the fetcher doesn't supply a purchaseUrl
const kvAffLink: ((artist: string, song: string) => string) | undefined =
  (kv as any).kvAffLink;

function asStr(v: any): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    if (!q) {
      return NextResponse.json({ ok: false, error: "Missing q (artist or search term)" }, { status: 400 });
    }

    const fetchKv: any = pickKvFetcher(kv);
    if (typeof fetchKv !== "function") {
      return NextResponse.json({ ok: false, error: "No KV fetch function exported from lib/kv.ts" }, { status: 500 });
    }

    // Fetch KV data. Most implementations take a single artist/query string.
    const data = await fetchKv(q);

    // Normalize: allow either an array of tracks or an object with a `tracks` array
    const rows: any[] = Array.isArray(data) ? data : Array.isArray((data as any)?.tracks) ? (data as any).tracks : [];

    if (!Array.isArray(rows)) {
      return NextResponse.json({ ok: false, error: "KV fetch didn't return an array" }, { status: 500 });
    }

    let added = 0, updated = 0, skipped = 0;

    for (const it of rows) {
      const artist = asStr((it as any).artist) ?? asStr((it as any).Artist) ?? q;
      const title  = asStr((it as any).title)  ?? asStr((it as any).Title);

      // Prefer a direct URL from the fetcher; otherwise build affiliate link if available
      let purchaseUrl =
        asStr((it as any).purchaseUrl) ??
        asStr((it as any).url) ??
        asStr((it as any).link) ??
        (kvAffLink && artist && title ? kvAffLink(artist, title) : null);

      const trackId = asStr((it as any).trackId) ?? null;

      const res = await upsertTrack({
        source: "Karaoke Version",
        artist,
        title,
        brand: "Karaoke Version",
        trackId,       // KV might not have track codes; it’s fine if null
        purchaseUrl,   // will be set if fetcher provided or kvAffLink built it
      });

      if (res === "added") added++;
      else if (res === "updated") updated++;
      else skipped++;
    }

    return NextResponse.json({ ok: true, q, added, updated, skipped, count: rows.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
