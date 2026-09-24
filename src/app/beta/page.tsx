import type { Metadata } from "next";
import Link from "next/link";
import BetaForm from "@/components/BetaForm";
import { appUrl, appLinkProps } from "@/lib/site";

const title = "join the beta";
const description =
  "Try hooked. in your browser, then join the Android closed test. Play Store invites go to the Google account you enter.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/beta" },
  openGraph: {
    type: "website",
    url: "/beta",
    siteName: "hooked.",
    title: `${title} | hooked.`,
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "hooked. beta signup" }],
  },
  robots: { index: true, follow: true },
};

export default function BetaPage() {
  return (
    <main id="main" className="beta-page">
      <nav className="beta-nav">
        <Link className="wordmark" href="/">
          hooked<i>.</i>
        </Link>
        <Link className="beta-back" href="/">
          ← back to the site
        </Link>
      </nav>

      <div className="beta-body">
        <header className="beta-head">
          <p className="sec-tag"><span>beta</span> — android closed test</p>
          <h1>
            come <span>break it.</span>
          </h1>
          <p className="beta-intro">
            android goes out through play store closed testing first, so all we need is the
            google account that&apos;s signed in on your phone — that address is how the invite
            reaches you. ios is further out than we&apos;d like.
          </p>
        </header>

        <section className="beta-card" aria-label="join the android beta">
          <BetaForm />
        </section>

        {/* the trial opens in a new tab on purpose, so this page is still here after */}
        <aside className="beta-try">
          <div>
            <b>not sure yet?</b>
            <span>the browser build is the real deck — every gesture, the moods, the vinyl save. no signup.</span>
          </div>
          <a className="btn-browser" href={appUrl} {...appLinkProps}>
            try it in your browser <span>→</span>
          </a>
        </aside>
      </div>

      <footer className="beta-foot">
        <span>
          <Link href="/privacy">privacy</Link> · <Link href="/terms">terms</Link> ·{" "}
          <Link href="/data-deletion">delete your data</Link>
        </span>
        <span>hooked. © 2026 · previews via itunes · your taste stays yours</span>
        <span>built in public by MiNUs, unaware</span>
      </footer>

      <div className="vignette" />
      <div className="grain" />
    </main>
  );
}
