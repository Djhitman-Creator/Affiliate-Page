import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const partyTyme = await prisma.track.count({ where: { source: "Party Tyme" } });
  const karaokeVersion = await prisma.track.count({ where: { source: "Karaoke Version" } });
  return NextResponse.json({ partyTyme, karaokeVersion });
}
