export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { execSync } = await import("child_process");

    // Push schema to database (creates tables if they don't exist)
    try {
      console.log("[instrumentation] Running prisma db push...");
      execSync("npx prisma db push --accept-data-loss --skip-generate", {
        stdio: "inherit",
        timeout: 30000,
      });
      console.log("[instrumentation] Schema pushed successfully");
    } catch (error) {
      console.error("[instrumentation] prisma db push failed:", error);
    }

    // Seed the database
    try {
      console.log("[instrumentation] Running seed...");
      execSync("npx tsx prisma/seed.ts", {
        stdio: "inherit",
        timeout: 30000,
      });
      console.log("[instrumentation] Seed complete");
    } catch (error) {
      console.error("[instrumentation] Seed failed:", error);
    }
  }
}
