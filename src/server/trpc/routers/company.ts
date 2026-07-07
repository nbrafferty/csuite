import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const companyRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return prisma.company.findUnique({
      where: { id: ctx.companyId },
    });
  }),

  listUsers: protectedProcedure.query(async ({ ctx }) => {
    return prisma.user.findMany({
      where: { companyId: ctx.companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }),

  listLocations: protectedProcedure.query(async ({ ctx }) => {
    return prisma.location.findMany({
      where: { companyId: ctx.companyId },
      orderBy: { createdAt: "desc" },
    });
  }),
});
