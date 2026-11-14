import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI uses the direct Neon connection for migrations.
// Configuration is intentionally optional during the no-database foundation stage.
// Prisma migration commands must not run until DATABASE_URL_UNPOOLED is set.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(process.env.DATABASE_URL_UNPOOLED
    ? { datasource: { url: process.env.DATABASE_URL_UNPOOLED } }
    : {}),
});
