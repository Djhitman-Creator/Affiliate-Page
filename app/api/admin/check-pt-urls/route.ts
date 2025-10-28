// app/api/admin/check-pt-urls/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const samples = await prisma.track.findMany({
    where: {
      OR: [
        { source: "Party Tyme" },
        { brand: { contains: "party tyme", mode: "insensitive" } as any }
      ]
    },
    select: {
      id: true,
      artist: true,
      title: true,
      url: true,
      purchaseUrl: true
    },
    take: 5
  });

  return NextResponse.json({
    samples,
    total: await prisma.track.count({
      where: {
        OR: [
          { source: "Party Tyme" },
          { brand: { contains: "party tyme", mode: "insensitive" } as any }
        ]
      }
    })
  });
}