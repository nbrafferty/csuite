import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C-Suite | Central Creative Co",
  description: "Order management portal for Central Creative Co",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
