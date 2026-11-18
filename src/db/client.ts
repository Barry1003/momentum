import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { momentumPrisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for database-backed endpoints");
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.momentumPrisma) {
    globalForPrisma.momentumPrisma = createPrismaClient();
  }
  return globalForPrisma.momentumPrisma;
}
