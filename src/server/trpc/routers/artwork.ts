import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/db/prisma";
import { buildS3Key, getPresignedUploadUrl, getPublicUrl } from "@/server/lib/s3";

const ARTWORK_INCLUDE = {
  versions: {
    orderBy: { versionNumber: "desc" as const },
    take: 1,
    include: {
      uploader: { select: { id: true, name: true } },
    },
  },
  tags: { select: { id: true, tag: true } },
  orderArtworkLinks: {
    include: { order: { select: { id: true, number: true, title: true } } },
  },
  quoteArtworkLinks: {
    include: { quote: { select: { id: true, number: true, title: true } } },
  },
  creator: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
};

const FULL_INCLUDE = {
  versions: {
    orderBy: { versionNumber: "desc" as const },
    include: {
      uploader: { select: { id: true, name: true, email: true } },
    },
  },
  tags: { select: { id: true, tag: true } },
  orderArtworkLinks: {
    include: {
      order: { select: { id: true, number: true, title: true, status: true } },
    },
  },
  quoteArtworkLinks: {
    include: {
      quote: { select: { id: true, number: true, title: true, status: true } },
    },
  },
  creator: { select: { id: true, name: true, email: true } },
  company: { select: { id: true, name: true } },
};

export const artworkRouter = router({
  // LIST — library page
  list: protectedProcedure
    .input(
      z
        .object({
          tag: z.string().optional(),
          fileType: z.string().optional(),
          sourceType: z.string().optional(),
          orderId: z.string().optional(),
          quoteId: z.string().optional(),
          search: z.string().optional(),
          page: z.number().int().default(1),
          perPage: z.number().int().default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const {
        tag,
        fileType,
        sourceType,
        orderId,
        quoteId,
        search,
        page = 1,
        perPage = 50,
      } = input ?? {};

      const where: any = {};

      if (!isStaff) {
        where.companyId = ctx.companyId;
      }

      if (tag) {
        where.tags = { some: { tag } };
      }
      if (fileType) {
        where.fileType = fileType;
      }
      if (sourceType) {
        where.versions = { some: { sourceType } };
      }
      if (orderId) {
        where.orderArtworkLinks = { some: { orderId } };
      }
      if (quoteId) {
        where.quoteArtworkLinks = { some: { quoteId } };
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { filename: { contains: search, mode: "insensitive" } },
          { tags: { some: { tag: { contains: search, mode: "insensitive" } } } },
        ];
      }

      const [artworks, total] = await Promise.all([
        prisma.artworkAsset.findMany({
          where,
          include: ARTWORK_INCLUDE,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.artworkAsset.count({ where }),
      ]);

      return { artworks, total, page, perPage };
    }),

  // GET BY ID — full detail
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const artwork = await prisma.artworkAsset.findUnique({
        where: { id: input.id },
        include: FULL_INCLUDE,
      });
      if (!artwork) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isStaff && artwork.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return artwork;
    }),

  // LIST BY ORDER
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

      return prisma.orderArtworkLink.findMany({
        where: { orderId: input.orderId },
        include: {
          artworkAsset: {
            include: {
              versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
              },
              tags: { select: { tag: true } },
            },
          },
        },
      });
    }),

  // LIST BY QUOTE
  listByQuote: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const quote = await prisma.quote.findUnique({
        where: { id: input.quoteId },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isStaff && quote.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return prisma.artworkQuoteLink.findMany({
        where: { quoteId: input.quoteId },
        include: {
          artwork: {
            include: {
              versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
              },
              tags: { select: { tag: true } },
            },
          },
        },
      });
    }),

  // LIST TAGS — for autocomplete
  listTags: protectedProcedure.query(async ({ ctx }) => {
    const isStaff = ctx.role === "CCC_STAFF";
    const where: any = {};
    if (!isStaff) {
      where.artwork = { companyId: ctx.companyId };
    }
    const tags = await prisma.artworkTag.findMany({
      where,
      select: { tag: true },
      distinct: ["tag"],
      orderBy: { tag: "asc" },
    });
    return tags.map((t: any) => t.tag);
  }),

  // GET UPLOAD URL — presigned S3 URL
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        artworkId: z.string().optional(),
        versionNumber: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const artworkId = input.artworkId ?? "new-" + Date.now();
      const versionNumber = input.versionNumber ?? 1;
      const tenantId = ctx.companyId ?? "global";
      const s3Key = buildS3Key(tenantId, artworkId, versionNumber, input.fileName);
      const uploadUrl = await getPresignedUploadUrl(s3Key, input.contentType);
      const publicUrl = getPublicUrl(s3Key);

      return { uploadUrl, s3Key, publicUrl };
    }),

  // CREATE NATIVE — after S3 upload completes
  createNative: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        fileName: z.string(),
        fileSize: z.number().int(),
        mimeType: z.string(),
        s3Key: z.string(),
        fileUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        tags: z.array(z.string()).default([]),
        orderIds: z.array(z.string()).default([]),
        quoteIds: z.array(z.string()).default([]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const companyId = isStaff ? (ctx.companyId ?? "global") : ctx.companyId;
      const ext = input.fileName.split(".").pop()?.toLowerCase() ?? null;

      return prisma.artworkAsset.create({
        data: {
          companyId,
          name: input.name,
          description: input.description,
          filename: input.fileName,
          fileType: ext,
          createdBy: ctx.user.id,
          versions: {
            create: {
              versionNumber: 1,
              fileName: input.fileName,
              fileUrl: input.fileUrl,
              fileSize: input.fileSize,
              mimeType: input.mimeType,
              sourceType: "NATIVE",
              s3Key: input.s3Key,
              thumbnailUrl: input.thumbnailUrl,
              uploadedBy: ctx.user.id,
              notes: input.notes,
            },
          },
          tags:
            input.tags.length > 0
              ? { create: input.tags.map((tag) => ({ tag })) }
              : undefined,
          orderArtworkLinks:
            input.orderIds.length > 0
              ? {
                  create: input.orderIds.map((orderId) => ({
                    orderId,
                    linkedByUserId: ctx.user.id,
                  })),
                }
              : undefined,
          quoteArtworkLinks:
            input.quoteIds.length > 0
              ? {
                  create: input.quoteIds.map((quoteId) => ({
                    quoteId,
                    linkedByUserId: ctx.user.id,
                  })),
                }
              : undefined,
        },
        include: ARTWORK_INCLUDE,
      });
    }),

  // CREATE FROM DROPBOX
  createFromDropbox: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        fileName: z.string(),
        fileSize: z.number().int(),
        dropboxLink: z.string(),
        dropboxPath: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        tags: z.array(z.string()).default([]),
        orderIds: z.array(z.string()).default([]),
        quoteIds: z.array(z.string()).default([]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const companyId = isStaff ? (ctx.companyId ?? "global") : ctx.companyId;
      const ext = input.fileName.split(".").pop()?.toLowerCase() ?? null;

      return prisma.artworkAsset.create({
        data: {
          companyId,
          name: input.name,
          description: input.description,
          filename: input.fileName,
          fileType: ext,
          createdBy: ctx.user.id,
          versions: {
            create: {
              versionNumber: 1,
              fileName: input.fileName,
              fileUrl: input.dropboxLink,
              fileSize: input.fileSize,
              mimeType: "application/octet-stream",
              sourceType: "DROPBOX",
              dropboxLink: input.dropboxLink,
              dropboxPath: input.dropboxPath,
              thumbnailUrl: input.thumbnailUrl,
              uploadedBy: ctx.user.id,
              notes: input.notes,
            },
          },
          tags:
            input.tags.length > 0
              ? { create: input.tags.map((tag) => ({ tag })) }
              : undefined,
          orderArtworkLinks:
            input.orderIds.length > 0
              ? {
                  create: input.orderIds.map((orderId) => ({
                    orderId,
                    linkedByUserId: ctx.user.id,
                  })),
                }
              : undefined,
          quoteArtworkLinks:
            input.quoteIds.length > 0
              ? {
                  create: input.quoteIds.map((quoteId) => ({
                    quoteId,
                    linkedByUserId: ctx.user.id,
                  })),
                }
              : undefined,
        },
        include: ARTWORK_INCLUDE,
      });
    }),

  // CREATE FROM GOOGLE DRIVE
  createFromGoogleDrive: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        fileName: z.string(),
        fileSize: z.number().int(),
        googleDriveFileId: z.string(),
        googleDriveLink: z.string(),
        mimeType: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        tags: z.array(z.string()).default([]),
        orderIds: z.array(z.string()).default([]),
        quoteIds: z.array(z.string()).default([]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const companyId = isStaff ? (ctx.companyId ?? "global") : ctx.companyId;
      const ext = input.fileName.split(".").pop()?.toLowerCase() ?? null;

      return prisma.artworkAsset.create({
        data: {
          companyId,
          name: input.name,
          description: input.description,
          filename: input.fileName,
          fileType: ext,
          createdBy: ctx.user.id,
          versions: {
            create: {
              versionNumber: 1,
              fileName: input.fileName,
              fileUrl: input.googleDriveLink,
              fileSize: input.fileSize,
              mimeType: input.mimeType ?? "application/octet-stream",
              sourceType: "GOOGLE_DRIVE",
              googleDriveFileId: input.googleDriveFileId,
              googleDriveLink: input.googleDriveLink,
              thumbnailUrl: input.thumbnailUrl,
              uploadedBy: ctx.user.id,
              notes: input.notes,
            },
          },
          tags:
            input.tags.length > 0
              ? { create: input.tags.map((tag) => ({ tag })) }
              : undefined,
          orderArtworkLinks:
            input.orderIds.length > 0
              ? {
                  create: input.orderIds.map((orderId) => ({
                    orderId,
                    linkedByUserId: ctx.user.id,
                  })),
                }
              : undefined,
          quoteArtworkLinks:
            input.quoteIds.length > 0
              ? {
                  create: input.quoteIds.map((quoteId) => ({
                    quoteId,
                    linkedByUserId: ctx.user.id,
                  })),
                }
              : undefined,
        },
        include: ARTWORK_INCLUDE,
      });
    }),

  // ADD VERSION
  addVersion: protectedProcedure
    .input(
      z.object({
        artworkId: z.string(),
        fileName: z.string(),
        fileSize: z.number().int(),
        mimeType: z.string(),
        fileUrl: z.string(),
        sourceType: z.enum(["NATIVE", "DROPBOX", "GOOGLE_DRIVE"]),
        s3Key: z.string().optional(),
        dropboxLink: z.string().optional(),
        googleDriveFileId: z.string().optional(),
        googleDriveLink: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const artwork = await prisma.artworkAsset.findUnique({
        where: { id: input.artworkId },
      });
      if (!artwork) throw new TRPCError({ code: "NOT_FOUND" });

      const isStaff = ctx.role === "CCC_STAFF";
      if (!isStaff && artwork.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const newVersion = artwork.currentVersion + 1;

      await prisma.artworkVersion.create({
        data: {
          artworkId: input.artworkId,
          versionNumber: newVersion,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          sourceType: input.sourceType,
          s3Key: input.s3Key,
          dropboxLink: input.dropboxLink,
          googleDriveFileId: input.googleDriveFileId,
          googleDriveLink: input.googleDriveLink,
          thumbnailUrl: input.thumbnailUrl,
          uploadedBy: ctx.user.id,
          notes: input.notes,
        },
      });

      return prisma.artworkAsset.update({
        where: { id: input.artworkId },
        data: { currentVersion: newVersion },
        include: FULL_INCLUDE,
      });
    }),

  // ADD TAG
  addTag: protectedProcedure
    .input(z.object({ artworkId: z.string(), tag: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const artwork = await prisma.artworkAsset.findUnique({
        where: { id: input.artworkId },
      });
      if (!artwork) throw new TRPCError({ code: "NOT_FOUND" });
      const isStaff = ctx.role === "CCC_STAFF";
      if (!isStaff && artwork.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return prisma.artworkTag.create({
        data: { artworkId: input.artworkId, tag: input.tag.trim() },
      });
    }),

  // REMOVE TAG
  removeTag: protectedProcedure
    .input(z.object({ artworkId: z.string(), tag: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.artworkTag.deleteMany({
        where: { artworkId: input.artworkId, tag: input.tag },
      });
    }),

  // LINK TO ORDER
  linkToOrder: protectedProcedure
    .input(
      z.object({
        artworkId: z.string(),
        orderId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.orderArtworkLink.create({
        data: {
          artworkAssetId: input.artworkId,
          orderId: input.orderId,
          linkedByUserId: ctx.user.id,
          notes: input.notes,
        },
      });
    }),

  // UNLINK FROM ORDER
  unlinkFromOrder: protectedProcedure
    .input(z.object({ artworkId: z.string(), orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.orderArtworkLink.deleteMany({
        where: { artworkAssetId: input.artworkId, orderId: input.orderId },
      });
    }),

  // LINK TO QUOTE
  linkToQuote: protectedProcedure
    .input(
      z.object({
        artworkId: z.string(),
        quoteId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.artworkQuoteLink.create({
        data: {
          artworkId: input.artworkId,
          quoteId: input.quoteId,
          linkedByUserId: ctx.user.id,
          notes: input.notes,
        },
      });
    }),

  // UNLINK FROM QUOTE
  unlinkFromQuote: protectedProcedure
    .input(z.object({ artworkId: z.string(), quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.artworkQuoteLink.deleteMany({
        where: { artworkId: input.artworkId, quoteId: input.quoteId },
      });
    }),

  // UPDATE
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const artwork = await prisma.artworkAsset.findUnique({
        where: { id: input.id },
      });
      if (!artwork) throw new TRPCError({ code: "NOT_FOUND" });
      const isStaff = ctx.role === "CCC_STAFF";
      if (!isStaff && artwork.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const data: any = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.description !== undefined) data.description = input.description;

      return prisma.artworkAsset.update({
        where: { id: input.id },
        data,
      });
    }),

  // DELETE
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const artwork = await prisma.artworkAsset.findUnique({
        where: { id: input.id },
      });
      if (!artwork) throw new TRPCError({ code: "NOT_FOUND" });
      const isStaff = ctx.role === "CCC_STAFF";
      if (!isStaff && artwork.createdBy !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Can only delete artwork you uploaded",
        });
      }
      return prisma.artworkAsset.delete({ where: { id: input.id } });
    }),
});
