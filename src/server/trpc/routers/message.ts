import { z } from "zod";
import { router, publicProcedure } from "@/lib/trpc/init";
import { prisma } from "@/lib/db";

export const messageRouter = router({
  list: publicProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input, ctx }) => {
      const thread = await prisma.thread.findUniqueOrThrow({
        where: { id: input.threadId },
      });

      // Check access
      if (ctx.userRole !== "ccc_staff" && thread.tenantId !== ctx.tenantId) {
        throw new Error("Access denied");
      }

      const where: Record<string, unknown> = { threadId: input.threadId };

      // Filter internal notes for non-staff users
      if (ctx.userRole !== "ccc_staff") {
        where.senderType = { not: "internal" };
      }

      const messages = await prisma.message.findMany({
        where,
        include: { sender: true },
        orderBy: { createdAt: "asc" },
      });

      return messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender.name,
        senderId: msg.senderId,
        senderType: msg.senderType,
        avatar: msg.sender.name
          .split(" ")
          .map((w) => w[0])
          .join(""),
        time: msg.createdAt.toISOString(),
        text: msg.text,
        attachments: JSON.parse(msg.attachments) as string[],
      }));
    }),

  send: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        type: z.enum(["reply", "internal"]),
        text: z.string().min(1),
        attachments: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Determine senderType
      let senderType: string;
      if (input.type === "internal") {
        if (ctx.userRole !== "ccc_staff") {
          throw new Error("Only staff can send internal notes");
        }
        senderType = "internal";
      } else {
        senderType = ctx.userRole === "ccc_staff" ? "staff" : "client";
      }

      const thread = await prisma.thread.findUniqueOrThrow({
        where: { id: input.threadId },
      });

      // Auto-update thread status based on the state machine
      let newStatus = thread.status;
      if (input.type !== "internal") {
        if (senderType === "staff") {
          if (thread.status !== "resolved") {
            newStatus = "waiting_client";
          }
        } else {
          if (thread.status !== "resolved") {
            newStatus = "waiting_staff";
          }
        }
        if (thread.status === "resolved") {
          newStatus = "open";
        }
      }

      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            threadId: input.threadId,
            senderId: ctx.userId,
            senderType,
            text: input.text,
            attachments: JSON.stringify(input.attachments ?? []),
          },
          include: { sender: true },
        }),
        prisma.thread.update({
          where: { id: input.threadId },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        }),
      ]);

      return {
        id: message.id,
        sender: message.sender.name,
        senderId: message.senderId,
        senderType: message.senderType,
        avatar: message.sender.name
          .split(" ")
          .map((w) => w[0])
          .join(""),
        time: message.createdAt.toISOString(),
        text: message.text,
        attachments: JSON.parse(message.attachments) as string[],
      };
    }),

  getParticipants: publicProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { threadId: input.threadId };

      // Non-staff don't see internal-only participants
      if (ctx.userRole !== "ccc_staff") {
        where.senderType = { not: "internal" };
      }

      const messages = await prisma.message.findMany({
        where,
        select: {
          senderId: true,
          senderType: true,
          sender: { select: { id: true, name: true, role: true } },
        },
        distinct: ["senderId"],
      });

      return messages.map((m) => ({
        id: m.sender.id,
        name: m.sender.name,
        role: m.sender.role === "ccc_staff" ? "CCC Staff" : "Client Admin",
        type: m.senderType === "client" ? "client" : "staff",
      }));
    }),
});
