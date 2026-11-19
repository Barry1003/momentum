import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// This network drops the TLS handshake to the database intermittently.
// Retrying a transient connection error once or twice clears up almost all of them.
const RETRYABLE_CODES = new Set(["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "EHOSTUNREACH", "EPIPE"]);
const MAX_ATTEMPTS = 3;

function isRetryable(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error
    && RETRYABLE_CODES.has(String((error as { code?: unknown }).code));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for database-backed endpoints");
  }
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          for (let attempt = 1; ; attempt++) {
            try {
              return await query(args);
            } catch (error) {
              if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) throw error;
              await sleep(150 * attempt);
            }
          }
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { momentumPrisma?: ReturnType<typeof createPrismaClient> };

export function getPrisma() {
  if (!globalForPrisma.momentumPrisma) {
    globalForPrisma.momentumPrisma = createPrismaClient();
  }
  return globalForPrisma.momentumPrisma;
}
