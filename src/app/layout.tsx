import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";

export const metadata: Metadata = {
  title: "CSuite - Admin Portal",
  description: "Central Creative Staff Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-csuite-bg text-csuite-text-primary antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
