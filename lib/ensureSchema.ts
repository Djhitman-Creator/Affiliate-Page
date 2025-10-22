// lib/ensureSchema.ts
import prisma from "@/lib/db";

let ensured = false;

export async function ensureSqliteTables() {
  if (ensured) return;
  const dbUrl = process.env.DATABASE_URL || "";
  // Only bother for SQLite-on-Vercel
  if (!dbUrl.startsWith("file:")) {
    ensured = true;
    return;
  }

  // Create Track table if missing
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Track" (
      "id"        INTEGER PRIMARY KEY AUTOINCREMENT,
      "artist"    TEXT,
      "title"     TEXT,
      "brand"     TEXT,
      "source"    TEXT,
      "url"       TEXT,
      "imageUrl"  TEXT,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // (Optional) indexes to speed searches
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_track_artist" ON "Track"("artist");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_track_title"  ON "Track"("title");`);

  // Create LegacyTrack table if your routes touch it
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LegacyTrack" (
      "id"        INTEGER PRIMARY KEY AUTOINCREMENT,
      "artist"    TEXT,
      "title"     TEXT,
      "brand"     TEXT,
      "source"    TEXT,
      "url"       TEXT,
      "imageUrl"  TEXT,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  ensured = true;
}
