import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "B+ive | Blood Credit Exchange",
  description:
    "B+ive synchronizes donors, recipients, organizations, and government authorities through a consent-driven blood credit ledger."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="gradient-overlay min-h-screen">
        <div className="absolute inset-0 -z-10 bg-slate-950/90" aria-hidden />
        <TopNav />
        <div className="pt-24">{children}</div>
      </body>
    </html>
  );
}
