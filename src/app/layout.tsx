import type { Metadata } from "next";
import { Unbounded, Instrument_Sans } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import SceneLoader from "@/components/SceneLoader";
import { Preloader, Cursor, ProgressRail, BigWord, JukeboxDock, Magnetic } from "@/components/Chrome";
import "./globals.css";

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
  title: "hooked. — swipe your next favorite song",
  description:
    "A TikTok for music. We play the best 30 seconds of songs you've never heard — four swipes teach us your taste.",
  icons: { icon: "/hooked-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
