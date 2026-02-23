import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Session } from "next-auth";
import { UserRole } from "@prisma/client";

export type TRPCContext = {
  session: Session | null;
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** Middleware: require authenticated user */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      companyId: (ctx.session.user as any).companyId as string,
      role: (ctx.session.user as any).role as UserRole,
    },
  });
});

/** Protected procedure — all queries auto-scoped to tenant */
export const protectedProcedure = t.procedure.use(enforceAuth);

/** Middleware: require CCC Staff role */
const enforceCCCStaff = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if ((ctx.session.user as any).role !== "CCC_STAFF") {
    throw new TRPCError({ code: "FORBIDDEN", message: "CCC Staff only" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      companyId: (ctx.session.user as any).companyId as string,
      role: (ctx.session.user as any).role as UserRole,
    },
  });
});

/** CCC Staff-only procedure */
export const staffProcedure = t.procedure.use(enforceCCCStaff);

/** Middleware: require Client Admin */
const enforceClientAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const role = (ctx.session.user as any).role;
  if (role !== "CLIENT_ADMIN" && role !== "CCC_STAFF") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      companyId: (ctx.session.user as any).companyId as string,
      role: role as UserRole,
    },
  });
});

/** Client Admin (or CCC Staff) procedure */
export const adminProcedure = t.procedure.use(enforceClientAdmin);
