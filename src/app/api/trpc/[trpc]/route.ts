import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/router";
import type { TRPCContext } from "@/lib/trpc/init";
import { prisma } from "@/lib/db";

async function createContext(): Promise<TRPCContext> {
  // For MVP: use a hardcoded staff user. In production, this would come from
  // session/auth middleware (e.g. NextAuth, Clerk, etc.)
  const staffUser = await prisma.user.findFirst({
    where: { role: "ccc_staff" },
  });

  return {
    userId: staffUser?.id ?? "system",
    userRole: staffUser?.role ?? "ccc_staff",
    tenantId: staffUser?.tenantId ?? null,
  };
}

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}

export { handler as GET, handler as POST };
