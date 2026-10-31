/**
 * Which artwork and preview addresses the landing will fetch or put in a page.
 *
 * A creator types their track's artwork and preview links themselves, and the
 * share images (next/og) fetch the artwork from this server. Any https address
 * used to go through, so a creator's link could make this server request an
 * address of their choosing (an internal service, a metadata endpoint, a
 * tracker) and every listener's browser load it. Only the hosts the catalogue
 * really uses pass:
 *   - Apple's artwork CDN (*.mzstatic.com) and previews (*.itunes.apple.com)
 *   - Deezer's CDN (*.dzcdn.net), which imported tracks use
 *   - cdn.hookedcue.com
 *   - the app's own Convex file storage (<deployment>.convex.cloud/api/storage/…)
 * Mirrors the write-side rule in web/convex (the backend refuses other hosts on
 * write; this is the second fence for rows written before that).
 *
 * No imports, so tests run it as is (tests/media-hosts.test.mjs).
 */

const SUFFIXES = [".mzstatic.com", ".itunes.apple.com", ".dzcdn.net"];
const EXACT = ["cdn.hookedcue.com"];

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The URL, normalised, when it may be fetched or shown; otherwise null.
 * `convexOrigins` are the deployment URLs this landing reads from (their
 * /api/storage/ paths are the app's own uploads).
 */
export function safeMediaUrl(raw: unknown, convexOrigins: readonly string[]): string | null {
  if (typeof raw !== "string" || !raw || raw.length > 1000) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  // no http, no user:pass@ tricks, no odd ports
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (EXACT.includes(host) || SUFFIXES.some((s) => host.endsWith(s) && host.length > s.length)) {
    return url.toString();
  }
  const convex = convexOrigins.map(hostOf).filter((h): h is string => !!h && h.endsWith(".convex.cloud"));
  if (convex.includes(host) && url.pathname.startsWith("/api/storage/")) return url.toString();
  return null;
}
