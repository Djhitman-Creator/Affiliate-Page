// scripts/import-legacy-csv.ts
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { PrismaClient } from '@prisma/client';

// Prisma client (no aliasing so it works in Node)
const prisma = new PrismaClient({ log: ['error'] });

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function getField(row: Record<string, any>, aliases: string[]) {
  const entries = Object.entries(row).map(([k, v]) => [k?.trim().toLowerCase(), v] as const);
  for (const a of aliases) {
    const want = a.trim().toLowerCase();
    const hit = entries.find(([k]) => k === want) || entries.find(([k]) => k?.includes(want));
    if (hit) return String(hit[1] ?? '').trim();
  }
  return '';
}
function normalizeTrack(raw: string) {
  const s = String(raw ?? '').trim();
  if (!s || s === '--' || /^-+$/.test(s)) return '';
  return s.replace(/[^\w-]/g, '');
}
function buildDiscId(codeRaw: string, trackRaw: string) {
  const code = (codeRaw || '').trim();
  const track = normalizeTrack(trackRaw);
  if (!track) return code;
  const trackNum = /^\d{1,2}$/.test(track) ? track.padStart(2, '0') : track;
  const m = code.match(/^(.*?)-(\d{1,2})$/);
  return m ? `${m[1]}-${trackNum}` : `${code}-${trackNum}`;
}

async function run() {
  const argPath = process.argv.slice(2).join(' ').trim();
  const csvPath = path.resolve(argPath || 'legacy.csv');
  console.log(`ℹ️  Using CSV: ${csvPath}`);
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV not found at ${csvPath}`);
    process.exit(1);
  }

  let file = fs.readFileSync(csvPath, 'utf8');
  if (file.charCodeAt(0) === 0xfeff) file = file.slice(1);

  const parsed = Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h?.replace(/\uFEFF/g, '').trim(),
  });
  const rows = (parsed.data as any[]).filter(Boolean);
  console.log(`ℹ️  Parsed rows: ${rows.length}`);
  console.log('📄 Sample rows:', rows.slice(0, 3));

  const ARTIST = ['ARTIST', 'Artist', 'Performer'];
  const TITLE  = ['SONG', 'Song', 'SONG NAME', 'Title', 'Song Name'];
  const CODE   = ['MF CODE', 'MANUFACTURE CODE', 'Manufacture Code', 'Code', 'Label', 'Catalog', 'Cat No', 'Cat #'];
  const TRACK  = ['TRACK', 'TRACK NUMBER', 'Track Number', 'Trk', 'No'];

  let added = 0, updated = 0, skipped = 0;
  const BATCH = 1000;

  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const ops: Promise<any>[] = [];

    for (const r of slice) {
      const artist = getField(r, ARTIST);
      const title  = getField(r, TITLE);
      const code   = getField(r, CODE);
      const track  = getField(r, TRACK);

      if (!artist || !title || !code) { skipped++; continue; }

      const discId     = buildDiscId(code, track);
      const labelMatch = code.match(/^([A-Za-z]+)/);
      const labelCode  = labelMatch ? labelMatch[1].toUpperCase() : 'UNK';
      const artistNorm = norm(artist);
      const titleNorm  = norm(title);

      ops.push((async () => {
        const existing = await prisma.legacyTrack.findFirst({
          where: { artistNorm, titleNorm, discId },
          select: { id: true },
        });
        if (existing) {
          await prisma.legacyTrack.update({
            where: { id: existing.id },
            data: { labelCode, trackNo: normalizeTrack(track) || null },
          });
          updated++;
        } else {
          await prisma.legacyTrack.create({
            data: {
              artist, title, discId,
              labelCode, trackNo: normalizeTrack(track) || null, notes: null,
              artistNorm, titleNorm,
            },
          });
          added++;
        }
      })());
    }

    await Promise.all(ops);
    console.log(`… progress: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log(`✅ Done. added=${added} updated=${updated} skipped=${skipped} total=${rows.length}`);
}

run().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
