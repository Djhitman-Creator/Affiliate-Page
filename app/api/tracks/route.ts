// app/api/tracks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { kvSearchSongs } from "../../../lib/kv";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT ?? "105";

// ======= KV tunables (recall vs speed) =======
const KV_TTL_MS = 10 * 60 * 1000;
const KV_PHRASE_PAGES = 3;
const KV_TOKEN_PAGES = 2;
const KV_PAGE_SIZE = 80;
const KV_HARD_CAP = 600;
// ============================================

// ---------- in-memory KV cache ----------
type KvCacheEntry = { ts: number; items: any[] };
declare global {
  // eslint-disable-next-line no-var
  var __KV_CACHE__: Map<string, KvCacheEntry> | undefined;
}
const KV_CACHE: Map<string, KvCacheEntry> =
  globalThis.__KV_CACHE__ ?? (globalThis.__KV_CACHE__ = new Map());

// ---------- helpers ----------
function norm(s: string | null | undefined) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Word-aware matcher: >=5 whole-word, <5 word-prefix. */
function makeWordMatcher(rawQ: string) {
  const tokens = norm(rawQ).split(/\s+/).filter(Boolean);
  if (!tokens.length) return () => true;

  const regs = tokens.map((t) => {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern =
      t.length >= 5
        ? `(?:^|[^a-z0-9])${esc}(?:$|[^a-z0-9])`
        : `(?:^|[^a-z0-9])${esc}[a-z0-9]*`;
    return new RegExp(pattern, "i");
  });

  return (artist?: string | null, title?: string | null) => {
    const hay = norm(`${artist || ""} ${title || ""}`);
    return regs.every((re) => re.test(hay));
  };
}

/** SQLite-friendly pre-filter for PT (broad; exactness enforced in Node). */
function ptWhereForTokens(tokens: string[]) {
  if (!tokens.length) return { source: "Party Tyme" as const };
  return {
    source: "Party Tyme" as const,
    AND: tokens.map((t) => ({
      OR: [{ artist: { contains: t } }, { title: { contains: t } }],
    })),
  };
}

/** Sort helper honoring sortBy + sortDir with stable secondary keys. */
function makeComparator(sortBy: string, sortDir: string) {
  const dir = sortDir === "desc" ? -1 : 1;
  const cmp = (a: string, b: string) => {
    const A = norm(a), B = norm(b);
    if (A < B) return -1 * dir;
    if (A > B) return 1 * dir;
    return 0;
  };
  return (a: any, b: any) => {
    if (sortBy === "title") {
      const p = cmp(a.title || "", b.title || ""); if (p) return p;
      const s = cmp(a.artist || "", b.artist || ""); if (s) return s;
      return cmp(a.source || "", b.source || "");
    }
    if (sortBy === "source") {
      const p = cmp(a.source || "", b.source || ""); if (p) return p;
      const s = cmp(a.artist || "", b.artist || ""); if (s) return s;
      return cmp(a.title || "", b.title || "");
    }
    const p = cmp(a.artist || "", b.artist || ""); if (p) return p;
    const s = cmp(a.title || "", b.title || ""); if (s) return s;
    return cmp(a.source || "", b.source || "");
  };
}

/** Dedupe by Source|Artist|Title (normalized). */
function dedupe(items: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const it of items) {
    const key = `${norm(it.source)}|${norm(it.artist)}|${norm(it.title)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

/** Extract PT code from trackId/purchaseUrl; supports PY##### & PH#####. */
function extractPtCode(trackId?: string | null, purchaseUrl?: string | null) {
  let code = (trackId || "").toUpperCase().trim();
  if (!/^(P[HY]\d+)$/.test(code) && purchaseUrl) {
    const up = purchaseUrl.toUpperCase();
    const m = up.match(/(?:\/ITEM\/|^|[^A-Z0-9])(P[HY]\d+)/);
    if (m) code = m[1];
  }
  return /^(P[HY]\d+)$/.test(code) ? code : null;
}

/** Final external PT URL (no redirects). Prefer item page; otherwise use the real search.php endpoint. */
function buildPtFinalUrl(
  r: { trackId?: string | null; purchaseUrl?: string | null; artist?: string | null; title?: string | null; },
  q: string
) {
  const code = extractPtCode(r.trackId, r.purchaseUrl);
  if (code) {
    return `https://www.partytyme.net/songshop/cat/search/item/${encodeURIComponent(code)}?merchant=${encodeURIComponent(PT_MERCHANT)}`;
  }

  // Prefer a song-title search when we have a title; otherwise search by artist; otherwise use the raw query.
  const title = (r.title || "").trim();
  const artist = (r.artist || "").trim();
  const keyword = title || artist || q || "karaoke";
  const what = title ? "song_title" : (artist ? "artist" : "song_title");

  const params = new URLSearchParams({
    search_keyword: keyword,
    search_what: what,
    order_by: "artist",
    order_by_direction: "ASC",
    merchant: PT_MERCHANT, // ← add your affiliate merchant id
  });

  return `https://www.partytyme.net/songshop/cat/search.php?${params.toString()}`;
}


