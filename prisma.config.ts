import { readFileSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

const DEFAULT_DATABASE_URL =
  "postgresql://csuite:csuite_dev@localhost:5432/csuite?schema=public";

function loadEnvUrl(): string {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^DATABASE_URL\s*=\s*"?([^"]+)"?/);
      if (match) return match[1];
    }
  } catch {}
  return DEFAULT_DATABASE_URL;
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
