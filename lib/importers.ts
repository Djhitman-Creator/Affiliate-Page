// lib/importers.ts
import Papa from "papaparse";
import prisma from "@/lib/prisma";

export type Affiliate = "Karaoke Version" | "Party Tyme";

type RawRow = Record<string, any>;
type UpsertResult = { added: number; updated: number; skipped: number };
// ---- Party Tyme helpers ----
const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

function withMerchant(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(String(url));
    if (!u.searchParams.has("merchant")) u.searchParams.set("merchant", PT_MERCHANT);
    return u.toString();
  } catch {
    const s = String(url);
    return s.includes("?") ? `${s}&merchant=${PT_MERCHANT}` : `${s}?merchant=${PT_MERCHANT}`;
  }
}

/** Try hard to extract a Party Tyme code like PY22138 from any raw field */
function extractPtTrackId(raw: Record<string, any>): string | null {
  const keys = [
    "trackId","TrackId","id","Id","ID",
    "code","Code","productCode","ProductCode",
    "sku","SKU","item","Item","itemNumber","ItemNumber",
    "catalog","Catalog","catalogNumber","CatalogNumber",
    "number","Number","no","No"
  ];

  const candidates: string[] = [];

  for (const k of keys) {
    const v = (raw as any)?.[k];
    if (v != null && v !== "") candidates.push(String(v));
  }
  // scan all string fields too
  for (const v of Object.values(raw)) {
    if (typeof v === "string") candidates.push(v);
  }

  for (const s of candidates) {
    const m = s.match(/py\d{3,6}/i);
    if (m) return m[0].toUpperCase();
  }
  return null;
}

/** Build a Party Tyme product URL from raw data or a discovered trackId */
function buildPartyTymeUrl(raw: Record<string, any>): string | null {
  const direct =
    raw.purchaseUrl || raw.productUrl || raw.link || raw.url || null;
  if (direct) return withMerchant(String(direct));

  const tid = extractPtTrackId(raw);
  if (tid) return withMerchant(`https://www.partytyme.net/songshop/cat/search/item/${tid}`);
  return null;
}

/** Safe brand detection for Party Tyme */
function normalizePtBrand(raw: Record<string, any>): string {
  const parts = [
    raw.Brand, raw.brand, raw.Label, raw.label, raw.Category, raw.category,
    raw.Format, raw.format, raw.Description, raw.description
  ].map(v => (typeof v === "string" ? v.toLowerCase() : "")).join(" ");

  const title = String(raw.Title ?? raw.title ?? "").toLowerCase();

  if (parts.includes("hd") || /\bhd\b/.test(title) || /\(hd\)/.test(title)) return "Party Tyme HD";
  return "Party Tyme Karaoke";
}

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

