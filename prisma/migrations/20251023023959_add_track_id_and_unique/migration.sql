/*
  Warnings:

  - A unique constraint covering the columns `[source,trackId]` on the table `Track` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "trackId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Track_source_trackId_key" ON "Track"("source", "trackId");
