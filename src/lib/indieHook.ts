/**
 * The indie hook of the week, read from the app's backend (web/convex/
 * featured.ts) for the public share page and its story image. Public data
 * only: the pick, its blurb and the song's title, artist and artwork.
 */
// HOOKED_CONVEX_URL points a local build at the dev deployment for testing.
export const CONVEX_URL = process.env.HOOKED_CONVEX_URL || "https://shocking-goldfinch-745.convex.cloud";

export type IndiePick = {
  week: string;
  blurb: string;
  trackId: string;
  title: string;
  artist: string;
  artwork: string;
};

async function convexQuery<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, args: {}, format: "json" }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const out = (await res.json()) as { status: string; value?: T };
    return out.status === "success" ? (out.value ?? null) : null;
  } catch {
    return null;
  }
}

/** Newest first; the first is this week's when one is set. */
export async function indieArchive(): Promise<IndiePick[]> {
  return (await convexQuery<IndiePick[]>("featured:archive")) ?? [];
}

/** Bigger artwork for sharing: iTunes-style URLs encode their size. */
export function bigArt(url: string, px = 1000): string {
  return url.replace(/\/\d+x\d+(bb)?\.(jpg|png|webp)/, `/${px}x${px}bb.$2`);
}

export function weekLabel(week: string): string {
  return new Date(`${week}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
