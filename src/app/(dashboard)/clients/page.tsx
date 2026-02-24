import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";
import { ClientsView } from "./clients-view";

export default async function ClientsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "CCC_STAFF") {
    redirect("/");
  }

  return <ClientsView />;
}
