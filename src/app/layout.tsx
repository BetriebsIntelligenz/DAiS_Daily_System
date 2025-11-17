import type { Metadata } from "next";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DAiS | Programme, Score & Rewards",
  description:
    "Mobile-first DAiS companion for programme execution, XP tracking, rewards, and journals."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="font-sans">{children}</body>
    </html>
  );
}
