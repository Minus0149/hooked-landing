import type { Metadata } from "next";
import Link from "next/link";
import { appUrl, appLinkProps } from "@/lib/site";

export const metadata: Metadata = {
  title: "not found",
  robots: { index: false, follow: true },
};

/**
 * Unmatched URLs land here. It renders inside the root layout, which is now just
 * html/body/fonts — the scroll-story chrome lives in (story), so a 404 doesn't
 * boot a WebGL scene to say "this isn't here".
 */
export default function NotFound() {
  return (
    <main id="main" className="oops-page">
      <nav className="beta-nav">
        <Link className="wordmark" href="/">
          hooked<i>.</i>
        </Link>
        <Link className="beta-back" href="/">
          ← back to the site
        </Link>
      </nav>

      <div className="oops-body">
        <p className="oops-code">404</p>
        <h1>
          nothing here.<br />
          <span>swipe left.</span>
        </h1>
        <p className="oops-copy">
          this page doesn&apos;t exist, or it moved. no hard feelings — the good
          stuff is one link away.
        </p>
        <div className="oops-links">
          <Link className="btn-primary" href="/">
            back to the start
          </Link>
          <a className="btn-browser" href={appUrl} {...appLinkProps}>
            try it in your browser <span>→</span>
          </a>
        </div>
        <p className="oops-more">
          or: <Link href="/beta">join the beta</Link> ·{" "}
          <Link href="/privacy">privacy</Link> · <Link href="/terms">terms</Link>
        </p>
      </div>

      <div className="vignette" />
      <div className="grain" />
    </main>
  );
}
