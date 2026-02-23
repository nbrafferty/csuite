import { readFileSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

function loadEnvUrl(): string {
  const envPath = resolve(process.cwd(), ".env");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^DATABASE_URL\s*=\s*"?([^"]+)"?/);
    if (match) return match[1];
  }
  throw new Error("DATABASE_URL not found in .env file");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || loadEnvUrl(),
  },
});
