// app/api/admin/refresh/partytyme/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "../../../../lib/prisma";

const ZIP_URL = process.env.PARTYTYME_ZIP_URL!;
const PT_MERCHANT = process.env.PARTYTYME_MERCHANT ?? "105";

// --- helpers ---
const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();

function extractPtCodes(text: string): string[] {
  const out = new Set<string>();
  const re = /(?:^|[^A-Z0-9])(P[HY]\d{4,7})(?:[^A-Z0-9]|$)/gi;
  let m;
  while ((m = re.exec(text))) out.add(m[1].toUpperCase());
  return [...out];
}

// Try to pluck artist/title from any common key names
function pluck(obj: any, keys: string[]): string | null {
  for (const k of keys) {
    if (obj && obj[k] != null) return String(obj[k]);
  }
  return null;
}

// Recursively walk any JSON-ish object and collect candidate tracks
function walkForTracks(node: any, push: (rec: { artist: string; title: string; codes: string[] }) => void) {
  if (!node || typeof node !== "object") return;

  // If this level looks like a "track" node, try to capture
  const artist = pluck(node, ["artist", "artist_name", "artistName", "singer", "performer", "band"]);
  const title = pluck(node, ["title", "song", "song_name", "songName", "track", "name"]);
  if (artist && title) {
    // Gather all text at/under this node and extract codes
    const allText: string[] = [];
    const gather = (n: any) => {
      if (n == null) return;
      if (typeof n === "string" || typeof n === "number" || typeof n === "boolean") {
        allText.push(String(n));
      } else if (Array.isArray(n)) {
        for (const x of n) gather(x);
      } else if (typeof n === "object") {
        for (const v of Object.values(n)) gather(v);
      }
    };
    gather(node);
    const codes = extractPtCodes(allText.join(" \n "));
    if (codes.length) push({ artist: String(artist), title: String(title), codes });
  }

  // Recurse
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") walkForTracks(v, push);
  }
}

function brandFromCode(code: string) {
  return code.startsWith("PH") ? "Party Tyme HD" : "Party Tyme Karaoke";
}

function urlFromCode(code: string, merchant: string) {
  return `https://www.partytyme.net/songshop/cat/search/item/${encodeURIComponent(
    code
  )}?merchant=${encodeURIComponent(merchant)}`;
}

export async function GET() {
  try {
    if (!ZIP_URL) throw new Error("PARTYTYME_ZIP_URL is not set");

    // 1) Download & unzip
    const resp = await fetch(ZIP_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error(`Failed to fetch ZIP: ${resp.status}`);
    const buf = await resp.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);

    // 2) Parse all XML files found
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      allowBooleanAttributes: true,
    });

    const candidates: Array<{ artist: string; title: string; codes: string[] }> = [];

    const xmlFiles = Object.values(zip.files).filter((f) => f.name.toLowerCase().endsWith(".xml"));
    for (const file of xmlFiles) {
      const xml = await file.async("string");
      const json = parser.parse(xml);
      walkForTracks(json, (rec) => candidates.push(rec));
    }

    // 3) Normalize + dedupe per (artist,title,code)
    type Row = { artist: string; title: string; code: string; brand: string; purchaseUrl: string };
    const keyset = new Set<string>();
    const rows: Row[] = [];
    for (const c of candidates) {
      const artist = c.artist.trim();
      const title = c.title.trim();
      for (const code of c.codes) {
        const k = `${norm(artist)}|${norm(title)}|${code}`;
        if (!keyset.has(k)) {
          keyset.add(k);
          rows.push({
            artist,
            title,
            code,
            brand: brandFromCode(code),
            purchaseUrl: urlFromCode(code, PT_MERCHANT),
          });
        }
      }
    }

    // 4) Replace existing Party Tyme rows
    await prisma.track.deleteMany({ where: { source: "Party Tyme" } });

    // 5) Insert
    const BATCH = 250;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      await prisma.$transaction(
        chunk.map((r) =>
          prisma.track.create({
            data: {
              source: "Party Tyme",
              artist: r.artist,
              title: r.title,
              brand: r.brand,
              trackId: r.code, // <-- CRITICAL: save PY/PH code here
              purchaseUrl: r.purchaseUrl, // direct item URL
            },
          })
        )
      );
    }

    return NextResponse.json({
      status: "ok",
      added: rows.length,
      xmlFiles: xmlFiles.map((f) => f.name),
    });
  } catch (err: any) {
    console.error("PT refresh error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
