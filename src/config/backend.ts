/**
 * Where beta signups go: the app's backend (Convex Cloud, project "hooked"),
 * named here rather than in the host's settings.
 *
 * It used to come only from BETA_WEBHOOK_URL on the host. When the self-hosted
 * backend went down, that variable kept pointing at it and every signup failed
 * with a 5xx — fixable only by editing a server. The URL is public, so it
 * lives with the code; the shared secret stays on the host (BETA_WEBHOOK_SECRET).
 *
 * BETA_SINK_URL overrides it for a different receiver (Apps Script, Discord…).
 * It is a new name on purpose, so a stale BETA_WEBHOOK_URL can't win.
 */
export const BETA_SINK_URL = "https://shocking-goldfinch-745.convex.site/beta";

export function betaSink(env: Record<string, string | undefined>): string {
  const override = env.BETA_SINK_URL?.trim();
  return override && /^https:\/\//.test(override) ? override : BETA_SINK_URL;
}
