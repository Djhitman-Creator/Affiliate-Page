// app/api/admin/refresh/partytyme/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/db";
import { ensureSqliteTables } from "@/lib/ensureSchema";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { upsertTrack } from "@/lib/importers";

// ---------- helpers ----------
const norm = (s: any) => String(s ?? "").trim().replace(/\s+/g, " ");
const pick = (row: Record<string, any>, names: string[]) => {
  for (const n of names) {
    if (row[n] != null && String(row[n]).trim() !== "") return String(row[n]);
  }
  return "";
};

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

const authorized = (req: Request) => {
  const need = (process.env.PT_IMPORT_SECRET || "").trim();
  if (!need) return true;
  const u = new URL(req.url);
  const got = u.searchParams.get("secret") || req.headers.get("x-pt-secret") || "";
  return need && got === need;
};

// Extract disc ID from various possible fields
function extractDiscId(row: Record<string, any>): string | null {
  const discIdKeys = [
    "DiscID", "discId", "discid", "disc_id",
    "TrackID", "trackId", "trackid", "track_id",
    "ProductCode", "productCode", "product_code",
    "SKU", "sku", "Sku",
    "ItemNumber", "itemNumber", "item_number",
    "Code", "code"
  ];
  
  for (const key of discIdKeys) {
    const value = row[key];
    if (value && /^P[HY]\d+$/i.test(String(value))) {
      return String(value).toUpperCase();
    }
  }
  
  // Check in all string values for PH/PY pattern
  for (const value of Object.values(row)) {
    if (typeof value === 'string') {
      const match = value.match(/\bP[HY]\d{3,6}\b/i);
      if (match) return match[0].toUpperCase();
    }
  }
  
  return null;
}

// Determine brand based on disc ID
function getBrandFromDiscId(discId: string | null): string {
  if (!discId) return "Party Tyme";
  if (discId.startsWith("PH")) return "Party Tyme HD";
  if (discId.startsWith("PY")) return "Party Tyme Karaoke";
  return "Party Tyme";
}

// Build proper Party Tyme URL
function buildPartyTymeUrl(discId: string | null, artist: string, title: string): string {
  if (discId && /^P[HY]\d+$/i.test(discId)) {
    // Direct product URL using disc ID
    return `https://www.partytyme.net/songshop/cat/search/item/${discId.toUpperCase()}?merchant=${PT_MERCHANT}`;
  }
  // Fallback to search URL
  const q = [artist, title].filter(Boolean).join(" ");
  return `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(q)}`;
}

// Normalize rows from CSV or XML
type RawRow = { Artist?: string; Title?: string; URL?: string; [k: string]: any };
type FetchResult = { rows: RawRow[]; info: Record<string, any> };

// --- XML utilities: flexible song extraction ---
const ARTIST_KEYS = [
  "Artist","artist","Author","author","Singer","singer","Performer","performer","Band","band","Composer","composer"
];
const TITLE_KEYS = [
  "Title","title","Song","song","SongTitle","songTitle","Track","track","Name","name"
];

/** returns first non-empty string field from a set of keys */
function getField(obj: any, keys: string[]): string {
  for (const k of keys) {
    if (obj && typeof obj === "object") {
      if (obj[k] != null && String(obj[k]).trim() !== "") return String(obj[k]).trim();
      if (obj?.attributes && obj.attributes[k] != null) {
        const v = String(obj.attributes[k]).trim();
        if (v) return v;
      }
      if (obj[k] && typeof obj[k] === "object" && obj[k]["#text"]) {
        const v = String(obj[k]["#text"]).trim();
        if (v) return v;
      }
    }
  }
  return "";
}

/** heuristic: does node look like a song row? */
function looksLikeSong(node: any): boolean {
  if (!node || typeof node !== "object") return false;
  const a = getField(node, ARTIST_KEYS);
  const t = getField(node, TITLE_KEYS);
  return !!(a && t);
}

/** recursively walk any XML-shaped JS object and collect song-like nodes */
function extractRowsFromXml(xml: any, info: Record<string, any>): RawRow[] {
  const rows: RawRow[] = [];
  const seenShapes = new Map<string, number>();

  function recordShape(obj: any) {
    if (!obj || typeof obj !== "object") return;
    const keys = Object.keys(obj).slice(0, 30).sort();
    const sig = keys.join(",");
    seenShapes.set(sig, (seenShapes.get(sig) || 0) + 1);
  }

  function visit(node: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object") return;

    recordShape(node);

    // If it looks like a song, extract ALL fields (including disc ID)
    if (looksLikeSong(node)) {
      const Artist = getField(node, ARTIST_KEYS);
      const Title = getField(node, TITLE_KEYS);
      // Include the entire node so we can extract disc ID
      rows.push({ Artist, Title, ...node });
      // don't return; siblings may also contain nested additional data
    }

    // Keep drilling down
    for (const k of Object.keys(node)) {
      const v = (node as any)[k];
      if (v && (typeof v === "object" || Array.isArray(v))) visit(v);
    }
  }

  visit(xml);

  info.xmlShapes = Array.from(seenShapes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sig, count]) => ({ count, keys: sig.split(",") }));

  info.xmlExtracted = rows.length;
  return rows;
}