/** Normalize Party Tyme brand label based on code/brand text. */
function normalizePtBrand(orig: string | null | undefined, trackId: string | null | undefined, purchaseUrl?: string | null) {
  const code = extractPtCode(trackId || undefined, purchaseUrl || undefined);
  const hasHdWord = (orig || "").toLowerCase().includes("hd");
  if (code?.startsWith("PH") || hasHdWord) return "Party Tyme HD";
  if (code?.startsWith("PY")) return "Party Tyme Karaoke";
  if (orig && orig.trim().length) return orig;
  return "Party Tyme";
}

// ---------- KV helpers with caching ----------
async function kvPullCached(query: string, pages: number, pageSize: number, hardCap: number) {
  const key = `phrase:${norm(query)}:${pages}:${pageSize}`;
  const now = Date.now();
  const hit = KV_CACHE.get(key);
  if (hit && now - hit.ts < KV_TTL_MS) return hit.items;

  const items: any[] = [];
  const seen = new Set<string>();
  for (let p = 0; p < pages; p++) {
    const offset = p * pageSize;
    const chunk = await kvSearchSongs(query, pageSize, offset);
    if (!chunk || !chunk.length) break;
    for (const it of chunk) {
      const k = `${norm("Karaoke Version")}|${norm(it.artist)}|${norm(it.title)}`;
      if (!seen.has(k)) {
        seen.add(k);
        items.push(it);
        if (items.length >= hardCap) break;
      }
    }
    if (items.length >= hardCap || chunk.length < pageSize) break;
  }

  KV_CACHE.set(key, { ts: now, items });
  return items;
}

// ---------- main ----------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    const q = (sp.get("q") || "").trim();
    const page = Math.max(parseInt(sp.get("page") || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(sp.get("pageSize") || "25", 10), 1), 200);
    const sortBy = (sp.get("sortBy") || "artist").toLowerCase();
    const sortDir = (sp.get("sortDir") || "asc").toLowerCase();
    const comparator = makeComparator(sortBy, sortDir);

    if (!q) {
      return NextResponse.json({ items: [], total: 0, page, pageSize, sortBy, sortDir });
    }

    const tokens = norm(q).split(/\s+/).filter(Boolean);
    const matches = makeWordMatcher(q);

    // ---------- Party Tyme ----------
    const ptWhere = ptWhereForTokens(tokens);
    const ptRows = await prisma.track.findMany({
      where: ptWhere,
      orderBy: [{ artist: "asc" }, { title: "asc" }],
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        artist: true,
        title: true,
        brand: true,
        source: true,
        purchaseUrl: true,
        trackId: true,
      },
    });

    const ptItems = ptRows.map((r) => {
      const finalUrl = buildPtFinalUrl(r, q);
      const brand = normalizePtBrand(r.brand, r.trackId, r.purchaseUrl);
      // Expose both the stored brand and a guaranteed display brand
      return {
        ...r,
        brand,                 // normalized label (HD vs Karaoke)
        brandDisplay: brand,   // convenience for UI
        ptCode: extractPtCode(r.trackId, r.purchaseUrl), // helpful for debugging/UI badges
        purchaseUrl: finalUrl, // absolute external URL
        buyUrl: finalUrl,      // alias to be safe with the UI
      };
    });

    // ---------- Karaoke Version ----------
    const kvCandidates: any[] = [];
    const kvAdd = (arr: any[]) => kvCandidates.push(...arr);

    kvAdd(await kvPullCached(q, KV_PHRASE_PAGES, KV_PAGE_SIZE, KV_HARD_CAP));

    const strongTokens = tokens.filter((t) => t.length >= 2);
    if (strongTokens.length > 1) {
      for (const t of strongTokens) {
        kvAdd(await kvPullCached(t, KV_TOKEN_PAGES, KV_PAGE_SIZE, KV_HARD_CAP));
      }
    }

    // ---------- Merge + filter + sort + paginate ----------
    const merged = dedupe([...ptItems, ...kvCandidates]);
    const filtered = merged.filter((it) => matches(it.artist, it.title));
    filtered.sort(comparator);

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      items: paged,
      total: filtered.length,
      page,
      pageSize,
      sortBy,
      sortDir,
      notes: {
        ptFetched: ptItems.length,
        kvPool: kvCandidates.length,
        kvCache: KV_CACHE.size,
        kvTtlMin: KV_TTL_MS / 60000,
      },
    });
  } catch (err: any) {
    console.error("GET /api/tracks error:", err);
    return NextResponse.json(
      { items: [], total: 0, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
