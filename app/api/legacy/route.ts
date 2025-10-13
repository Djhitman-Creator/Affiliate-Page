export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s: string) {
  return norm(s).split(" ").filter(Boolean);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist") || "";
  const title  = searchParams.get("title")  || "";

  // Tokenize so order like "Strait, George" vs "George Strait" still matches
  const aToks = tokens(artist);
  const tToks = tokens(title);

  if (aToks.length === 0 && tToks.length === 0) {
    return Response.json({ items: [] });
  }

  // Build a broad Prisma WHERE using per-token contains
  // AND all artist tokens, AND all title tokens (whichever are present)
  const whereAND: any[] = [];
  for (const tok of aToks) whereAND.push({ artistNorm: { contains: tok } });
  for (const tok of tToks) whereAND.push({ titleNorm:  { contains: tok } });

  const rows = await prisma.legacyTrack.findMany({
    where: whereAND.length ? { AND: whereAND } : undefined,
    select: { artist: true, title: true, discId: true, artistNorm: true, titleNorm: true },
  });

  // (Optional) tiny extra safety — but most work is done in SQL now
  const filtered = rows.filter(r => {
    const A = r.artistNorm || "";
    const T = r.titleNorm  || "";
    const artistOK = aToks.length === 0 || aToks.every(t => A.includes(t));
    const titleOK  = tToks.length === 0 || tToks.every(t => T.includes(t));
    return artistOK && titleOK;
  });

  // Group discs by (artist, title)
  const map: Record<string, { artist: string; title: string; discs: string[] }> = {};
  for (const r of filtered) {
    const key = `${r.artist}|||${r.title}`;
    if (!map[key]) map[key] = { artist: r.artist, title: r.title, discs: [] };
    map[key].discs.push(r.discId);
  }

  const items = Object.values(map).map(x => ({
    artist: x.artist,
    title: x.title,
    count: x.discs.length,
    discs: x.discs.sort(),
  }));

  return Response.json({ items });
}

