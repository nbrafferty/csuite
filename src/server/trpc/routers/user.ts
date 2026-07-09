import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { sendEmail, inviteEmail, appBaseUrl } from "@/server/lib/email";
import { UserRole } from "@prisma/client";

/**
 * Resolve which company a management action targets.
 * CCC staff may act on any company (via companyId); a client admin is always
 * locked to their own company.
 */
function resolveCompanyId(
  ctx: { role: UserRole; companyId: string },
  inputCompanyId?: string
) {
  if (ctx.role === "CCC_STAFF") return inputCompanyId ?? ctx.companyId;
  return ctx.companyId;
}

// Client-side assignable roles (never CCC_STAFF through this router)
const assignableRole = z.enum(["CLIENT_ADMIN", "CLIENT_USER"]);

export const userRouter = router({
  // LIST users in a company
  list: adminProcedure
    .input(z.object({ companyId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const companyId = resolveCompanyId(ctx, input?.companyId);
      return prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      });
    }),

  // INVITE a teammate — pre-creates an INVITED user who activates by
  // registering with the company invite code and their email
  invite: adminProcedure
    .input(
      z.object({
        companyId: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().toLowerCase().email(),
        role: assignableRole.default("CLIENT_USER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = resolveCompanyId(ctx, input.companyId);

      const existing = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      const user = await prisma.user.create({
        data: {
          companyId,
          name: input.name,
          email: input.email,
          // Unmatchable placeholder — the real hash is set at registration
          passwordHash: "INVITED_PENDING_REGISTRATION",
          role: input.role,
          status: "INVITED",
          invitedBy: ctx.user.id,
        },
        select: { id: true, name: true, email: true, role: true, status: true },
      });

      // Email the invite (soft-fails if email isn't configured)
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, inviteCode: true },
      });
      if (company) {
        const template = inviteEmail({
          companyName: company.name,
          inviteCode: company.inviteCode,
          registerUrl: `${appBaseUrl()}/register`,
        });
        await sendEmail({ to: user.email, ...template });
      }

      return user;
    }),

  // UPDATE ROLE
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: assignableRole,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, companyId: true, role: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      const companyId = resolveCompanyId(ctx, target.companyId);
      if (target.companyId !== companyId || target.role === "CCC_STAFF") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      return prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, role: true },
      });
    }),

  // UPDATE STATUS — activate / deactivate
  updateStatus: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        status: z.enum(["ACTIVE", "DISABLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, companyId: true, role: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      const companyId = resolveCompanyId(ctx, target.companyId);
      if (target.companyId !== companyId || target.role === "CCC_STAFF") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own status",
        });
      }

      return prisma.user.update({
        where: { id: input.userId },
        data: { status: input.status },
        select: { id: true, status: true },
      });
    }),

  // INVITE CODE — the company's shareable join code
  inviteCode: adminProcedure
    .input(z.object({ companyId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const companyId = resolveCompanyId(ctx, input?.companyId);
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { inviteCode: true, name: true },
      });
      if (!company) throw new TRPCError({ code: "NOT_FOUND" });
      return company;
    }),
});
