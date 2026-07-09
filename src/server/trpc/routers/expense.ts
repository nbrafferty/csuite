import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

const CATEGORIES = [
  "BLANKS",
  "SUPPLIES",
  "LABOR",
  "SHIPPING",
  "OUTSOURCE",
  "OTHER",
] as const;

/** Revenue for an order = sum of its non-void invoice line totals */
async function orderRevenue(orderId: string): Promise<number> {
  const items = await prisma.invoiceItem.findMany({
    where: { invoice: { orderId, status: { not: "VOID" } } },
    select: { lineTotal: true },
  });
  return items.reduce((s, i) => s + Number(i.lineTotal), 0);
}

export const expenseRouter = router({
  // LIST — for an order, or unattached shop costs (staff only, always)
  list: staffProcedure
    .input(
      z
        .object({
          orderId: z.string().uuid().optional(),
          unattached: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.orderId) where.orderId = input.orderId;
      else if (input?.unattached) where.orderId = null;

      return prisma.expense.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          order: { select: { id: true, number: true, title: true } },
        },
        orderBy: { incurredAt: "desc" },
        take: 200,
      });
    }),

  // CREATE
  create: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid().optional(),
        description: z.string().trim().min(1).max(200),
        category: z.enum(CATEGORIES).default("OTHER"),
        amount: z.number().positive(),
        incurredAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let companyId: string | undefined;
      if (input.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: input.orderId },
          select: { companyId: true },
        });
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        companyId = order.companyId;
      }
      return prisma.expense.create({
        data: {
          orderId: input.orderId,
          companyId,
          description: input.description,
          category: input.category,
          amount: input.amount,
          incurredAt: input.incurredAt ? new Date(input.incurredAt) : undefined,
          createdByUserId: ctx.user.id as string,
        },
      });
    }),

  // DELETE
  delete: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.expense.delete({ where: { id: input.id } });
    }),

  // ORDER PROFITABILITY — revenue, costs, margin
  orderProfitability: staffProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [revenue, expenses] = await Promise.all([
        orderRevenue(input.orderId),
        prisma.expense.findMany({
          where: { orderId: input.orderId },
          select: { amount: true, category: true },
        }),
      ]);
      const costs = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const byCategory: Record<string, number> = {};
      for (const e of expenses) {
        byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
      }
      return {
        revenue,
        costs,
        margin: revenue - costs,
        marginPercent: revenue > 0 ? ((revenue - costs) / revenue) * 100 : null,
        expenseCount: expenses.length,
        byCategory,
      };
    }),

  // PROFIT BY CLIENT — over a date range (orders created in range)
  profitByClient: staffProcedure
    .input(
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
      })
    )
    .query(async ({ input }) => {
      const range = { gte: new Date(input.from), lte: new Date(input.to) };

      const [invoiceItems, expenses, companies] = await Promise.all([
        prisma.invoiceItem.findMany({
          where: {
            invoice: {
              status: { not: "VOID" },
              order: { createdAt: range },
            },
          },
          select: {
            lineTotal: true,
            invoice: { select: { companyId: true } },
          },
        }),
        prisma.expense.findMany({
          where: {
            order: { createdAt: range },
            orderId: { not: null },
          },
          select: { amount: true, companyId: true },
        }),
        prisma.company.findMany({
          where: { slug: { not: "central-creative" } },
          select: { id: true, name: true },
        }),
      ]);

      const revenueBy = new Map<string, number>();
      for (const i of invoiceItems) {
        const k = i.invoice.companyId;
        revenueBy.set(k, (revenueBy.get(k) ?? 0) + Number(i.lineTotal));
      }
      const costBy = new Map<string, number>();
      for (const e of expenses) {
        if (!e.companyId) continue;
        costBy.set(e.companyId, (costBy.get(e.companyId) ?? 0) + Number(e.amount));
      }

      return companies
        .map((c) => {
          const revenue = revenueBy.get(c.id) ?? 0;
          const costs = costBy.get(c.id) ?? 0;
          return {
            companyId: c.id,
            companyName: c.name,
            revenue,
            costs,
            margin: revenue - costs,
            marginPercent: revenue > 0 ? ((revenue - costs) / revenue) * 100 : null,
          };
        })
        .filter((r) => r.revenue > 0 || r.costs > 0)
        .sort((a, b) => b.margin - a.margin);
    }),
});
