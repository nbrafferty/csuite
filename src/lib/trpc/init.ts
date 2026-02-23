import { initTRPC } from "@trpc/server";
import superjson from "superjson";

export interface TRPCContext {
  userId: string;
  userRole: string;
  tenantId: string | null;
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
