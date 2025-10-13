
# KaraTrack+ — Modern Karaoke Affiliate Search

A clean, glassmorphism Next.js site that lets customers search your karaoke catalog (Party Tyme + Karaoke Version) with type-ahead and sortable columns. Includes:
- CSV upload admin (manual and auto-refresh for Party Tyme via URL)
- Search-as-you-type, sortable headers, pagination
- Optional YouTube karaoke link helper (uses YouTube Data API if YOUTUBE_API_KEY is set)
- Prisma ORM (SQLite locally; Postgres in production)

## Quickstart (Local)

    pnpm i   # or npm i / yarn
    cp .env.example .env
    # For local dev we default to SQLite
    pnpm exec prisma db push
    pnpm dev

Open http://localhost:3000

## Admin

Visit /admin to upload CSV:
- Choose **Karaoke Version** or **Party Tyme**
- Upload the CSV provided by the affiliate
- Rows are upserted on (source, trackId)

## Party Tyme Auto-Refresh

If you have a direct CSV link, set PARTYTYME_CSV_URL in your env.
You can hit /api/admin/refresh/partytyme manually, or set a Vercel Cron:

Vercel vercel.json example:

    {
      "crons": [
        { "path": "/api/admin/refresh/partytyme", "schedule": "0 12 * * 1" }
      ]
    }

## YouTube Karaoke Links

Set YOUTUBE_API_KEY to use the YouTube Data API. When not set, the UI shows a fallback "Search" button that opens YouTube with the query.

## Deploying to Vercel

1. Create a Postgres database (Neon/Supabase/Render)
2. Set env vars:
   - DB_PROVIDER=postgresql
   - DATABASE_URL=postgres://...
   - Optional: YOUTUBE_API_KEY, PARTYTYME_CSV_URL
3. Build & deploy (prisma generate runs as part of build).
4. (Optional) Add a Vercel Cron for Party Tyme refresh.

## CSV Format

The importer expects headers like:
- Artist, Title, TrackID, Brand, View/Purchase

It is resilient to lowercase variants (artist, title, id, brand, purchaseUrl).

## Notes

- Karaoke Version usually requires manual login to download the CSV — use the Admin upload.
- Party Tyme often provides a direct CSV link — put it in PARTYTYME_CSV_URL and schedule a cron.
- Sorting is done server-side for performance; search is substring match across artist/title/brand/source.
