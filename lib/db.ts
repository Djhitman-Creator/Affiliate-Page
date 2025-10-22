// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const provider = (process.env.DB_PROVIDER || "").toLowerCase();
const onVercel = !!process.env.VERCEL;

// If dev says sqlite but DATABASE_URL isn't a file: URL, force a safe local default
if (!onVercel && provider === "sqlite") {
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("file:")) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
}

// Single Prisma client (hot-reload safe)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
