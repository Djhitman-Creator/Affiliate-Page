// app/api/admin/test-pt-urls/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

const PT_MERCHANT = process.env.PARTYTYME_MERCHANT?.trim() || "105";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const artist = url.searchParams.get("artist") || "George Strait";
  const title = url.searchParams.get("title") || "All My Ex's Live In Texas";
  
  const query = `${artist} ${title}`.trim();
  const encodedQuery = encodeURIComponent(query);
  
  // Try different URL patterns
  const patterns = [
    {
      name: "Hash search with slash",
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/search/${encodedQuery}`
    },
    {
      name: "Hash search without slash", 
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#search/${encodedQuery}`
    },
    {
      name: "Hash songs route",
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/songs/${encodedQuery}`
    },
    {
      name: "Hash with query parameter",
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/search?q=${encodedQuery}`
    },
    {
      name: "Direct search no hash",
      url: `https://www.partytyme.net/songshop/search?merchant=${PT_MERCHANT}&q=${encodedQuery}`
    },
    {
      name: "Root with hash and query param",
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/?q=${encodedQuery}`
    },
    {
      name: "Just artist name",
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(artist)}`
    },
    {
      name: "Space as plus sign",
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/search/${query.replace(/\s+/g, '+')}`
    },
    {
      name: "Hyphen separator",
      url: `https://www.partytyme.net/songshop/?merchant=${PT_MERCHANT}#/search/${encodeURIComponent(artist + ' - ' + title)}`
    }
  ];
  
  return NextResponse.json({
    query,
    patterns,
    instructions: "Try each URL manually in your browser to see which format works"
  });
}