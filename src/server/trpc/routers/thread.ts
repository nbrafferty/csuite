import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const threadRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        unread: z.boolean().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      const where: any = {};

      // CCC staff sees all threads; clients see only their company's
      if (ctx.role !== "CCC_STAFF") {
        where.companyId = ctx.companyId;
      }

      if (input.status && input.status !== "all") {
        where.status = input.status;
      }

      if (input.search) {
        where.subject = { contains: input.search, mode: "insensitive" };
      }

      if (input.unread) {
        // Unread = user has no read state for this thread
        where.readStates = { none: { userId } };
      }

      const threads = await prisma.messageThread.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          company: { select: { name: true } },
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, senderType: true, authorId: true },
          },
          readStates: {
            where: { userId },
            select: { lastReadAt: true },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
      });

      // Compute unread flag per thread: no read state, or thread updated after last read
      const threadsWithUnread = threads.map((t) => {
        const readState = t.readStates[0];
        const isUnread = !readState || new Date(t.updatedAt).getTime() > new Date(readState.lastReadAt).getTime();
        const { readStates: _, ...rest } = t;
        return { ...rest, isUnread };
      });

      let nextCursor: string | undefined;
      if (threadsWithUnread.length > input.limit) {
        const nextItem = threadsWithUnread.pop();
        nextCursor = nextItem?.id;
      }

      return { threads: threadsWithUnread, nextCursor };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string;
    const where: any = {};

    if (ctx.role !== "CCC_STAFF") {
      where.companyId = ctx.companyId;
    }

    const threads = await prisma.messageThread.findMany({
      where,
      select: {
        id: true,
        updatedAt: true,
        readStates: {
          where: { userId },
          select: { lastReadAt: true },
          take: 1,
        },
      },
    });

    return threads.filter((t) => {
      const readState = t.readStates[0];
      return !readState || new Date(t.updatedAt).getTime() > new Date(readState.lastReadAt).getTime();
    }).length;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const where: any = { id: input.id };
      if (ctx.role !== "CCC_STAFF") {
        where.companyId = ctx.companyId;
      }

      return prisma.messageThread.findFirst({
        where,
        include: {
          company: { select: { name: true, slug: true } },
          creator: { select: { id: true, name: true, email: true, role: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    }),

  updateStatus: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.messageThread.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  assign: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        assigneeId: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.messageThread.update({
        where: { id: input.id },
        data: { assigneeId: input.assigneeId },
      });
    }),

  participants: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .query(async ({ input }) => {
      const messages = await prisma.message.findMany({
        where: { threadId: input.threadId },
        select: { authorId: true },
        distinct: ["authorId"],
      });

      const userIds = messages.map((m) => m.authorId);

      return prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      });
    }),

  markRead: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      await prisma.threadReadState.upsert({
        where: { threadId_userId: { threadId: input.threadId, userId } },
        update: { lastReadAt: new Date() },
        create: { threadId: input.threadId, userId, lastReadAt: new Date() },
      });
    }),

  markUnread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      await prisma.threadReadState.deleteMany({
        where: { threadId: input.threadId, userId },
      });
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id as string;
    const where: any = { readStates: { none: { userId } } };
    if (ctx.role !== "CCC_STAFF") {
      where.companyId = ctx.companyId;
    }

    const unreadThreads = await prisma.messageThread.findMany({
      where,
      select: { id: true },
    });

    if (unreadThreads.length > 0) {
      await prisma.threadReadState.createMany({
        data: unreadThreads.map((t) => ({
          threadId: t.id,
          userId,
          lastReadAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }
  }),
});
