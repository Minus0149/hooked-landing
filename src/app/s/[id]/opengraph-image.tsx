import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getSharedTrack } from "@/lib/sharedTrack";
import { brandFonts, SongCard } from "@/lib/ogKit";

// the preview WhatsApp, Instagram DMs, iMessage and X show for a shared song
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Hear the hook on HookedCue";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await getSharedTrack(decodeURIComponent(id));
  if (!track) notFound();
  return new ImageResponse(<SongCard track={track} hook={0} />, { ...size, fonts: await brandFonts() });
}
