"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Catches errors thrown in the root layout itself, where error.tsx can't reach.
 * It replaces the root layout when active, so it has to bring its own html and
 * body tags and its own styles. Deliberately plain — if the layout is broken,
 * loading fonts and a 3D scene to apologise is asking for a second failure.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[hooked] global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <title>something broke | hookedcue</title>
        <main id="main" className="oops-page oops-bare">
          <div className="oops-body">
            <p className="oops-code">error</p>
            <h1>
              something broke<br />
              <span>badly enough to take the page with it.</span>
            </h1>
            <p className="oops-copy">
              this one is on us. reloading usually does it.
            </p>
            <div className="oops-links">
              <button className="btn-primary" onClick={reset} type="button">
                try again
              </button>
              {/* a hard navigation on purpose: global-error replaces the root
                  layout, so the router is a plausible suspect for whatever
                  broke. next/link would ask it to do more work here. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="btn-browser" href="/">
                back to the start <span>→</span>
              </a>
            </div>
            {error.digest && <p className="oops-digest">reference: {error.digest}</p>}
          </div>
        </main>
      </body>
    </html>
  );
}
