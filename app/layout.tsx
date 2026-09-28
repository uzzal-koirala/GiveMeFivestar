import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL), // turns relative links (og images, canonicals) into full URLs
  title: { default: "Give Me Five Star: AI Google reviews for local businesses", template: "%s | Give Me Five Star" },
  description: "Customers scan your QR code, rate their visit and AI writes an honest Google review in seconds. Made for local businesses everywhere.",
  openGraph: { siteName: "Give Me Five Star", type: "website", locale: "en_NP" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} data-scroll-behavior="smooth">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
