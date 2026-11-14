import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentum | Engineering Foundation",
  description: "Momentum helps small groups grow through shared accountability.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
