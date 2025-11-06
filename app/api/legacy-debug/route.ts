export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET(request: NextRequest) {
  try {
    const csvPath = path.join(process.cwd(), "data", "Legacy_Track_Songbook.csv");
    const csvContent = await fs.readFile(csvPath, "utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Get first 5 Randy Travis records to see structure
    const randyRecords = records
      .filter((r: any) => r.ARTIST?.toLowerCase().includes('randy travis'))
      .slice(0, 10);
    
    // Count unique songs
    const songs = new Map();
    records
      .filter((r: any) => r.ARTIST?.toLowerCase().includes('randy travis'))
      .forEach((r: any) => {
        const song = r.SONG || r.song || r.Song || 'Unknown';
        songs.set(song.toLowerCase(), (songs.get(song.toLowerCase()) || 0) + 1);
      });
    
    // Find songs with multiple entries
    const multipleEntries = Array.from(songs.entries())
      .filter(([_, count]) => count > 1)
      .map(([song, count]) => ({ song, count }));
    
    return NextResponse.json({
      sample: randyRecords,
      columnNames: Object.keys(records[0] || {}),
      totalRandyRecords: records.filter((r: any) => r.ARTIST?.toLowerCase().includes('randy travis')).length,
      songsWithMultiple: multipleEntries
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}