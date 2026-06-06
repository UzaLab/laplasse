import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Charge .env en local ; en Docker Coolify injecte DATABASE_URL directement
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
