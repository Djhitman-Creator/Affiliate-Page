-- CreateTable
CREATE TABLE "Track" (
    "id" SERIAL NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "source" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);
