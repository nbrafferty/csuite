import { PrismaClient } from "@prisma/client";

export async function generateQuoteNumber(prisma: PrismaClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;

  const last = await prisma.quote.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
  });

  const nextNum = last
    ? parseInt(last.number.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
