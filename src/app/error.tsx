"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Wraps page.js and nested layouts, but not the root
 * layout — global-error.tsx catches that.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[hooked] route error:", error);
  }, [error]);

  return (
    <main id="main" className="oops-page">
      <nav className="beta-nav">
        <Link className="wordmark" href="/">
          hooked<i>.</i>
        </Link>
      </nav>

      <div className="oops-body">
        <p className="oops-code">error</p>
        <h1>
          that broke.<br />
          <span>our end, not yours.</span>
        </h1>
        <p className="oops-copy">
          something threw where it shouldn&apos;t have. try again — if it keeps
          happening, it&apos;s worth telling me about.
        </p>
        <div className="oops-links">
          <button className="btn-primary" onClick={reset} type="button">
            try again
          </button>
          <Link className="btn-browser" href="/">
            back to the start <span>→</span>
          </Link>
        </div>
        {error.digest && <p className="oops-digest">reference: {error.digest}</p>}
      </div>

      <div className="vignette" />
      <div className="grain" />
    </main>
  );
}
