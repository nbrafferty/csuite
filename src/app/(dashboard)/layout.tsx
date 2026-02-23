import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarWrapper } from "./sidebar-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    email: session.user.email,
    role: session.user.role,
    companyName: session.user.companyName,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarWrapper user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
