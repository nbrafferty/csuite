import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

// ─── Helpers ────────────────────────────────────────────────────────

const isStaff = (role: string) => role === "CCC_STAFF";
const isClient = (role: string) => role === "CLIENT_ADMIN" || role === "CLIENT_USER";

function stripInternalComments(version: any, role: string) {
  if (isStaff(role)) return version;
  return {
    ...version,
    annotations: version.annotations.map((a: any) => ({
      ...a,
      comments: a.comments.filter((c: any) => !c.isInternal),
    })),
  };
}

// ─── Router ─────────────────────────────────────────────────────────

export const proofRouter = router({
  // ── Queries ──────────────────────────────────────────────────────

  /** List proofs, optionally filtered by orderId or quoteId. */
  list: protectedProcedure
    .input(
      z.object({
        orderId: z.string().optional(),
        quoteId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.orderId) where.orderId = input.orderId;
      if (input.quoteId) where.quoteId = input.quoteId;

      if (isStaff(ctx.role)) {
        // Staff sees all proofs
      } else {
        // Clients see only their company's proofs
        where.companyId = ctx.companyId;
      }

      const proofs = await prisma.proof.findMany({
        where,
        include: {
          currentVersion: true,
          _count: { select: { versions: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!isStaff(ctx.role)) {
        // Filter out proofs whose current version is still DRAFT
        return proofs.filter(
          (p) => p.currentVersion && p.currentVersion.status !== "DRAFT"
        );
      }

      return proofs;
    }),

  /** Get a single proof with full version details. */
  byId: protectedProcedure
    .input(
      z.object({
        proofId: z.string(),
        versionId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const proof = await prisma.proof.findUnique({
        where: { id: input.proofId },
        include: {
          company: { select: { name: true } },
          order: { select: { number: true } },
          versions: {
            orderBy: { versionNumber: "desc" },
            select: { id: true, versionNumber: true, status: true },
          },
        },
      });

      if (!proof) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proof not found" });
      }

      // Tenant isolation for clients
      if (!isStaff(ctx.role) && proof.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Determine which version to load
      const versionId = input.versionId ?? proof.currentVersionId;
      if (!versionId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No version available",
        });
      }

      const version = await prisma.proofVersion.findUnique({
        where: { id: versionId },
        include: {
          assets: { orderBy: { position: "asc" } },
          annotations: {
            orderBy: { seq: "asc" },
            include: {
              author: { select: { id: true, name: true, role: true } },
              comments: {
                orderBy: { createdAt: "asc" },
                include: {
                  author: { select: { id: true, name: true, role: true } },
                },
              },
            },
          },
          approvals: {
            orderBy: { createdAt: "desc" },
            include: {
              signedBy: { select: { id: true, name: true, role: true } },
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        });
      }

      // Clients cannot see DRAFT versions
      if (!isStaff(ctx.role) && version.status === "DRAFT") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      // Strip internal comments for non-staff
      const sanitizedVersion = stripInternalComments(version, ctx.role);

      return {
        ...proof,
        version: sanitizedVersion,
      };
    }),

  // ── Staff Mutations ──────────────────────────────────────────────

  /** Create a new proof with an initial DRAFT version. */
  create: staffProcedure
    .input(
      z.object({
        title: z.string().min(1),
        orderId: z.string().optional(),
        quoteId: z.string().optional(),
        companyId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const proof = await prisma.proof.create({
        data: {
          title: input.title,
          companyId: input.companyId,
          orderId: input.orderId,
          quoteId: input.quoteId,
          createdById: ctx.user.id,
          versions: {
            create: {
              versionNumber: 1,
              status: "DRAFT",
            },
          },
        },
        include: {
          versions: true,
        },
      });

      // Set the currentVersionId to the newly created version
      const firstVersion = proof.versions[0];
      const updated = await prisma.proof.update({
        where: { id: proof.id },
        data: { currentVersionId: firstVersion.id },
        include: { currentVersion: true },
      });

      return updated;
    }),

  /** Record an uploaded asset for a proof version. */
  confirmAsset: staffProcedure
    .input(
      z.object({
        versionId: z.string(),
        s3Key: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        kind: z.enum(["IMAGE", "PDF"]),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        pageCount: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Auto-increment position
      const maxPositionAsset = await prisma.proofAsset.findFirst({
        where: { versionId: input.versionId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const nextPosition = (maxPositionAsset?.position ?? -1) + 1;

      return prisma.proofAsset.create({
        data: {
          versionId: input.versionId,
          s3Key: input.s3Key,
          fileName: input.fileName,
          mimeType: input.mimeType,
          kind: input.kind,
          width: input.width,
          height: input.height,
          pageCount: input.pageCount,
          position: nextPosition,
        },
      });
    }),

  /** Publish a DRAFT version: transitions DRAFT -> SENT. */
  publish: staffProcedure
    .input(
      z.object({
        versionId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const version = await prisma.proofVersion.findUnique({
        where: { id: input.versionId },
      });

      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      if (version.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only DRAFT versions can be published",
        });
      }

      const [updatedVersion] = await prisma.$transaction([
        prisma.proofVersion.update({
          where: { id: input.versionId },
          data: {
            status: "SENT",
            notes: input.notes,
            publishedAt: new Date(),
            publishedById: ctx.user.id,
          },
        }),
        prisma.proof.update({
          where: { id: version.proofId },
          data: { currentVersionId: input.versionId },
        }),
      ]);

      return updatedVersion;
    }),

  /** Create a new revision from an existing version. */
  createRevision: staffProcedure
    .input(
      z.object({
        proofId: z.string(),
        fromVersionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.$transaction(async (tx) => {
        // Find the latest version number for this proof
        const latestVersion = await tx.proofVersion.findFirst({
          where: { proofId: input.proofId },
          orderBy: { versionNumber: "desc" },
          select: { versionNumber: true },
        });

        if (!latestVersion) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No versions found for this proof",
          });
        }

        // Mark the fromVersion as SUPERSEDED
        await tx.proofVersion.update({
          where: { id: input.fromVersionId },
          data: { status: "SUPERSEDED" },
        });

        // Create the new DRAFT version
        const newVersion = await tx.proofVersion.create({
          data: {
            proofId: input.proofId,
            versionNumber: latestVersion.versionNumber + 1,
            status: "DRAFT",
          },
        });

        return newVersion;
      });
    }),

  // ── Annotation Mutations ─────────────────────────────────────────

  /** Add an annotation to a version. */
  addAnnotation: protectedProcedure
    .input(
      z.object({
        versionId: z.string(),
        assetId: z.string(),
        type: z.enum(["PIN", "REGION"]),
        page: z.number().int().optional(),
        x: z.number(),
        y: z.number(),
        w: z.number().optional(),
        h: z.number().optional(),
        body: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check version status
      const version = await prisma.proofVersion.findUnique({
        where: { id: input.versionId },
        select: { status: true },
      });

      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      if (version.status === "APPROVED" || version.status === "SUPERSEDED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot annotate an APPROVED or SUPERSEDED version",
        });
      }

      // Auto-increment seq
      const maxSeqAnnotation = await prisma.proofAnnotation.findFirst({
        where: { versionId: input.versionId },
        orderBy: { seq: "desc" },
        select: { seq: true },
      });
      const nextSeq = (maxSeqAnnotation?.seq ?? 0) + 1;

      // Create annotation with initial comment
      const annotation = await prisma.proofAnnotation.create({
        data: {
          versionId: input.versionId,
          assetId: input.assetId,
          type: input.type,
          page: input.page ?? 0,
          x: input.x,
          y: input.y,
          w: input.w,
          h: input.h,
          seq: nextSeq,
          authorId: ctx.user.id,
          comments: {
            create: {
              authorId: ctx.user.id,
              body: input.body,
              isInternal: false,
            },
          },
        },
        include: {
          comments: true,
          author: { select: { id: true, name: true, role: true } },
        },
      });

      return annotation;
    }),

  /** Add a comment to an existing annotation. */
  addComment: protectedProcedure
    .input(
      z.object({
        annotationId: z.string(),
        body: z.string().min(1),
        isInternal: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only staff can post internal comments
      if (input.isInternal && !isStaff(ctx.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only staff can post internal comments",
        });
      }

      // Check version status via annotation
      const annotation = await prisma.proofAnnotation.findUnique({
        where: { id: input.annotationId },
        include: {
          version: { select: { status: true } },
        },
      });

      if (!annotation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Annotation not found",
        });
      }

      if (
        annotation.version.status === "APPROVED" ||
        annotation.version.status === "SUPERSEDED"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot comment on a locked version",
        });
      }

      return prisma.proofAnnotationComment.create({
        data: {
          annotationId: input.annotationId,
          authorId: ctx.user.id,
          body: input.body,
          isInternal: input.isInternal ?? false,
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });
    }),

  /** Set the status of an annotation (OPEN / RESOLVED). */
  setAnnotationStatus: protectedProcedure
    .input(
      z.object({
        annotationId: z.string(),
        status: z.enum(["OPEN", "RESOLVED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const annotation = await prisma.proofAnnotation.findUnique({
        where: { id: input.annotationId },
      });

      if (!annotation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Annotation not found",
        });
      }

      // Staff can resolve anything; clients can only resolve their own
      if (!isStaff(ctx.role) && annotation.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only resolve your own annotations",
        });
      }

      const data: any = { status: input.status };

      if (input.status === "RESOLVED") {
        data.resolvedById = ctx.user.id;
        data.resolvedAt = new Date();
      } else {
        // Re-opening: clear resolved fields
        data.resolvedById = null;
        data.resolvedAt = null;
      }

      return prisma.proofAnnotation.update({
        where: { id: input.annotationId },
        data,
      });
    }),

  // ── Client Decision ──────────────────────────────────────────────

  /** Client approves or requests changes on a proof version. */
  decide: protectedProcedure
    .input(
      z.object({
        versionId: z.string(),
        decision: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
        signedName: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only clients can make decisions
      if (!isClient(ctx.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can approve or request changes",
        });
      }

      const version = await prisma.proofVersion.findUnique({
        where: { id: input.versionId },
        include: {
          proof: { select: { companyId: true } },
          annotations: {
            where: { status: "OPEN" },
            select: { id: true },
          },
        },
      });

      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      // Tenant isolation
      if (version.proof.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Can only decide on SENT versions
      if (version.status !== "SENT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only decide on SENT versions",
        });
      }

      // Approval requires signedName and no open annotations
      if (input.decision === "APPROVED") {
        if (!input.signedName) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "signedName is required for approval",
          });
        }

        if (version.annotations.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "All annotations must be resolved before approval",
          });
        }
      }

      return prisma.$transaction(async (tx) => {
        // Create ProofApproval record
        const approval = await tx.proofApproval.create({
          data: {
            versionId: input.versionId,
            decision: input.decision,
            signedName: input.signedName ?? "",
            signedById: ctx.user.id,
            note: input.note,
          },
        });

        // Update version status
        await tx.proofVersion.update({
          where: { id: input.versionId },
          data: {
            status: input.decision === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED",
          },
        });

        return approval;
      });
    }),
});
