"use client";

import { Sidebar } from "@/components/nav/sidebar";

interface SidebarWrapperProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    companyName: string;
  };
}

export function SidebarWrapper({ user }: SidebarWrapperProps) {
  return <Sidebar user={user} />;
}
