import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shelby File Vault",
  description: "Upload, manage, and retrieve files through Shelby decentralized storage.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
