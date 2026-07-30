import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shelby File Vault",
  description: "Upload, manage, and retrieve files through Shelby decentralized storage.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
