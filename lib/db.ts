// lib/db.ts
export const runtime = "nodejs";
import prisma from "@/lib/db";

/**
 * On Vercel lambdas, Prisma + SQLite requires a writable file: URL.
 * If the env is misconfigured (e.g., "./prisma/dev.db"), coerce it at runtime.
 */
if (
  process.env.VERCEL &&
  (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:"))
) {
  process.env.DATABASE_URL = "file:/tmp/dev.db";
}

const g = globalThis as any;
const prisma = g.__prisma ?? /* centralized in @/lib/db */ prisma;

if (process.env.NODE_ENV !== "production") {
  g.__prisma = prisma;
}

export default prisma;
