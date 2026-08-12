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
    <main className="beta-page">
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
            two steps. play it in the browser first — it&apos;s the whole app, no signup — and if
            it earns a place on your phone, the form below gets you into the android test.
          </p>
        </header>

        {/* step 1 — the trial. opens in a new tab on purpose, so this page and the
            form are still sitting here when they come back. */}
        <section className="beta-step">
          <div className="beta-step-n">01</div>
          <div className="beta-step-body">
            <h2>play with it first</h2>
            <p>
              the browser build is the real deck — 118 hooks, all four gestures, the vinyl save.
              nothing to install and nothing to sign up for. give it four swipes.
            </p>
            <a className="btn-primary" href={appUrl} {...appLinkProps}>
              try it in your browser
            </a>
            <span className="beta-step-note">opens in a new tab · this page stays put</span>
          </div>
        </section>

        {/* step 2 — the form */}
        <section className="beta-step">
          <div className="beta-step-n">02</div>
          <div className="beta-step-body">
            <h2>then get it on your phone</h2>
            <p>
              android goes out through <b>play store closed testing</b>{" "}
              first, so i need the google account that&apos;s signed in on your phone — that
              address is the only way the invite can reach you. the rest just tells me which genres
              to load and which phones to stop breaking. ios is further out than i&apos;d like.
            </p>
            <div className="beta-shell">
              <BetaForm />
            </div>
            <p className="cta-note">free · no ads, no tracking, no idea what we&apos;re doing</p>
          </div>
        </section>
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
