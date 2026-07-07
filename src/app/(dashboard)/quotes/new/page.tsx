import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";
import { QuoteBuilder } from "@/components/quotes/quote-builder";

export default async function NewQuotePage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "CCC_STAFF") {
    redirect("/quotes");
  }

  return <QuoteBuilder />;
}
