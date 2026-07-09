import { prisma } from "@/server/db/prisma";
import {
  sendEmail,
  clientAdminEmails,
  paymentRequestEmail,
  appBaseUrl,
} from "@/server/lib/email";

/**
 * Automation engine v1 — a fixed catalog of trigger × action rules,
 * staff-toggleable, processed in sortOrder. Every action is wrapped so a
 * failure can never break the mutation that emitted the event; each firing
 * is logged to AutomationRun.
 */

export type AutomationTrigger =
  | "STATUS_CHANGED"
  | "QUOTE_APPROVED"
  | "PROOF_APPROVED"
  | "PAID_IN_FULL"
  | "DEPOSIT_PAID";

export type AutomationEvent = {
  type: AutomationTrigger;
  /** New status value for STATUS_CHANGED */
  statusValue?: string;
  orderId?: string;
  quoteId?: string;
  actorUserId?: string;
  /** Chain depth — CHANGE_STATUS re-emits STATUS_CHANGED with depth+1 */
  depth?: number;
};

const MAX_CHAIN_DEPTH = 3;

export async function emitEvent(event: AutomationEvent): Promise<void> {
  try {
    const depth = event.depth ?? 0;
    if (depth >= MAX_CHAIN_DEPTH) {
      console.warn("[automation] Max chain depth reached, stopping", event.type);
      return;
    }

    const rules = await prisma.automationRule.findMany({
      where: { enabled: true, trigger: event.type },
      orderBy: { sortOrder: "asc" },
    });

    for (const rule of rules) {
      // STATUS_CHANGED rules can be scoped to a specific status value
      if (
        event.type === "STATUS_CHANGED" &&
        rule.triggerParam &&
        rule.triggerParam !== event.statusValue
      ) {
        continue;
      }

      let success = true;
      let detail = "";
      try {
        detail = await runAction(rule, event);
      } catch (err: any) {
        success = false;
        detail = err?.message ?? String(err);
        console.error(`[automation] Rule "${rule.name}" failed:`, err);
      }

      await prisma.automationRun
        .create({
          data: {
            ruleId: rule.id,
            entityType: event.orderId ? "Order" : "Quote",
            entityId: event.orderId ?? event.quoteId ?? "unknown",
            success,
            detail: detail || null,
          },
        })
        .catch(() => {});
    }
  } catch (err) {
    // The engine itself must never break the triggering mutation
    console.error("[automation] emitEvent failed:", err);
  }
}

async function runAction(
  rule: { action: string; actionParam: any; name: string },
  event: AutomationEvent
): Promise<string> {
  const param = (rule.actionParam ?? {}) as Record<string, any>;

  switch (rule.action) {
    case "SEND_CLIENT_EMAIL": {
      const order = await requireOrder(event);
      const recipients = await clientAdminEmails(order.companyId);
      if (recipients.length === 0) return "No client admins to email";
      const subject = substitute(param.subject ?? "Update on your order {{number}}", order);
      const body = substitute(
        param.body ?? "Your order {{number}} — {{title}} has been updated.",
        order
      );
      await sendEmail({
        to: recipients,
        subject,
        html: simpleEmailHtml(subject, body, `${appBaseUrl()}/orders/${order.id}`),
      });
      return `Emailed ${recipients.join(", ")}`;
    }

    case "CHANGE_STATUS": {
      const order = await requireOrder(event);
      const to = param.status as string;
      if (!to) throw new Error("actionParam.status missing");
      if (order.status === to) return `Already ${to}`;
      if (["COMPLETED", "CANCELLED"].includes(order.status)) {
        return `Skipped — order is ${order.status}`;
      }
      await prisma.order.update({ where: { id: order.id }, data: { status: to as any } });
      // Chain: the status change itself can trigger further rules
      await emitEvent({
        type: "STATUS_CHANGED",
        statusValue: to,
        orderId: order.id,
        actorUserId: event.actorUserId,
        depth: (event.depth ?? 0) + 1,
      });
      return `Status ${order.status} → ${to}`;
    }

    case "REQUEST_PAYMENT_PERCENT": {
      const order = await requireOrder(event);
      const percent = Number(param.percent);
      if (!percent || percent < 1 || percent > 100) {
        throw new Error("actionParam.percent must be 1-100");
      }
      const invoice = await prisma.invoice.findFirst({
        where: {
          orderId: order.id,
          status: { in: ["DRAFT", "SENT", "PARTIALLY_PAID", "OVERDUE"] },
        },
        orderBy: { createdAt: "desc" },
        include: { items: true, payments: true, paymentRequests: true },
      });
      if (!invoice) return "Skipped — no open invoice on order";
      if (invoice.paymentRequests.some((r) => r.status === "OPEN")) {
        return "Skipped — an open payment request already exists";
      }

      const total = invoice.items.reduce((s, i) => s + Number(i.lineTotal), 0);
      const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      const amount = Math.round(((total * percent) / 100) * 100) / 100;
      if (amount < 0.5 || amount > total - paid + 0.01) {
        return `Skipped — ${percent}% ($${amount.toFixed(2)}) not chargeable against outstanding $${(total - paid).toFixed(2)}`;
      }

      const requester =
        event.actorUserId ??
        (
          await prisma.user.findFirst({
            where: { role: "CCC_STAFF", status: "ACTIVE" },
            select: { id: true },
          })
        )?.id;
      if (!requester) throw new Error("No staff user available as requester");

      await prisma.paymentRequest.create({
        data: {
          invoiceId: invoice.id,
          amount,
          percentOfTotal: percent,
          note: param.note ?? "Deposit to begin production",
          requestedByUserId: requester,
        },
      });
      if (invoice.status === "DRAFT") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "SENT", issuedAt: new Date() },
        });
      }
      const recipients = await clientAdminEmails(order.companyId);
      if (recipients.length > 0) {
        const template = paymentRequestEmail({
          invoiceNumber: invoice.number,
          amountDue: amount.toLocaleString("en-US", { style: "currency", currency: "USD" }),
          note: param.note ?? "Deposit to begin production",
          invoiceUrl: `${appBaseUrl()}/billing/${invoice.id}`,
        });
        await sendEmail({ to: recipients, ...template });
      }
      return `Requested ${percent}% ($${amount.toFixed(2)}) on ${invoice.number}`;
    }

    case "CREATE_TASKS": {
      const order = await requireOrder(event);
      const tasks: { title: string; priority?: string }[] = param.tasks ?? [];
      if (tasks.length === 0) throw new Error("actionParam.tasks missing");
      const creator =
        event.actorUserId ??
        (
          await prisma.user.findFirst({
            where: { role: "CCC_STAFF", status: "ACTIVE" },
            select: { id: true },
          })
        )?.id;
      if (!creator) throw new Error("No user available as task creator");

      for (const t of tasks) {
        const title = substitute(t.title, order);
        const existing = await prisma.task.findFirst({
          where: { title, orderId: order.id, archivedAt: null },
        });
        if (existing) continue;
        await prisma.task.create({
          data: {
            title,
            orderId: order.id,
            tenantId: order.companyId,
            priority: t.priority ?? "MEDIUM",
            visibility: "INTERNAL",
            createdByUserId: creator,
          },
        });
      }
      return `Created ${tasks.length} task(s)`;
    }

    default:
      throw new Error(`Unknown action ${rule.action}`);
  }
}

