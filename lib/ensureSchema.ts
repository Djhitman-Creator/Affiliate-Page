// lib/ensureSchema.ts
import prisma from "@/lib/db";

let ensured = false;

/**
 * On Vercel (SQLite in /tmp), cold starts create a fresh empty DB.
 * This guard creates the minimal tables if they don't exist yet.
 */
export async function ensureSqliteTables() {
  if (ensured) return;

  const dbUrl = process.env.DATABASE_URL || "";
  // Only do this guard when using SQLite (Vercel's /tmp)
  if (!dbUrl.startsWith("file:")) {
    ensured = true;
    return;
  }

  // Tracks table (used by Party Tyme and others)
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
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_track_artist" ON "Track"("artist");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_track_title"  ON "Track"("title");`);

  // Optional: LegacyTrack (some routes reference it)
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

