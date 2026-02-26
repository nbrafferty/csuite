import { readFileSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

const DEFAULT_DATABASE_URL =
  "postgresql://csuite:csuite_dev@localhost:5432/csuite?schema=public";

function loadEnvVar(name: string): string | undefined {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    for (const line of content.split("\n")) {
      const re = new RegExp(`^${name}\\s*=\\s*"?([^"]+)"?`);
      const match = line.match(re);
      if (match) return match[1];
    }
  } catch {}
  return undefined;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || loadEnvVar("DATABASE_URL") || DEFAULT_DATABASE_URL,
  },
});
