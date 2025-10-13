-- CreateTable
CREATE TABLE "YoutubeCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "query" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "YoutubeVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "channelHandle" TEXT NOT NULL,
    "channelLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleNorm" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "thumbnail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "YoutubeMeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "lastIndexed" DATETIME
);

-- CreateTable
CREATE TABLE "LegacyTrack" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "labelCode" TEXT NOT NULL,
    "discId" TEXT NOT NULL,
    "trackNo" TEXT,
    "notes" TEXT,
    "artistNorm" TEXT NOT NULL,
    "titleNorm" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "YoutubeCache_query_idx" ON "YoutubeCache"("query");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideo_videoId_key" ON "YoutubeVideo"("videoId");

-- CreateIndex
CREATE INDEX "YoutubeVideo_titleNorm_idx" ON "YoutubeVideo"("titleNorm");

-- CreateIndex
CREATE INDEX "YoutubeVideo_channelHandle_publishedAt_idx" ON "YoutubeVideo"("channelHandle", "publishedAt");

-- CreateIndex
CREATE INDEX "LegacyTrack_artistNorm_titleNorm_idx" ON "LegacyTrack"("artistNorm", "titleNorm");

-- CreateIndex
CREATE INDEX "LegacyTrack_discId_idx" ON "LegacyTrack"("discId");
