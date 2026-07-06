export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { execSync } = await import("child_process");

    // Push schema to database (creates tables if they don't exist).
    // Without --accept-data-loss this fails loudly instead of silently
    // dropping columns/tables when a schema change would destroy data.
    try {
      console.log("[instrumentation] Running prisma db push...");
      execSync("npx prisma db push", {
        stdio: "inherit",
        timeout: 60000,
      });
      console.log("[instrumentation] Schema pushed successfully");
    } catch (error) {
      console.error("[instrumentation] prisma db push failed:", error);
    }

    if (process.env.DEMO_MODE === "true") {
      // Demo environments only: wipe and reseed demo data on every boot.
      try {
        console.log("[instrumentation] DEMO_MODE — running seed...");
        execSync("npx tsx prisma/seed.ts", {
          stdio: "inherit",
          timeout: 60000,
        });
        console.log("[instrumentation] Seed complete");
      } catch (error) {
        console.error("[instrumentation] Seed failed:", error);
      }
    } else {
      // Production: never touch existing data. If the database is empty,
      // create the staff org and first admin so someone can log in.
      try {
        const { bootstrap } = await import("./server/lib/bootstrap");
        await bootstrap();
      } catch (error) {
        console.error("[instrumentation] Bootstrap failed:", error);
      }
    }
  }
}
