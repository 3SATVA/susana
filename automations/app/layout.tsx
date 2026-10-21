import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YoniSync email automations",
  description: "Flowchart of Susana Puelles' email automations (replicated from systeme.io).",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbf6f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