// Fetch Party Tyme catalog
async function fetchPartyTymeRows(
  baseUrlCsv?: string,
  baseUrlZip?: string,
  headers?: Record<string, string>
): Promise<FetchResult> {
  const info: Record<string, any> = {};
  const hdrs: Record<string, string> = { ...(headers || {}), "cache-control": "no-store" };

  // 1) CSV direct
  if (baseUrlCsv) {
    const res = await fetch(baseUrlCsv, { cache: "no-store", headers: hdrs });
    info.csv = {
      url: baseUrlCsv,
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type") || null,
    };
    const body = await res.text();
    info.csv.sample = body.slice(0, 400);
    if (res.ok) {
      const parsed = Papa.parse(body, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => (h || "").trim(),
      });
      const rows = (Array.isArray(parsed.data) ? (parsed.data as any[]) : []) as RawRow[];
      info.csv.rowCount = rows.length;
      if (rows.length > 0) return { rows, info };
    }
  }

  // 2) ZIP fallback
  if (baseUrlZip) {
    const res = await fetch(baseUrlZip, { cache: "no-store", headers: hdrs });
    info.zip = {
      url: baseUrlZip,
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type") || null,
    };
    if (!res.ok) throw new Error(`ZIP download failed ${res.status} ${res.statusText}`);

    const buf = Buffer.from(await res.arrayBuffer());
    const zip = new AdmZip(buf);
    const entries: any[] = zip.getEntries() as any[];
    info.zip.entries = entries.map((e: any) => e.entryName);

    // 2a) Prefer CSV inside ZIP
    const csvEntry = entries.find((e: any) => /\.csv$/i.test(e.entryName));
    if (csvEntry) {
      const csvText = csvEntry.getData().toString("utf8");
      info.zip.csvSample = csvText.slice(0, 400);
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => (h || "").trim(),
      });
      const rows = (Array.isArray(parsed.data) ? (parsed.data as any[]) : []) as RawRow[];
      info.zip.csvRowCount = rows.length;
      if (rows.length > 0) return { rows, info };
    }

    // 2b) Otherwise XML inside ZIP
    const xmlEntry = entries.find((e: any) => /\.xml$/i.test(e.entryName));
    if (xmlEntry) {
      const xmlText = xmlEntry.getData().toString("utf8");
      info.zip.xmlSample = xmlText.slice(0, 400);
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        textNodeName: "#text",
      });
      const xml: any = parser.parse(xmlText);
      const rows = extractRowsFromXml(xml, info);
      if (rows.length > 0) return { rows, info };
      throw new Error("ZIP XML parsed but no song-like nodes were found.");
    }

    throw new Error("ZIP contained no parsable CSV or XML data.");
  }

  throw new Error("No valid Party Tyme data source.");
}

// ---------- handlers ----------
export async function POST(req: Request) {
  try {
    await ensureSqliteTables();

    if (!authorized(req)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const csvUrl = (process.env.PARTYTYME_CSV_URL || "").trim() || undefined;
    const zipUrl = (process.env.PARTYTYME_ZIP_URL || "").trim() || undefined;

    if (!csvUrl && !zipUrl) {
      return NextResponse.json(
        { ok: false, error: "Set PARTYTYME_CSV_URL or PARTYTYME_ZIP_URL" },
        { status: 400 }
      );
    }

    const site = new URL(req.url);
    const baseOrigin = `${site.protocol}//${site.host}`;
    const headers: Record<string, string> = {
      Referer: baseOrigin,
      Origin: baseOrigin,
      "User-Agent": "PT-Importer/1.0",
    };

    const { rows, info } = await fetchPartyTymeRows(csvUrl, zipUrl, headers);

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "2000");
    const skip = Number(searchParams.get("skip") || "0");
    const wantDebug = (searchParams.get("debug") || "") === "1";

    const slice = rows.slice(skip, skip + limit);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const raw of slice) {
      const artist = norm(pick(raw, ["Artist", "artist", "ARTIST", "Author", "author", "Singer", "singer"]));
      const title = norm(pick(raw, ["Title", "title", "Song", "SongTitle", "song", "Track", "Name", "name"]));
      
      if (!artist || !title) {
        skipped++;
        continue;
      }

      // Extract disc ID and determine brand
      const discId = extractDiscId(raw);
      const brand = getBrandFromDiscId(discId);
      const purchaseUrl = buildPartyTymeUrl(discId, artist, title);

      // Use the proper upsertTrack function that handles HD/Regular separately
      const result = await upsertTrack({
        source: "Party Tyme",
        artist,
        title,
        trackId: discId,
        brand,
        purchaseUrl
      });

      if (result === "added") added++;
      else if (result === "updated") updated++;
      else skipped++;
    }

    const count = await prisma.track.count();
    
    // Count HD vs Regular
    const hdCount = await prisma.track.count({
      where: { brand: "Party Tyme HD" }
    });
    const regularCount = await prisma.track.count({
      where: { brand: "Party Tyme Karaoke" }
    });

    return NextResponse.json({
      ok: true,
      stats: {
        sourceCsv: !!csvUrl,
        sourceZip: !!zipUrl,
        totalRows: rows.length,
        processed: slice.length,
        added,
        updated,
        skipped,
        dbCount: count,
        hdCount,
        regularCount
      },
      ...(wantDebug ? { debug: info } : {}),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

// Allow GET from browser address bar
export async function GET(req: Request) {
  return POST(req);
}
