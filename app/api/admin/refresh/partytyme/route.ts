export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/db";

const norm = (s: any) => String(s ?? "").trim().replace(/\s+/g, " ");
const pick = (row: Record<string, any>, names: string[]) => {
  for (const n of names) if (row[n] != null && String(row[n]).trim() !== "") return String(row[n]);
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

// Optional: simple token guard. Set PT_IMPORT_SECRET in Vercel if you want to protect this route.
const authorized = (req: Request) => {
  const need = (process.env.PT_IMPORT_SECRET || "").trim();
  if (!need) return true;
  const got = new URL(req.url).searchParams.get("secret") || req.headers.get("x-pt-secret") || "";
  return need && got === need;
};

export async function POST(req: Request) {
  try {
    if (!authorized(req)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const url = (process.env.PARTYTYME_CSV_URL || process.env.PARTYTYME_ZIP_URL || "").trim();
    if (!url) return NextResponse.json({ ok: false, error: "PARTYTYME_CSV_URL (or ZIP) not set" }, { status: 400 });

    const merchant = (process.env.PARTYTYME_MERCHANT || "105").trim();
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "2000");
    const skip  = Number(searchParams.get("skip")  || "0");

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ ok: false, error: `Download failed ${res.status} ${res.statusText}`, url }, { status: 502 });

    const body = await res.text();
    const parsed = Papa.parse(body, { header: true, skipEmptyLines: true, transformHeader: h => (h || "").trim() });
    const rows = Array.isArray(parsed.data) ? (parsed.data as any[]) : [];
    const slice = rows.slice(skip, skip + limit);

    let added = 0, updated = 0, skipped = 0;

    for (const raw of slice) {
      const artist = norm(pick(raw, ["Artist","artist","ARTIST","Author","author"]));
      const title  = norm(pick(raw, ["Title","title","Song","SongTitle","song","Track"]));
      const link   = pick(raw, ["URL","Url","url","Link","PurchaseURL","purchaseUrl","Mp3Link","mp3Link"]);
      if (!artist || !title) { skipped++; continue; }

      const urlWithAff = withMerchant(link || null, merchant);

      const existing = await prisma.track.findFirst({
        where: { AND: [{ artist: { equals: artist } }, { title: { equals: title } }] }
      });

      if (!existing) {
        await prisma.track.create({
          data: { artist, title, brand: "Party Tyme", source: "Party Tyme", url: urlWithAff || undefined } as any
        });
        added++;
      } else {
        await prisma.track.update({
          where: { id: (existing as any).id },
          data: { url: urlWithAff || (existing as any).url || undefined } as any
        });
        updated++;
      }
    }

    const count = await prisma.track.count();
    return NextResponse.json({ ok: true, stats: { totalCsv: rows.length, processed: slice.length, added, updated, skipped, dbCount: count } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
