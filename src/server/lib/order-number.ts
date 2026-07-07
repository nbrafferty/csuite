import { PrismaClient } from "@prisma/client";

export async function generateOrderNumber(prisma: PrismaClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  const last = await prisma.order.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
  });

  const nextNum = last
    ? parseInt(last.number.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
