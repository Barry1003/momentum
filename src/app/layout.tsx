import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentum | Grow Together",
  description: "Your small-group space for everyday progress, habits, and accountability.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
