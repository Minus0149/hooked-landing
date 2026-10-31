/**
 * The page's Content-Security-Policy, built per request in src/proxy.ts.
 *
 * Scripts used to be allowed with 'unsafe-inline', because Next streams the
 * page's data as inline <script> tags and a static policy can't tell those
 * from an injected one. Now each request gets a fresh nonce: Next reads it
 * from the request's CSP header and stamps it on its own scripts, so an
 * inline script anyone manages to inject (no nonce) doesn't run.
 *
 * The cost, accepted on purpose: a nonce only exists per request, so every
 * page renders on request instead of at build time (the root layout reads
 * headers()). Data fetches keep their own caches (sharedTrack, indieHook).
 *
 * No 'strict-dynamic': Cloudflare injects its analytics beacon at the edge
 * without our nonce, so the host allow-list (static.cloudflareinsights.com)
 * must keep working. Styles keep 'unsafe-inline' — motion and the stage set
 * inline style attributes, which nonces don't cover.
 *
 * No imports, so tests run it as is (tests/csp.test.mjs).
 */

export function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCsp(nonce: string, isDev: boolean): string {
  // Dev builds of React use eval() for debugging aids, and Turbopack's HMR
  // needs a websocket, so development gets 'unsafe-eval' + ws:
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: blob:", // 'self': the mood chapter's app clip is served from here
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
