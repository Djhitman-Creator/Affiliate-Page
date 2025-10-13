// scripts/count-legacy.ts
import { PrismaClient } from "@prisma/client";

(async () => {
  const prisma = new PrismaClient({ log: ["error"] });
  try {
    const n = await prisma.legacyTrack.count();
    console.log("Legacy rows:", n);
  } finally {
    await prisma.$disconnect();
  }
})();
