import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Vercel serverless functions have a read-only root filesystem except for /tmp.
// When running on Vercel with SQLite, copy the committed dev.db to /tmp/dev.db so writes succeed.
if (process.env.VERCEL) {
  const tmpDbPath = "/tmp/dev.db";
  if (!fs.existsSync(tmpDbPath)) {
    const candidatePaths = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), "dev.db"),
    ];
    for (const src of candidatePaths) {
      if (fs.existsSync(src)) {
        try {
          fs.copyFileSync(src, tmpDbPath);
          break;
        } catch {
          // Ignore copy failures
        }
      }
    }
  }
  if (fs.existsSync(tmpDbPath) && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("dev.db"))) {
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Invalidate stale dev instance if schema models were added while dev server was running
if (
  globalForPrisma.prisma &&
  (!(globalForPrisma.prisma as any).socratesConversation ||
    !(globalForPrisma.prisma as any).socratesMessage)
) {
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma = globalForPrisma.prisma || (globalForPrisma.prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
