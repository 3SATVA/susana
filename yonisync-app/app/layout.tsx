import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Pinyon_Script, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Yoni Sync · App demo",
  description: "Cycle-synced nourishment, courses and care with Susana Puelles, L.Ac. (demo)",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF5F2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