/** Upsert a single track with consistent dedupe rules. */
/** Safely coerce any value to a trimmed string or null */
function toText(v: any): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" || typeof v === "boolean") return String(v).trim() || null;
  if (Array.isArray(v)) return toText(v[0]);
  if (typeof v === "object") {
    for (const key of ["#text", "_", "value", "text"]) {
      if ((v as any)[key] != null) return toText((v as any)[key]);
    }
    try {
      const s = (v as any).toString ? (v as any).toString() : JSON.stringify(v);
      return String(s).trim() || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Upsert a single track with dedupe rules:
 * - Prefer unique composite (source, trackId) when trackId is present.
 * - Fallback to (source + artist + title) when there's no trackId.
 */
type UpsertOutcome = "added" | "updated" | "skipped";

// Replace your entire upsertTrack with this version:

export async function upsertTrack(input: {
  source: string;                 // "Party Tyme" | "Karaoke Version"
  artist?: any;                   // may come as number, we sanitize
  title?: any;                    // may come as number, we sanitize
  trackId?: any;                  // may come as number, we sanitize
  brand?: any;                    // may come as number, we sanitize
  purchaseUrl?: any;              // may come as non-string, we sanitize
}): Promise<UpsertOutcome> {
  const asStr = (v: any): string | null => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  };

  const source = asStr(input.source) ?? "Unknown";
  const artist = asStr(input.artist);
  const title  = asStr(input.title);
  const trackId = asStr(input.trackId);
  const brand = asStr(input.brand);
  const purchaseUrl = asStr(input.purchaseUrl);

  // Skip unusable rows
  if (!artist || !title) return "skipped";

  // If we have a trackId, prefer (source + trackId)
  if (trackId) {
    // Upgrade any legacy row with same (source+artist+title) but null trackId
    const orphan = await prisma.track.findFirst({
      where: { source, artist, title, trackId: null },
      select: { id: true },
    });
    if (orphan) {
      await prisma.track.update({
        where: { id: orphan.id },
        data: {
          trackId,
          artist,
          title,
          brand: brand ?? null,
          purchaseUrl: purchaseUrl ?? null,
        },
      });
      return "updated";
    }

    // Normal upsert by composite key
    const existing = await prisma.track.findUnique({
      where: { source_trackId: { source, trackId } },
      select: { id: true },
    });

    await prisma.track.upsert({
      where: { source_trackId: { source, trackId } },
      create: {
        source,
        artist,
        title,
        trackId,
        brand: brand ?? null,
        purchaseUrl: purchaseUrl ?? null,
      },
      update: {
        artist,
        title,
        brand: brand ?? null,
        purchaseUrl: purchaseUrl ?? null,
      },
    });

    return existing ? "updated" : "added";
  }

  // No trackId → fallback to (source + artist + title)
  const existingByTitle = await prisma.track.findFirst({
    where: { source, artist, title },
    select: { id: true },
  });

  if (existingByTitle) {
    await prisma.track.update({
      where: { id: existingByTitle.id },
      data: {
        brand: brand ?? null,
        purchaseUrl: purchaseUrl ?? null,
      },
    });
    return "updated";
  }

  await prisma.track.create({
    data: {
      source,
      artist,
      title,
      brand: brand ?? null,
      purchaseUrl: purchaseUrl ?? null,
      trackId: null,
    },
  });

  return "added";
}



/** Normalize common CSV headers into our row shape. */
function normalizeRowFromCsv(r: RawRow) {
  return {
    artist: r["Artist"] ?? r["artist"] ?? r["ARTIST"],
    title: r["Title"] ?? r["title"] ?? r["TITLE"],
    trackId:
      r["TrackID"] ??
      r["trackId"] ??
      r["TRACKID"] ??
      r["ID"] ??
      r["id"] ??
      r["Sku"] ??
      r["SKU"] ??
      null,
    brand: r["Brand"] ?? r["brand"] ?? r["BRAND"] ?? null,
    purchaseUrl:
      r["View/Purchase"] ??
      r["purchaseUrl"] ??
      r["URL"] ??
      r["Url"] ??
      r["link"] ??
      null,
  };
}

/** Normalize likely Party Tyme XML nodes into our row shape. */
function normalizeRowFromXml(n: any) {
  return {
    artist:
      n?.artist ??
      n?.Artist ??
      n?.singer ??
      n?.Singer ??
      n?.ARTIST ??
      null,
    title:
      n?.title ??
      n?.Title ??
      n?.song ??
      n?.Song ??
      n?.TITLE ??
      null,
    trackId: n?.trackId ?? n?.TrackID ?? n?.id ?? n?.ID ?? null,
    brand: "Party Tyme",
    purchaseUrl: n?.url ?? n?.URL ?? n?.link ?? null,
  };
}

/** Load adm-zip whether the package resolves as ESM default or CJS. */
async function loadAdmZip() {
  try {
    const mod: any = await import("adm-zip"); // ESM path
    return mod.default ?? mod;
  } catch {
    const { createRequire } = await import("module"); // CJS fallback
    const require = createRequire(import.meta.url);
    return require("adm-zip");
  }
}

// ---------------------------------------------------------
// CSV Importer
// ---------------------------------------------------------

export async function importCsv(
  source: Affiliate,
  csvText: string
): Promise<UpsertResult & { parsed: number }> {
  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = (parsed.data || []) as RawRow[];

  let added = 0,
    updated = 0,
    skipped = 0;

  for (const raw of rows) {
    const row = normalizeRowFromCsv(raw);
    const res = await upsertTrack({
      source,
      artist: row.artist,
      title: row.title,
      trackId: row.trackId ? String(row.trackId) : null,
      brand: normalizePtBrand(row),
      purchaseUrl: buildPartyTymeUrl(row),

    });
    if (res === "added") added++;
    else if (res === "updated") updated++;
    else skipped++;
  }

  return { added, updated, skipped, parsed: rows.length };
}

// ---------------------------------------------------------
// ZIP Importer (Party Tyme)
// ---------------------------------------------------------

/**
 * Download a ZIP, parse any .xml/.csv inside, and import tracks.
 * Returns counts + file list for the Admin status panel.
 */
export async function importPartyTymeZip(
  zipUrl: string
): Promise<UpsertResult & { filesParsed: string[]; parsedRows: number }> {
  const resp = await fetch(zipUrl);
  if (!resp.ok)
    throw new Error(`Failed to download ZIP: ${resp.status} ${resp.statusText}`);

  const buf = Buffer.from(await resp.arrayBuffer());

  // adm-zip (no aws-sdk / s3 deps)
  const AdmZip = await loadAdmZip();
  const zip = new AdmZip(buf);

  const { XMLParser } = await import("fast-xml-parser");

  let added = 0,
    updated = 0,
    skipped = 0,
    parsedRows = 0;

  const filesParsed: string[] = [];

  // --- parsers ---
  function parseCsv(text: string) {
    const p = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
    const list = (p.data || []) as RawRow[];
    return list.map(normalizeRowFromCsv);
  }

  function parseXml(text: string) {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    const xml = parser.parse(text);

    const candidateLists: any[] = [];
    const maybeArrays = [
      xml?.catalog?.track,
      xml?.catalog?.item,
      xml?.tracks?.track,
      xml?.items?.item,
      xml?.tracklist?.track,
      xml?.songshop?.track,
      xml?.songshop?.item,
    ].filter(Boolean);

    for (const cand of maybeArrays) {
      if (Array.isArray(cand)) candidateLists.push(...cand);
      else candidateLists.push(cand);
    }

    if (candidateLists.length === 0) {
      // heuristic fallback: walk object to find arrays of objects
      const allArrays: any[] = [];
      const stack = [xml];
      while (stack.length) {
        const node: any = stack.pop();
        if (!node || typeof node !== "object") continue;
        for (const k of Object.keys(node)) {
          const v = node[k];
          if (Array.isArray(v) && v.length && typeof v[0] === "object") {
            allArrays.push(...v);
          } else if (v && typeof v === "object") {
            stack.push(v);
          }
        }
      }
      if (allArrays.length) candidateLists.push(...allArrays);
    }

    return candidateLists.map(normalizeRowFromXml);
  }

  // --- iterate files in ZIP ---
  const entries = zip.getEntries();

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName || "";
    const lower = name.toLowerCase();
    if (!lower.endsWith(".xml") && !lower.endsWith(".csv")) continue;

    const contentBuf: Buffer = entry.getData();
    const text = contentBuf.toString("utf-8");
    filesParsed.push(name);

    let rows: Array<{
      artist?: string | null;
      title?: string | null;
      trackId?: string | null;
      brand?: string | null;
      purchaseUrl?: string | null;
    }> = [];

    if (lower.endsWith(".csv")) rows = parseCsv(text);
    if (lower.endsWith(".xml")) rows = parseXml(text);

    parsedRows += rows.length;

    for (const r of rows) {
      const ptId = extractPtTrackId(r);
      const res = await upsertTrack({
        source: "Party Tyme",
        artist: r.artist ?? undefined,
        title: r.title ?? undefined,
        trackId: ptId ?? null,
        brand: normalizePtBrand(r),
        purchaseUrl: buildPartyTymeUrl(r),
      });
      if (res === "added") added++;
      else if (res === "updated") updated++;
      else skipped++;
    }
  }

  return { added, updated, skipped, filesParsed, parsedRows };
}
