import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, makeNonce } from "@/lib/csp";

/**
 * A fresh CSP nonce for every page request (lib/csp.ts says why). Next reads
 * the nonce from the request's Content-Security-Policy header while it
 * renders and puts it on its own scripts; the same policy goes out on the
 * response.
 */
export function proxy(request: NextRequest) {
  const nonce = makeNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // pages and image routes; not build assets, and not prefetches (no HTML)
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
