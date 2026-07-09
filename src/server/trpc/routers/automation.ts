import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { DEFAULT_RULES } from "@/server/lib/automation";

export const automationRouter = router({
  // LIST — rules in order, each with its most recent run
  list: staffProcedure.query(async () => {
    const rules = await prisma.automationRule.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        runs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return rules.map((r) => ({ ...r, lastRun: r.runs[0] ?? null }));
  }),

  // RUNS — recent firings for one rule
  runs: staffProcedure
    .input(z.object({ ruleId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.automationRun.findMany({
        where: { ruleId: input.ruleId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }),

  // TOGGLE
  setEnabled: staffProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return prisma.automationRule.update({
        where: { id: input.id },
        data: { enabled: input.enabled },
      });
    }),

  // UPDATE PARAMS — small, per-action parameter set
  updateParams: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        triggerParam: z.string().nullable().optional(),
        actionParam: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.automationRule.update({
        where: { id: input.id },
        data: {
          triggerParam: input.triggerParam,
          actionParam: input.actionParam,
        },
      });
    }),

  // MOVE — swap sortOrder with the neighbor
  move: staffProcedure
    .input(z.object({ id: z.string().uuid(), direction: z.enum(["up", "down"]) }))
    .mutation(async ({ input }) => {
      const rules = await prisma.automationRule.findMany({
        orderBy: { sortOrder: "asc" },
      });
      const idx = rules.findIndex((r) => r.id === input.id);
      if (idx === -1) throw new TRPCError({ code: "NOT_FOUND" });
      const swapWith = input.direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= rules.length) return rules[idx];

      await prisma.$transaction([
        prisma.automationRule.update({
          where: { id: rules[idx].id },
          data: { sortOrder: rules[swapWith].sortOrder },
        }),
        prisma.automationRule.update({
          where: { id: rules[swapWith].id },
          data: { sortOrder: rules[idx].sortOrder },
        }),
      ]);
      return prisma.automationRule.findUnique({ where: { id: input.id } });
    }),

  // INSTALL DEFAULTS — seeds the shop's standard rule set (skips existing names)
  installDefaults: staffProcedure.mutation(async () => {
    const existing = await prisma.automationRule.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existing.map((r) => r.name));
    const toCreate = DEFAULT_RULES.filter((r) => !existingNames.has(r.name));
    for (const rule of toCreate) {
      await prisma.automationRule.create({
        data: {
          name: rule.name,
          trigger: rule.trigger,
          triggerParam: (rule as any).triggerParam ?? null,
          action: rule.action,
          actionParam: rule.actionParam as any,
          sortOrder: rule.sortOrder,
        },
      });
    }
    return { installed: toCreate.length };
  }),
});
