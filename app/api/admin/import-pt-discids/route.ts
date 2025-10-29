// app/api/admin/import-pt-discids/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for large import

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { XMLParser } from "fast-xml-parser";
import fs from "fs/promises";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

type PTTrack = {
  Artist: string;
  Title: string;
  DiscID: string;
  SongURL?: string;
  SongPreview?: string;
  Manufacturer: string;
};

function buildProductUrl(discId: string): string {
  return `https://www.partytyme.net/songshop/cat/search/item/${discId}?merchant=${PT_MERCHANT}`;
}

function normalizeBrand(manufacturer: string): string {
  const lower = manufacturer.toLowerCase();
  if (lower.includes("hd")) return "Party Tyme Hd";
  return "Party Tyme Karaoke";
}

export async function POST(req: Request) {
  try {
    const { xmlUrl, xmlPath, limit } = await req.json().catch(() => ({}));
    
    let xmlContent: string;
    
    // Support both URL and file path
    if (xmlUrl) {
      const response = await fetch(xmlUrl);
      xmlContent = await response.text();
    } else if (xmlPath) {
      xmlContent = await fs.readFile(xmlPath, "utf-8");
    } else {
      return NextResponse.json({ 
        error: "Please provide xmlUrl or xmlPath" 
      }, { status: 400 });
    }

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: false,
      trimValues: true
    });
    
    const parsed = parser.parse(xmlContent);
    const tracks: PTTrack[] = parsed.xml || [];
    
    if (!Array.isArray(tracks)) {
      return NextResponse.json({ 
        error: "Invalid XML structure - expected array of tracks" 
      }, { status: 400 });
    }

    const processLimit = limit || tracks.length;
    const toProcess = tracks.slice(0, processLimit);
    
    let matched = 0;
    let updated = 0;
    let notFound = 0;
    const samples: any[] = [];

    for (const ptTrack of toProcess) {
      if (!ptTrack.DiscID || !ptTrack.Artist || !ptTrack.Title) {
        continue;
      }

      // Try to find matching track in database
      const dbTrack = await prisma.track.findFirst({
        where: {
          AND: [
            { source: "Party Tyme" },
            { artist: { equals: ptTrack.Artist, mode: "insensitive" } },
            { title: { equals: ptTrack.Title, mode: "insensitive" } },
            { brand: normalizeBrand(ptTrack.Manufacturer) }
          ]
        }
      });

      if (dbTrack) {
        matched++;
        const productUrl = buildProductUrl(ptTrack.DiscID);
        
        // Update with disc ID and proper URL
        await prisma.track.update({
          where: { id: dbTrack.id },
          data: {
            trackId: ptTrack.DiscID,
            url: productUrl,
            purchaseUrl: productUrl,
            brand: normalizeBrand(ptTrack.Manufacturer)
          }
        });
        
        updated++;
        
        if (samples.length < 5) {
          samples.push({
            artist: ptTrack.Artist,
            title: ptTrack.Title,
            discId: ptTrack.DiscID,
            brand: normalizeBrand(ptTrack.Manufacturer),
            url: productUrl
          });
        }
      } else {
        notFound++;
      }
    }

    return NextResponse.json({
      ok: true,
      totalInXml: tracks.length,
      processed: toProcess.length,
      matched,
      updated,
      notFound,
      samples,
      message: `Updated ${updated} tracks with disc IDs from XML`
    });

  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ 
      ok: false,
      error: error.message || String(error) 
    }, { status: 500 });
  }
}

// GET endpoint for testing with smaller batches
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "100");
  
  // Use the uploaded file
  return POST(new Request(req.url, {
    method: "POST",
    body: JSON.stringify({
      xmlPath: "/mnt/user-data/uploads/karaokehouston_partytymenet.xml",
      limit
    })
  }));
}