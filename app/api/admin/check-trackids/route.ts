// app/api/admin/check-trackids/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const withTrackId = await prisma.track.findMany({
    where: {
      AND: [
        { source: "Party Tyme" },
        { trackId: { not: null } }
      ]
    },
    select: {
      artist: true,
      title: true,
      trackId: true,
      brand: true
    },
    take: 10
  });

  const countWith = await prisma.track.count({
    where: {
      AND: [
        { source: "Party Tyme" },
        { trackId: { not: null } }
      ]
    }
  });

  const countWithout = await prisma.track.count({
    where: {
      AND: [
        { source: "Party Tyme" },
        { trackId: null }
      ]
    }
  });

  return NextResponse.json({
    totalWithTrackId: countWith,
    totalWithoutTrackId: countWithout,
    samples: withTrackId,
    note: "Disc IDs should look like PY10420 or PH10420"
  });
}