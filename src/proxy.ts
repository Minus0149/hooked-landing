import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, makeNonce } from "@/lib/csp";
import { checkRenderLimit, clientKey, isRenderPath } from "@/lib/rate-limit";

/**
 * A fresh CSP nonce for every page request (lib/csp.ts says why). Next reads
 * the nonce from the request's Content-Security-Policy header while it
 * renders and puts it on its own scripts; the same policy goes out on the
 * response.
 */
export function proxy(request: NextRequest) {
  // share pages and images cost a backend query or a PNG render each (lib/rate-limit.ts)
  if (isRenderPath(request.nextUrl.pathname)) {
    const limit = checkRenderLimit(clientKey(request.headers));
    if (!limit.ok) {
      return new NextResponse("too many requests", { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
    }
  }
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
    // Pages and image routes, not build assets. Prefetches are not skipped
    // (Next's docs suggest it): the header that marks one is the client's to
    // send, so skipping them would let anyone step around the render limit.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
