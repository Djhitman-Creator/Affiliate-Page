// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Guard: force a valid SQLite URL on Vercel if misconfigured
if (process.env.VERCEL && (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:"))) {
  process.env.DATABASE_URL = "file:/tmp/dev.db";
}

const g = globalThis as any;
const prisma = g.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  g.__prisma = prisma;
}

export default prisma;
