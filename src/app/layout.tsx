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
      <body style={{ background: "#0D0D0F", color: "#FFFFFF", margin: 0 }}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
