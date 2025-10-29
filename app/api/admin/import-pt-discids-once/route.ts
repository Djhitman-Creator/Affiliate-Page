// app/api/admin/import-pt-discids-once/route.ts
export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

// This should be the URL where Party Tyme's catalog is fetched from
// Update this to match where your automatic importer gets the data
const PT_CATALOG_URL = process.env.PT_CATALOG_URL || 
  "https://www.partytyme.net/affiliates/catalog.xml"; // Example - use your actual URL

export async function POST() {
  try {
    // Fetch the catalog from Party Tyme
    const response = await fetch(PT_CATALOG_URL);
    const xmlText = await response.text();
    
    // Parse XML with regex (simple approach for specific fields)
    const trackRegex = /<Artist>(.*?)<\/Artist>[\s\S]*?<Title>(.*?)<\/Title>[\s\S]*?<DiscID>(.*?)<\/DiscID>[\s\S]*?<Manufacturer>(.*?)<\/Manufacturer>/g;
    
    let match;
    let updated = 0;
    let processed = 0;
    const samples = [];
    
    while ((match = trackRegex.exec(xmlText)) !== null) {
      const [, artist, title, discId, manufacturer] = match;
      
      if (artist && title && discId) {
        processed++;
        const brand = manufacturer.toLowerCase().includes('hd') 
          ? "Party Tyme Hd" 
          : "Party Tyme Karaoke";
        
        const productUrl = `https://www.partytyme.net/songshop/cat/search/item/${discId}?merchant=${PT_MERCHANT}`;
        
        const result = await prisma.track.updateMany({
          where: {
            source: "Party Tyme",
            artist: { equals: artist.trim(), mode: "insensitive" },
            title: { equals: title.trim(), mode: "insensitive" }
          },
          data: {
            trackId: discId,
            url: productUrl,
            purchaseUrl: productUrl,
            brand
          }
        });
        
        if (result.count > 0) {
          updated++;
          if (samples.length < 5) {
            samples.push({ artist, title, discId, url: productUrl });
          }
        }
        
        // Log progress
        if (processed % 500 === 0) {
          console.log(`Processed ${processed}, updated ${updated}`);
        }
      }
    }
    
    return NextResponse.json({
      ok: true,
      processed,
      updated,
      samples
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}