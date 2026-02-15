import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panda AI - Multi-Model AI Platform",
  description: "Beautiful, powerful, and extensible AI agent platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
