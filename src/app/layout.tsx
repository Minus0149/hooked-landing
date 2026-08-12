import type { Metadata, Viewport } from "next";
import { Unbounded, Instrument_Sans } from "next/font/google";
import "./globals.css";

import { appUrl, siteUrl } from "@/lib/site";

const title = "hooked. - Swipe your next favorite song";
const description =
  "hooked. is a swipe-based music discovery app that plays the best 30 seconds of new songs, learns your taste from four gestures, and saves the tracks you love.";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--display",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--body",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "hooked.",
  title: {
    default: title,
    template: "%s | hooked.",
  },
  description,
  keywords: [
    "music discovery app",
    "swipe music app",
    "discover new songs",
    "song recommendation app",
    "find new music",
    "30 second song previews",
    "Android music app",
  ],
  creator: "MiNUs, unaware",
  publisher: "hooked.",
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/hooked-icon.png", sizes: "1024x1024", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "hooked.",
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "hooked. swipe-based music discovery app preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "music",
};

export const viewport: Viewport = {
  themeColor: "#08080C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "hooked.",
    url: siteUrl,
    description,
    potentialAction: {
      "@type": "ViewAction",
      target: appUrl,
      name: "Try hooked. in your browser",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      {/* the scroll-story chrome lives in (story)/layout.tsx, not here — see the
          note there for why /beta must not inherit it */}
      <body className={`${unbounded.variable} ${instrument.variable}`}>{children}</body>
    </html>
  );
}
