-- CreateTable
CREATE TABLE "LegacyTrack" (
    "id" SERIAL NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "discId" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegacyTrack_artist_idx" ON "LegacyTrack"("artist");

-- CreateIndex
CREATE INDEX "LegacyTrack_title_idx" ON "LegacyTrack"("title");

-- CreateIndex
CREATE INDEX "LegacyTrack_brand_idx" ON "LegacyTrack"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyTrack_artist_title_brand_discId_key" ON "LegacyTrack"("artist", "title", "brand", "discId");
