import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: { company: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        logoUrl: user.company.logoUrl,
      },
    };
  }),
});
