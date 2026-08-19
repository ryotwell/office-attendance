import 'dotenv/config'
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'bun --bun ./prisma/seed.ts'
  },
  datasource: {
    url: env("DATABASE_URL") ?? 'postgresql://dummy:dummy@localhost:5432/dummy',
  },
});
