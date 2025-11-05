export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

// Helper to normalize strings for consistent grouping
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')         // Multiple spaces to single
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const artist = searchParams.get("artist") || "";
    const title = searchParams.get("title") || "";

    if (!artist && !title) {
      return NextResponse.json({ items: [] });
    }

    // Read and parse CSV
    const csvPath = path.join(process.cwd(), "data", "Legacy_Track_Songbook.csv");
    const csvContent = await fs.readFile(csvPath, "utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Normalize search terms
    const searchArtist = normalize(artist);
    const searchTitle = normalize(title);

    // Group by NORMALIZED artist-title and collect ALL matching discs
    const grouped = new Map();

    records.forEach((record: any) => {
      const recordArtist = normalize(record.ARTIST || '');
      const recordTitle = normalize(record.SONG || '');

      // Check if this record matches the search
      const matchArtist = !searchArtist || recordArtist.includes(searchArtist) || searchArtist.includes(recordArtist);
      const matchTitle = !searchTitle || recordTitle.includes(searchTitle) || searchTitle.includes(recordTitle);
      
      if (matchArtist && matchTitle) {
        // Remove ALL spaces and special characters for the key
        const cleanArtist = (record.ARTIST || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanSong = (record.SONG || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const key = `${cleanArtist}|${cleanSong}`;

        if (!grouped.has(key)) {
          grouped.set(key, {
            artist: record.ARTIST,
            title: record.SONG,
            discs: new Set()
          });
        }

        // Build disc string
        const discString = `${record["MF CODE"]}${record.TRACK !== "--" ? ` (Track ${record.TRACK})` : ""}`;
        grouped.get(key).discs.add(discString);
      }
    });

    // Convert to array format expected by UI
    const items = Array.from(grouped.values()).map(item => ({
      artist: item.artist,
      title: item.title,
      count: item.discs.size,  // Use Set size for unique count
      discs: Array.from(item.discs).sort() // Convert Set back to sorted array
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Legacy API error:", error);
    return NextResponse.json({ items: [] });
  }
}