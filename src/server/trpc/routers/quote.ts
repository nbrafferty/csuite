import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { QuoteStatus, PaymentTermType } from "@prisma/client";
import { generateQuoteNumber } from "../../lib/quote-number";
import { generateOrderNumber } from "../../lib/order-number";
import { generateInvoiceNumber } from "../../lib/invoice-number";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/db/prisma";
import { sendEmail, quoteSentEmail, clientAdminEmails, appBaseUrl } from "@/server/lib/email";

// ─── Input Schemas ───

const QuoteItemInput = z.object({
  savedProductId: z.string().optional(),
  description: z.string().min(1),
  sku: z.string().optional(),
  color: z.string().optional(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().positive(),
  decorationNotes: z.string().optional(),
  sizeBreakdown: z
    .record(z.string(), z.number().int().nonnegative())
    .optional(),
  sortOrder: z.number().int().default(0),
});

const PaymentTermsInput = z.object({
  paymentTermType: z.nativeEnum(PaymentTermType),
  depositPercent: z.number().int().min(1).max(99).optional(),
  netDays: z.number().int().min(1).max(120).optional(),
});

// ─── Router ───

export const quoteRouter = router({
  // LIST — Staff sees all, clients see own company (non-DRAFT only)
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(QuoteStatus).optional(),
          companyId: z.string().optional(),
          search: z.string().optional(),
          page: z.number().int().default(1),
          perPage: z.number().int().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { status, companyId, search, page = 1, perPage = 20 } =
        input ?? {};

      const where: any = {};

      // Tenant scoping
      if ((user as any).role === "CCC_STAFF") {
        if (companyId) where.companyId = companyId;
      } else {
        where.companyId = (user as any).companyId;
        where.status = { not: "DRAFT" as QuoteStatus };
      }

      if (status) {
        if (where.status && typeof where.status === "object") {
          // Client filtering: exclude DRAFT and also apply specific filter
          where.AND = [{ status: { not: "DRAFT" as QuoteStatus } }, { status }];
          delete where.status;
        } else {
          where.status = status;
        }
      }

      if (search) {
        where.OR = [
          { number: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { company: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
          where,
          include: {
            company: { select: { id: true, name: true, slug: true } },
            createdBy: {
              select: { id: true, name: true },
            },
            items: { select: { lineTotal: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.quote.count({ where }),
      ]);

      return {
        quotes: quotes.map((q) => ({
          ...q,
          total: q.items.reduce((sum, i) => sum + Number(i.lineTotal), 0),
          itemCount: q.items.length,
        })),
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      };
    }),

  // GET BY ID — Staff or own-company client (non-DRAFT)
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
        include: {
          company: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              savedProduct: {
                select: { id: true, name: true, thumbnailUrl: true },
              },
            },
          },
          changeRequests: {
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, name: true } },
            },
          },
          convertedOrder: {
            select: { id: true, number: true },
          },
          project: {
            select: { id: true, name: true, status: true, logoUrl: true },
          },
        },
      });

      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

      // Tenant check
      if (
        (user as any).role !== "CCC_STAFF" &&
        quote.companyId !== (user as any).companyId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Clients can't see drafts
      if (
        (user as any).role !== "CCC_STAFF" &&
        quote.status === "DRAFT"
      ) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        ...quote,
        total: quote.items.reduce((sum, i) => sum + Number(i.lineTotal), 0),
      };
    }),

  // CREATE — Staff only
  create: staffProcedure
    .input(
      z.object({
        companyId: z.string(),
        title: z.string().min(1),
        paymentTerms: PaymentTermsInput.optional(),
        expiresAt: z.string().datetime().optional(),
        notes: z.string().optional(),
        clientMessage: z.string().optional(),
        items: z.array(QuoteItemInput).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const number = await generateQuoteNumber(prisma as any);

      const quote = await prisma.quote.create({
        data: {
          number,
          companyId: input.companyId,
          createdByUserId: (user as any).id,
          title: input.title,
          paymentTermType:
            input.paymentTerms?.paymentTermType ?? "FULL",
          depositPercent: input.paymentTerms?.depositPercent,
          netDays: input.paymentTerms?.netDays,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          notes: input.notes,
          clientMessage: input.clientMessage,
          items: input.items
            ? {
                create: input.items.map((item, i) => ({
                  ...item,
                  sortOrder: item.sortOrder ?? i,
                  lineTotal: item.unitPrice * item.quantity,
                  sizeBreakdown: item.sizeBreakdown ?? undefined,
                })),
              }
            : undefined,
        },
        include: { items: true },
      });

      return quote;
    }),

  // UPDATE — Staff only, only DRAFT or CHANGES_REQUESTED quotes
  update: staffProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        paymentTerms: PaymentTermsInput.optional(),
        expiresAt: z.string().datetime().nullable().optional(),
        notes: z.string().optional(),
        clientMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(quote.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only edit DRAFT or CHANGES_REQUESTED quotes",
        });
      }

      return prisma.quote.update({
        where: { id: input.id },
        data: {
          title: input.title,
          paymentTermType: input.paymentTerms?.paymentTermType,
          depositPercent: input.paymentTerms?.depositPercent,
          netDays: input.paymentTerms?.netDays,
          expiresAt:
            input.expiresAt !== undefined
              ? input.expiresAt
                ? new Date(input.expiresAt)
                : null
              : undefined,
          notes: input.notes,
          clientMessage: input.clientMessage,
        },
      });
    }),

  // UPLOAD QUOTE MOCKUP — Staff only
  uploadMockup: staffProcedure
    .input(
      z.object({
        id: z.string(),
        mockupUrl: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

      return prisma.quote.update({
        where: { id: input.id },
        data: { mockupUrl: input.mockupUrl },
      });
    }),

  // UPLOAD ITEM MOCKUP — Staff only
  uploadItemMockup: staffProcedure
    .input(
      z.object({
        itemId: z.string(),
        mockupUrl: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await prisma.quoteItem.findUnique({
        where: { id: input.itemId },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      return prisma.quoteItem.update({
        where: { id: input.itemId },
        data: { mockupUrl: input.mockupUrl },
      });
    }),

  // ADD ITEM — Staff only
  addItem: staffProcedure
    .input(
      z.object({
        quoteId: z.string(),
        item: QuoteItemInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.quoteId },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(quote.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add items to this quote",
        });
      }

      return prisma.quoteItem.create({
        data: {
          quoteId: input.quoteId,
          ...input.item,
          lineTotal: input.item.unitPrice * input.item.quantity,
          sizeBreakdown: input.item.sizeBreakdown ?? undefined,
        },
      });
    }),

  // UPDATE ITEM — Staff only
  updateItem: staffProcedure
    .input(
      z.object({
        itemId: z.string(),
        item: QuoteItemInput.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.quoteItem.findUnique({
        where: { id: input.itemId },
        include: { quote: { select: { status: true } } },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(existing.quote.status)) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const unitPrice = input.item.unitPrice ?? Number(existing.unitPrice);
      const quantity = input.item.quantity ?? existing.quantity;

      return prisma.quoteItem.update({
        where: { id: input.itemId },
        data: {
          ...input.item,
          lineTotal: unitPrice * quantity,
          sizeBreakdown: input.item.sizeBreakdown ?? undefined,
        },
      });
    }),

  // REMOVE ITEM — Staff only
  removeItem: staffProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.quoteItem.findUnique({
        where: { id: input.itemId },
        include: { quote: { select: { status: true } } },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(existing.quote.status)) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return prisma.quoteItem.delete({ where: { id: input.itemId } });
    }),

  // REORDER ITEMS — Staff only
  reorderItems: staffProcedure
    .input(
      z.object({
        quoteId: z.string(),
        itemIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await prisma.$transaction(
        input.itemIds.map((id, index) =>
          prisma.quoteItem.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      );
      return { success: true };
    }),

  // SEND — Staff only, transitions DRAFT/CHANGES_REQUESTED → SENT
  send: staffProcedure
    .input(
      z.object({
        id: z.string(),
        clientMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(quote.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only send DRAFT or CHANGES_REQUESTED quotes",
        });
      }

      const updated = await prisma.quote.update({
        where: { id: input.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          clientMessage: input.clientMessage ?? quote.clientMessage,
        },
      });

      // Notify the client's admins (soft-fails if email isn't configured)
      const recipients = await clientAdminEmails(updated.companyId);
      if (recipients.length > 0) {
        const template = quoteSentEmail({
          quoteNumber: updated.number,
          quoteTitle: updated.title,
          quoteUrl: `${appBaseUrl()}/quotes/${updated.id}`,
        });
        await sendEmail({ to: recipients, ...template });
      }

      return updated;
    }),

  // APPROVE — Client Admin only, transitions SENT → APPROVED
  approve: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if ((user as any).role === "CCC_STAFF") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Staff cannot approve quotes",
        });
      }
      if ((user as any).role !== "CLIENT_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only client admins can approve quotes",
        });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (quote.companyId !== (user as any).companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (quote.status !== "SENT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only approve SENT quotes",
        });
      }

      return prisma.quote.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedByUserId: (user as any).id,
        },
      });
    }),

  // REQUEST CHANGES — Client (Admin or User), transitions SENT → CHANGES_REQUESTED
  requestChanges: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        message: z.string().min(1),
        itemComments: z
          .array(
            z.object({
              quoteItemId: z.string(),
              comment: z.string().min(1),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if ((user as any).role === "CCC_STAFF") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (quote.companyId !== (user as any).companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (quote.status !== "SENT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only request changes on SENT quotes",
        });
      }

      const [updatedQuote] = await prisma.$transaction([
        prisma.quote.update({
          where: { id: input.id },
          data: { status: "CHANGES_REQUESTED" },
        }),
        prisma.quoteChangeRequest.create({
          data: {
            quoteId: input.id,
            userId: (user as any).id,
            message: input.message,
            itemComments: input.itemComments ?? [],
          },
        }),
      ]);

      return updatedQuote;
    }),

  // DECLINE — Client Admin only, transitions SENT → DECLINED
  decline: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if ((user as any).role !== "CLIENT_ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (quote.companyId !== (user as any).companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (quote.status !== "SENT") {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return prisma.quote.update({
        where: { id: input.id },
        data: { status: "DECLINED", declinedAt: new Date() },
      });
    }),

  // CONVERT TO ORDER — Staff only, transitions APPROVED → CONVERTED
  convertToOrder: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
        include: { items: true },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (quote.status !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only convert APPROVED quotes",
        });
      }

      const orderNumber = await generateOrderNumber(prisma);
      const invoiceNumber = await generateInvoiceNumber(prisma);

      // Calculate total from quote items
      const totalAmount = quote.items.reduce(
        (sum, i) => sum + Number(i.lineTotal),
        0
      );

      // Create order, auto-invoice, and update quote in a transaction
      const [order] = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            number: orderNumber,
            companyId: quote.companyId,
            createdByUserId: (user as any).id,
            projectId: quote.projectId,
            quoteId: quote.id,
            title: quote.title,
            source: "QUOTE",
            status: "SUBMITTED",
            paymentTermType: quote.paymentTermType,
            depositPercent: quote.depositPercent,
            netDays: quote.netDays,
            totalAmount,
            items: {
              create: quote.items.map((item, idx) => ({
                sortOrder: idx,
                description: item.description,
                sku: item.sku,
                color: item.color,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                sizeBreakdown: item.sizeBreakdown ?? undefined,
                decorationNotes: item.decorationNotes,
                lineTotal: item.lineTotal,
              })),
            },
          },
        });

        // Auto-create invoice based on payment terms
        let invoiceItems: { description: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];

        if (quote.paymentTermType === "DEPOSIT" && quote.depositPercent) {
          // Create deposit invoice
          const depositAmount = totalAmount * (quote.depositPercent / 100);
          invoiceItems = [
            {
              description: `Deposit (${quote.depositPercent}%) for ${quote.title}`,
              quantity: 1,
              unitPrice: depositAmount,
              lineTotal: depositAmount,
            },
          ];
        } else {
          // FULL or NET — invoice for full amount
          invoiceItems = quote.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
          }));
        }

        // Calculate due date for NET terms
        let dueDate: Date | null = null;
        if (quote.paymentTermType === "NET" && quote.netDays) {
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + quote.netDays);
        }

        await tx.invoice.create({
          data: {
            number: invoiceNumber,
            orderId: order.id,
            companyId: quote.companyId,
            status: "DRAFT",
            dueDate,
            items: {
              create: invoiceItems,
            },
          },
        });

        await tx.quote.update({
          where: { id: quote.id },
          data: {
            status: "CONVERTED",
            convertedAt: new Date(),
          },
        });

        return [order];
      });

      return order;
    }),

  // LIST SAVED PRODUCTS — For catalog picker in quote builder
  listSavedProducts: staffProcedure
    .input(
      z.object({
        companyId: z.string(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { companyId: input.companyId };
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { sku: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return prisma.savedProduct.findMany({
        where,
        orderBy: { name: "asc" },
        take: 50,
      });
    }),

  // LIST COMPANIES — For company selector in quote builder
  listCompanies: staffProcedure.query(async () => {
    return prisma.company.findMany({
      where: { slug: { not: "central-creative" } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
  }),
});
