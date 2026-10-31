import { CONVEX_CLOUD_URL } from "@/config/backend";
import { safeMediaUrl } from "@/lib/mediaHosts";

/**
 * One song for a shared link, read from the app's public `share:track` query.
 * Cached for five minutes so a link that goes around doesn't hit the backend
 * once per viewer. Null for unknown or hidden songs.
 */
export type SharedTrack = {
  trackId: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  genre: string;
  accent: string;
  previewUrl: string;
  audioUrl: string | null;
  durationMs: number;
  hooks: { startMs: number; durationMs: number; label: string | null }[];
};

export async function getSharedTrack(trackId: string): Promise<SharedTrack | null> {
  if (!trackId || trackId.length > 120) return null;
  try {
    const res = await fetch(`${CONVEX_CLOUD_URL}/api/query`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "share:track", args: { trackId }, format: "json" }),
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; value?: SharedTrack | null };
    const track = data.status === "success" ? (data.value ?? null) : null;
    return track ? withSafeMedia(track) : null;
  } catch {
    return null;
  }
}

/**
 * Artwork and audio only from the catalogue's own hosts (lib/mediaHosts.ts):
 * a creator's link elsewhere is dropped, so the share images never fetch it
 * and no listener's browser loads it. An empty artwork draws the placeholder.
 */
export function withSafeMedia(track: SharedTrack): SharedTrack {
  const origins = [CONVEX_CLOUD_URL];
  return {
    ...track,
    artwork: safeMediaUrl(track.artwork, origins) ?? "",
    previewUrl: safeMediaUrl(track.previewUrl, origins) ?? "",
    audioUrl: track.audioUrl ? safeMediaUrl(track.audioUrl, origins) : null,
  };
}

/** Sized iTunes artwork (their URLs encode the size). */
export function artworkAt(url: string, px: number): string {
  return url.replace(/\d+x\d+(bb)?\.jpg/, `${px}x${px}$1.jpg`);
}

/** Which hook a link points at (?h=), clamped to the ones the song has. */
export function hookAt(track: SharedTrack, raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isInteger(n) || n < 0) return 0;
  return Math.min(n, Math.max(0, track.hooks.length - 1));
}
