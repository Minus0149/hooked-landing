import Link from "next/link";

/**
 * Legal pages: quiet, readable, and outside the (story) route group so they
 * don't pull in the WebGL scene or the preloader.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="legal-page">
      <nav className="beta-nav">
        <Link className="wordmark" href="/">
          hooked<i>.</i>
        </Link>
        <Link className="beta-back" href="/">
          ← back to the site
        </Link>
      </nav>

      <div className="legal-body">{children}</div>

      <footer className="legal-foot">
        <span>
          <Link href="/privacy">privacy</Link> · <Link href="/terms">terms</Link> ·{" "}
          <Link href="/data-deletion">delete your data</Link>
        </span>
        <span>hooked. © 2026 · previews via itunes</span>
      </footer>

      <div className="vignette" />
      <div className="grain" />
    </main>
  );
}
