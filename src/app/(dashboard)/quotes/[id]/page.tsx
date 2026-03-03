import { auth } from "@/server/auth/auth";
import { QuoteBuilder } from "@/components/quotes/quote-builder";
import { QuoteClientDetail } from "@/components/quotes/quote-client-detail";

type Props = {
  params: { id: string };
};

export default async function QuoteDetailPage({ params }: Props) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isStaff = role === "CCC_STAFF";

  if (isStaff) {
    return <QuoteBuilder quoteId={params.id} />;
  }

  return <QuoteClientDetail quoteId={params.id} />;
}
