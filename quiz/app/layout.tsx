import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

const title = "Discover Your Fertility Type | YoniSync";
const description =
  "Take Susana's free 2-minute quiz to discover your unique Chinese-medicine FERTILITY TYPE, plus the herbs, foods & lifestyle tips that fit your body.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "YoniSync",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Discover Your Fertility Type | YoniSync" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E7E6E1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
