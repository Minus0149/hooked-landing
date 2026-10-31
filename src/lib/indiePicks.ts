import { CONVEX_URL, rawIndieArchive, type IndiePick } from "@/lib/indieHook";
import { safeMediaUrl } from "@/lib/mediaHosts";

/**
 * The indie picks, newest first (the first is this week's when one is set),
 * with artwork only from the catalogue's hosts (lib/mediaHosts.ts): the story
 * image fetches it from this server. Empty artwork draws a plain tile.
 */
export async function indiePicks(): Promise<IndiePick[]> {
  const picks = await rawIndieArchive();
  return picks.map((p) => ({ ...p, artwork: safeMediaUrl(p.artwork, [CONVEX_URL]) ?? "" }));
}
