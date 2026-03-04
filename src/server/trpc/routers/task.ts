import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";

// ─── Helper: compute visibility from assignee list ───
async function computeVisibility(
  userIds: string[]
): Promise<"INTERNAL" | "EXTERNAL"> {
  if (userIds.length === 0) return "INTERNAL";
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { role: true },
  });
  const hasClient = users.some(
    (u) => u.role === "CLIENT_ADMIN" || u.role === "CLIENT_USER"
  );
  return hasClient ? "EXTERNAL" : "INTERNAL";
}

export const taskRouter = router({
  // LIST — with filters for the /tasks page
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          priority: z.string().optional(),
          orderId: z.string().optional(),
          assigneeId: z.string().optional(),
          standalone: z.boolean().optional(),
          search: z.string().optional(),
          page: z.number().int().default(1),
          perPage: z.number().int().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const {
        status,
        priority,
        orderId,
        assigneeId,
        standalone,
        search,
        page = 1,
        perPage = 50,
      } = input ?? {};

      const where: Prisma.TaskWhereInput = {};

      // Tenant scoping + visibility
      if (!isStaff) {
        where.visibility = "EXTERNAL";
        where.OR = [
          { tenantId: ctx.companyId },
          { order: { companyId: ctx.companyId } },
        ];
      }

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (orderId) where.orderId = orderId;
      if (standalone === true) where.orderId = null;
      if (standalone === false) where.orderId = { not: null };
      if (assigneeId) {
        where.assignees = { some: { userId: assigneeId } };
      }
      if (search) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { order: { number: { contains: search, mode: "insensitive" } } },
            ],
          },
        ];
      }

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            order: { select: { id: true, number: true, title: true } },
            tenant: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
            assignees: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
          },
          orderBy: [{ createdAt: "desc" }],
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.task.count({ where }),
      ]);

      // Custom sort: HIGH → MEDIUM → LOW, then due date, then newest
      const priorityOrder: Record<string, number> = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2,
      };
      const sorted = [...tasks].sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        if (a.dueDate && b.dueDate)
          return (
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return {
        tasks: sorted,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      };
    }),

  // LIST BY ORDER — for order detail Tasks section
  listByOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isStaff && order.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const where: Prisma.TaskWhereInput = { orderId: input.orderId };
      if (!isStaff) {
        where.visibility = "EXTERNAL";
      }

      return prisma.task.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      });
    }),

  // GET BY ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const task = await prisma.task.findUnique({
        where: { id: input.id },
        include: {
          order: {
            select: {
              id: true,
              number: true,
              title: true,
              companyId: true,
            },
          },
          tenant: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isStaff) {
        if (task.visibility === "INTERNAL") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const taskTenantId = task.tenantId || task.order?.companyId;
        if (taskTenantId !== ctx.companyId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      return task;
    }),

  // CREATE
  create: protectedProcedure
    .input(
      z.object({
        orderId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
        dueDate: z.string().datetime().optional(),
        assigneeIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";

      let tenantId: string | null = null;
      if (input.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: input.orderId },
        });
        if (!order)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        if (!isStaff && order.companyId !== ctx.companyId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        tenantId = order.companyId;
      } else {
        tenantId = isStaff ? null : ctx.companyId;
      }

      const assigneeIds = input.assigneeIds ?? [];

      // Clients can only assign to users in their own company
      if (!isStaff && assigneeIds.length > 0) {
        const assignees = await prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, companyId: true, role: true },
        });
        const invalid = assignees.find(
          (a) =>
            a.role === "CCC_STAFF" || a.companyId !== ctx.companyId
        );
        if (invalid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only assign tasks to users in your company",
          });
        }
      }

      const visibility = await computeVisibility(assigneeIds);

      return prisma.task.create({
        data: {
          orderId: input.orderId,
          tenantId,
          title: input.title,
          description: input.description,
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          visibility,
          createdByUserId: ctx.user.id,
          assignees:
            assigneeIds.length > 0
              ? { create: assigneeIds.map((userId) => ({ userId })) }
              : undefined,
        },
        include: {
          assignees: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });
    }),

  // UPDATE
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
        dueDate: z.string().datetime().nullable().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const task = await prisma.task.findUnique({
        where: { id: input.id },
        include: {
          order: { select: { companyId: true } },
          assignees: true,
        },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isStaff) {
        if (task.visibility === "INTERNAL") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const isCreator = task.createdByUserId === ctx.user.id;
        const isAssigned = task.assignees.some(
          (a: any) => a.userId === ctx.user.id
        );
        if (!isCreator && !isAssigned) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "DONE") {
          updateData.completedAt = new Date();
          updateData.completedByUserId = ctx.user.id;
        } else {
          updateData.completedAt = null;
          updateData.completedByUserId = null;
        }
      }

      return prisma.task.update({ where: { id }, data: updateData });
    }),

  // UPDATE ASSIGNEES — replaces full list + recomputes visibility
  updateAssignees: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        assigneeIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const task = await prisma.task.findUnique({
        where: { id: input.id },
        include: { order: { select: { companyId: true } } },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isStaff && input.assigneeIds.length > 0) {
        const assignees = await prisma.user.findMany({
          where: { id: { in: input.assigneeIds } },
          select: { id: true, companyId: true, role: true },
        });
        const invalid = assignees.find(
          (a) =>
            a.role === "CCC_STAFF" || a.companyId !== ctx.companyId
        );
        if (invalid) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only assign tasks to users in your company",
          });
        }
      }

      const visibility = await computeVisibility(input.assigneeIds);

      // Delete existing, create new, update visibility
      await prisma.taskAssignee.deleteMany({
        where: { taskId: input.id },
      });

      if (input.assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: input.assigneeIds.map((userId) => ({
            taskId: input.id,
            userId,
          })),
        });
      }

      return prisma.task.update({
        where: { id: input.id },
        data: { visibility },
        include: {
          assignees: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
          },
        },
      });
    }),

  // DELETE
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const task = await prisma.task.findUnique({
        where: { id: input.id },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isStaff && task.createdByUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only delete tasks you created",
        });
      }
      return prisma.task.delete({ where: { id: input.id } });
    }),

  // TOGGLE DONE — convenience for checkboxes
  toggleDone: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const task = await prisma.task.findUnique({
        where: { id: input.id },
        include: {
          order: { select: { companyId: true } },
          assignees: true,
        },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isStaff) {
        if (task.visibility === "INTERNAL") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const taskTenantId = task.tenantId || task.order?.companyId;
        if (taskTenantId !== ctx.companyId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      const newStatus = task.status === "DONE" ? "TODO" : "DONE";
      return prisma.task.update({
        where: { id: input.id },
        data: {
          status: newStatus,
          completedAt: newStatus === "DONE" ? new Date() : null,
          completedByUserId: newStatus === "DONE" ? ctx.user.id : null,
        },
      });
    }),
});
