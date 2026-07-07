import { router, protectedProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const isStaff = ctx.role === "CCC_STAFF";
    const companyFilter = isStaff ? {} : { companyId: ctx.companyId };

    const [
      activeOrders,
      completedOrders,
      openQuotes,
      overdueInvoices,
      recentOrders,
      recentQuotes,
      pendingRequests,
    ] = await Promise.all([
      // Active orders (not COMPLETED/CANCELLED)
      prisma.order.count({
        where: {
          ...companyFilter,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      }),
      // Completed orders
      prisma.order.count({
        where: { ...companyFilter, status: "COMPLETED" },
      }),
      // Open quotes (SENT or CHANGES_REQUESTED)
      prisma.quote.count({
        where: {
          ...companyFilter,
          status: { in: ["SENT", "CHANGES_REQUESTED"] },
        },
      }),
      // Overdue invoices
      prisma.invoice.count({
        where: {
          ...companyFilter,
          status: "OVERDUE",
        },
      }),
      // Recent orders (last 5)
      prisma.order.findMany({
        where: companyFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          company: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      // Recent quotes (last 5)
      prisma.quote.findMany({
        where: {
          ...companyFilter,
          ...(isStaff ? {} : { status: { not: "DRAFT" } }),
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          company: { select: { name: true } },
          items: { select: { lineTotal: true } },
        },
      }),
      // Pending quote requests
      prisma.quoteRequest.count({
        where: {
          ...companyFilter,
          status: { in: ["SUBMITTED", "IN_REVIEW"] },
        },
      }),
    ]);

    return {
      activeOrders,
      completedOrders,
      openQuotes,
      overdueInvoices,
      pendingRequests,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        number: o.number,
        title: o.title,
        status: o.status,
        company: o.company.name,
        itemCount: o._count.items,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
      })),
      recentQuotes: recentQuotes.map((q) => ({
        id: q.id,
        number: q.number,
        title: q.title,
        status: q.status,
        company: q.company.name,
        total: q.items.reduce((sum, i) => sum + Number(i.lineTotal), 0),
        createdAt: q.createdAt,
      })),
    };
  }),
});
