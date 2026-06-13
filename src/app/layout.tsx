import type { Metadata, Viewport } from "next";
import { Unbounded, Instrument_Sans } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import SceneLoader from "@/components/SceneLoader";
import { Preloader, Cursor, ProgressRail, BigWord, JukeboxDock, Magnetic } from "@/components/Chrome";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hookedcue.com";
const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.hookedcue.com";
const appUrl = configuredAppUrl.includes("localhost") ? siteUrl : configuredAppUrl;
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
  icons: {
    icon: "/hooked-icon.png",
    apple: "/hooked-icon.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "hooked.",
    title,
    description,
    images: [
      {
        url: "/06-home-library.png",
        width: 1200,
        height: 630,
        alt: "hooked. music discovery app home and library screens",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/06-home-library.png"],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${unbounded.variable} ${instrument.variable}`}>
        <SmoothScroll>
          <Preloader />
          <Cursor />
          <BigWord />
          <SceneLoader />
          <ProgressRail />
          <nav>
            <a className="wordmark" href="#" aria-label="back to top">
              hooked<i>.</i>
            </a>
            <Magnetic>
              <a className="nav-cta" href="#cta">
                get the app
              </a>
            </Magnetic>
          </nav>
          {children}
          <JukeboxDock />
          <div className="vignette" />
          <div className="grain" />
        </SmoothScroll>
      </body>
    </html>
  );
}
