// app/api/admin/refresh/partytyme/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/db";
import { ensureSqliteTables } from "@/lib/ensureSchema";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";

// ---------- helpers ----------
const norm = (s: any) => String(s ?? "").trim().replace(/\s+/g, " ");
const pick = (row: Record<string, any>, names: string[]) => {
  for (const n of names) {
    if (row[n] != null && String(row[n]).trim() !== "") return String(row[n]);
  }
  return "";
};
const withMerchant = (url: string | null | undefined, merchant: string) => {
  if (!url) return null;
  try {
    const u = new URL(String(url));
    if (!u.searchParams.has("merchant")) u.searchParams.set("merchant", merchant);
    return u.toString();
  } catch {
    const s = String(url);
    return s.includes("?") ? `${s}&merchant=${merchant}` : `${s}?merchant=${merchant}`;
  }
};
const authorized = (req: Request) => {
  const need = (process.env.PT_IMPORT_SECRET || "").trim();
  if (!need) return true;
  const u = new URL(req.url);
  const got = u.searchParams.get("secret") || req.headers.get("x-pt-secret") || "";
  return need && got === need;
};

// Normalize rows from CSV or XML
type RawRow = { Artist?: string; Title?: string; URL?: string; [k: string]: any };
type FetchResult = { rows: RawRow[]; info: Record<string, any> };

// Try CSV first; if empty/not-OK, try ZIP (CSV inside) else ZIP (XML inside).
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
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
      const xml: any = parser.parse(xmlText);

      const candidates: any[] =
        (xml?.SongList?.Song as any[]) ??
        (xml?.Songs?.Song as any[]) ??
        (xml?.songlist?.song as any[]) ??
        (xml?.songList?.song as any[]) ??
        (xml?.songs?.song as any[]) ??
        [];

      info.zip.xmlNodeCount = Array.isArray(candidates) ? candidates.length : 0;

      if (Array.isArray(candidates) && candidates.length > 0) {
        const rows = candidates.map((n: any) => {
          const Artist =
            n.Artist ?? n.artist ?? n.Author ?? n.author ?? n.Singer ?? n.singer ?? "";
          const Title =
            n.Title ?? n.title ?? n.Song ?? n.song ?? n.SongTitle ?? n.songTitle ?? "";
          const URL =
            n.URL ??
            n.Url ??
            n.url ??
            n.Link ??
            n.link ??
            n.PurchaseURL ??
            n.purchaseUrl ??
            n.Mp3Link ??
            n.mp3Link ??
            "";
        return { Artist, Title, URL } as RawRow;
        });
        return { rows, info };
      }

      throw new Error("ZIP contained XML but structure was unrecognized.");
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

    // Some hosts require Referer/Origin — send our site origin
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
    const merchant = (process.env.PARTYTYME_MERCHANT || "105").trim();

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const raw of slice) {
      const artist = norm(pick(raw, ["Artist", "artist", "ARTIST", "Author", "author", "Singer", "singer"]));
      const title  = norm(pick(raw, ["Title", "title", "Song", "SongTitle", "song", "Track"]));
      const link   = pick(raw, ["URL", "Url", "url", "Link", "PurchaseURL", "purchaseUrl", "Mp3Link", "mp3Link"]);
      if (!artist || !title) { skipped++; continue; }

      const urlWithAff = withMerchant(link || null, merchant);

      const existing = await prisma.track.findFirst({
        where: { AND: [{ artist: { equals: artist } }, { title: { equals: title } }] },
      });

      if (!existing) {
        await prisma.track.create({
          data: { artist, title, brand: "Party Tyme", source: "Party Tyme", url: urlWithAff || undefined } as any,
        });
        added++;
      } else {
        await prisma.track.update({
          where: { id: (existing as any).id },
          data: { url: urlWithAff || (existing as any).url || undefined } as any,
        });
        updated++;
      }
    }

    const count = await prisma.track.count();
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
      },
      ...(wantDebug ? { debug: info } : {}),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

// Allow GET from browser address bar to trigger the same work
export async function GET(req: Request) {
  return POST(req);
}
