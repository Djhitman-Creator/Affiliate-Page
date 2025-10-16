// lib/db.ts
export const runtime = "nodejs";
import { PrismaClient } from "@prisma/client";

// Hard safety: force a valid SQLite URL on Vercel if misconfigured
if (process.env.VERCEL && (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:"))) {
  process.env.DATABASE_URL = "file:/tmp/dev.db";
}

const globalAny = globalThis as any;
const prisma = globalAny.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalAny.__prisma = prisma;
}

export default prisma;
