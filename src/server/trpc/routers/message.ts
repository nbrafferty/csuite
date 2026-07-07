import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const messageRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ input }) => {
      const messages = await prisma.message.findMany({
        where: { threadId: input.threadId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return { messages, nextCursor };
    }),

  send: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid(),
        body: z.string().min(1).max(10000),
        senderType: z.enum(["client", "staff", "internal"]).default("client"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const senderType =
        ctx.role === "CCC_STAFF" ? input.senderType : "client";

      const message = await prisma.message.create({
        data: {
          threadId: input.threadId,
          authorId: ctx.user.id as string,
          body: input.body,
          senderType,
        },
        include: {
          author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
      });

      // Touch the thread's updatedAt
      await prisma.messageThread.update({
        where: { id: input.threadId },
        data: { updatedAt: new Date() },
      });

      return message;
    }),
});
