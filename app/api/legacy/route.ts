import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const artist = url.searchParams.get("artist") || "";
    const title = url.searchParams.get("title") || "";
    
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
    
    // Group by artist-title and format for UI
    const grouped = new Map();
    
    records.forEach((record: any) => {
      const matchArtist = !artist || record.ARTIST?.toLowerCase().includes(artist.toLowerCase());
      const matchTitle = !title || record.SONG?.toLowerCase().includes(title.toLowerCase());
      
      if (matchArtist && matchTitle) {
        const key = `${record.ARTIST}|${record.SONG}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            artist: record.ARTIST,
            title: record.SONG,
            discs: []
          });
        }
        grouped.get(key).discs.push(`${record["MF CODE"]}${record.TRACK !== "--" ? ` (Track ${record.TRACK})` : ""}`);
      }
    });
    
    // Convert to array format expected by UI
    const items = Array.from(grouped.values()).map(item => ({
      artist: item.artist,
      title: item.title,
      count: item.discs.length,
      discs: item.discs
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Legacy API error:", error);
    return NextResponse.json({ items: [] });
  }
}