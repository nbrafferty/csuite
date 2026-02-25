import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";
import { QuotesView } from "./quotes-view";

export default async function QuotesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "CCC_STAFF") {
    redirect("/");
  }

  return <QuotesView />;
}
