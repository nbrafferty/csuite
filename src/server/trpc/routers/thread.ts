import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/init";
import { prisma } from "@/lib/db";

export const threadRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {};

      // Staff see all, clients see only their tenant's threads
      if (ctx.userRole !== "ccc_staff" && ctx.tenantId) {
        where.tenantId = ctx.tenantId;
      }

      if (input?.status && input.status !== "all") {
        where.status = input.status;
      }

      if (input?.search) {
        const searchTerm = input.search;
        where.OR = [
          { subject: { contains: searchTerm } },
          { orderId: { contains: searchTerm } },
          { tenant: { companyName: { contains: searchTerm } } },
          { messages: { some: { text: { contains: searchTerm } } } },
        ];
      }

      const threads = await prisma.thread.findMany({
        where,
        include: {
          tenant: true,
          assignee: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: true },
          },
          _count: {
            select: { messages: true },
          },
          readState: {
            where: { userId: ctx.userId },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      // Compute unread counts: count messages after last read time
      const readStates = new Map(
        threads.map((t) => [t.id, t.readState[0]?.readAt])
      );

      const unreadCounts = new Map<string, number>();
      for (const thread of threads) {
        const lastRead = readStates.get(thread.id);
        if (lastRead) {
          const count = await prisma.message.count({
            where: {
              threadId: thread.id,
              createdAt: { gt: lastRead },
              senderType: { not: "internal" },
            },
          });
          unreadCounts.set(thread.id, count);
        }
      }

      return threads.map((thread) => {
        const lastMessage = thread.messages[0];
        const lastReadAt = readStates.get(thread.id);
        const unreadCount = lastReadAt
          ? unreadCounts.get(thread.id) ?? 0
          : thread._count.messages > 0
            ? thread._count.messages
            : 0;

        return {
          id: thread.id,
          client: thread.tenant.companyName,
          orderId: thread.orderId,
          orderTitle: thread.orderTitle,
          subject: thread.subject,
          lastMessage: lastMessage?.text ?? "",
          lastSender: lastMessage?.sender.name ?? "",
          lastSenderType: lastMessage?.senderType ?? "client",
          time: lastMessage?.createdAt.toISOString() ?? thread.createdAt.toISOString(),
          unread: unreadCount,
          status: thread.status,
          assignee: thread.assignee?.name ?? null,
          assigneeId: thread.assigneeId,
          hasAttachment: lastMessage
            ? lastMessage.attachments !== "[]"
            : false,
          tenantId: thread.tenantId,
        };
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const thread = await prisma.thread.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          tenant: {
            include: {
              users: {
                where: { role: "client_admin" },
                take: 1,
              },
            },
          },
          assignee: true,
        },
      });

      // Check access
      if (ctx.userRole !== "ccc_staff" && thread.tenantId !== ctx.tenantId) {
        throw new Error("Access denied");
      }

      const primaryContact = thread.tenant.users[0];

      return {
        id: thread.id,
        subject: thread.subject,
        orderId: thread.orderId,
        orderTitle: thread.orderTitle,
        status: thread.status,
        assignee: thread.assignee
          ? { id: thread.assignee.id, name: thread.assignee.name }
          : null,
        client: {
          companyName: thread.tenant.companyName,
          primaryContact: primaryContact?.name ?? thread.tenant.primaryContact,
          primaryContactRole: primaryContact?.role ?? "client_admin",
          activeOrderCount: thread.tenant.activeOrderCount,
          billingStatus: thread.tenant.billingStatus,
        },
        tenantId: thread.tenantId,
      };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.string().optional(),
        assigneeId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.thread.update({
        where: { id },
        data,
        include: { assignee: true },
      });
    }),

  markRead: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return prisma.threadReadState.upsert({
        where: {
          threadId_userId: {
            threadId: input.id,
            userId: ctx.userId,
          },
        },
        update: { readAt: new Date() },
        create: {
          threadId: input.id,
          userId: ctx.userId,
        },
      });
    }),

  getStaffUsers: publicProcedure.query(async () => {
    return prisma.user.findMany({
      where: { role: "ccc_staff" },
      select: { id: true, name: true },
    });
  }),
});
