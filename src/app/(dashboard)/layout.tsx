import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-11">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
