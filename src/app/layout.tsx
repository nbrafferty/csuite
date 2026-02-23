import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/server/auth/types";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "C-Suite | Central Creative Co.",
  description: "Multi-tenant client order management portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
