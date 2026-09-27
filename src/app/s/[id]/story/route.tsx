import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getSharedTrack, hookAt } from "@/lib/sharedTrack";
import { brandFonts, SongStory } from "@/lib/ogKit";

// 1080x1920 story image for a song — saved from the share page or the app
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await getSharedTrack(decodeURIComponent(id));
  if (!track) return new Response("not found", { status: 404 });
  const hook = hookAt(track, request.nextUrl.searchParams.get("h") ?? undefined);
  return new ImageResponse(<SongStory track={track} hook={hook} />, {
    width: 1080,
    height: 1920,
    fonts: await brandFonts(),
    headers: {
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "content-disposition": `inline; filename="hookedcue-${track.trackId.replace(/[^\w-]/g, "")}.png"`,
    },
  });
}
