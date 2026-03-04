import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { ShipmentStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const shipmentRouter = router({
  // LIST by order
  list: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.shipment.findMany({
        where: { orderId: input.orderId },
        include: { location: true },
        orderBy: { createdAt: "asc" },
      });
    }),

  // GET single shipment
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.shipment.findFirst({
        where: { id: input.id },
        include: {
          location: true,
          order: { select: { id: true, number: true, title: true, companyId: true } },
        },
      });
    }),

  // CREATE — staff only
  create: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        locationId: z.string().uuid().optional(),
        addressName: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().optional(),
        addressZip: z.string().optional(),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        trackingUrl: z.string().optional(),
        contents: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.orderId } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      return prisma.shipment.create({
        data: {
          orderId: input.orderId,
          locationId: input.locationId,
          addressName: input.addressName,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          addressCity: input.addressCity,
          addressState: input.addressState,
          addressZip: input.addressZip,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          trackingUrl: input.trackingUrl,
          contents: input.contents,
        },
      });
    }),

  // UPDATE — staff only
  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        trackingUrl: z.string().optional(),
        contents: z.string().optional(),
        status: z.nativeEnum(ShipmentStatus).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const shipment = await prisma.shipment.findFirst({ where: { id } });
      if (!shipment) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: any = {};
      if (data.carrier !== undefined) updateData.carrier = data.carrier;
      if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
      if (data.trackingUrl !== undefined) updateData.trackingUrl = data.trackingUrl;
      if (data.contents !== undefined) updateData.contents = data.contents;
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "IN_TRANSIT") updateData.shippedAt = new Date();
        if (data.status === "DELIVERED") updateData.deliveredAt = new Date();
      }

      return prisma.shipment.update({ where: { id }, data: updateData });
    }),

  // DELETE — staff only
  remove: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await prisma.shipment.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