async function requireOrder(event: AutomationEvent) {
  if (!event.orderId) throw new Error("This action requires an order entity");
  const order = await prisma.order.findUnique({
    where: { id: event.orderId },
    select: { id: true, number: true, title: true, status: true, companyId: true },
  });
  if (!order) throw new Error("Order not found");
  return order;
}

function substitute(template: string, order: { number: string; title: string }) {
  return template
    .replaceAll("{{number}}", order.number)
    .replaceAll("{{title}}", order.title);
}

function simpleEmailHtml(title: string, body: string, linkUrl: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;padding:32px;"><tr><td>
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#e85d4c;">Central Creative Co.</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">${title}</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">${body}</p>
      <a href="${linkUrl}" style="display:inline-block;background-color:#e85d4c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">View Order</a>
    </td></tr></table>
  </td></tr></table>
</body></html>`;
}

/** Default rule set mirroring the shop's active Printavo automations,
 *  mapped to C-Suite order statuses. */
export const DEFAULT_RULES = [
  {
    name: "All proofs approved → order Approved",
    trigger: "PROOF_APPROVED",
    action: "CHANGE_STATUS",
    actionParam: { status: "APPROVED" },
    sortOrder: 0,
  },
  {
    name: "Order Approved → request 50% deposit",
    trigger: "STATUS_CHANGED",
    triggerParam: "APPROVED",
    action: "REQUEST_PAYMENT_PERCENT",
    actionParam: { percent: 50, note: "Deposit to begin production" },
    sortOrder: 1,
  },
  {
    name: "In Production → notify client",
    trigger: "STATUS_CHANGED",
    triggerParam: "IN_PRODUCTION",
    action: "SEND_CLIENT_EMAIL",
    actionParam: {
      subject: "Your order {{number}} is in production!",
      body: "Great news — {{title}} has entered production. We'll let you know as soon as it's ready.",
    },
    sortOrder: 2,
  },
  {
    name: "Ready → notify client",
    trigger: "STATUS_CHANGED",
    triggerParam: "READY",
    action: "SEND_CLIENT_EMAIL",
    actionParam: {
      subject: "Your order {{number}} is ready!",
      body: "{{title}} is finished and ready. We'll be in touch about delivery or pickup.",
    },
    sortOrder: 3,
  },
  {
    name: "Shipped → notify client",
    trigger: "STATUS_CHANGED",
    triggerParam: "SHIPPED",
    action: "SEND_CLIENT_EMAIL",
    actionParam: {
      subject: "Your order {{number}} has shipped",
      body: "{{title}} is on its way. Track details are available on your order page.",
    },
    sortOrder: 4,
  },
  {
    name: "Paid in full → thank you email",
    trigger: "PAID_IN_FULL",
    action: "SEND_CLIENT_EMAIL",
    actionParam: {
      subject: "Thank you — invoice paid in full",
      body: "We've received your payment for {{number}} — {{title}}. Thank you for your business!",
    },
    sortOrder: 5,
  },
] as const;
