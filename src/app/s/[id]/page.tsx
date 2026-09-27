import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedTrack, hookAt } from "@/lib/sharedTrack";
import { appUrl, siteUrl } from "@/lib/site";
import { SharePlayer } from "./SharePlayer";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ h?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = await getSharedTrack(decodeURIComponent(id));
  if (!track) return { title: "song not found", robots: { index: false } };
  const title = `${track.title} — ${track.artist}`;
  const description = `Hear "${track.title}" by ${track.artist} from its hook on hookedcue — every song starts at the part you came for.`;
  return {
    title,
    description,
    alternates: { canonical: `/s/${encodeURIComponent(track.trackId)}` },
    // shared songs are for people, not search results
    robots: { index: false, follow: true },
    openGraph: { title, description, type: "music.song", url: `${siteUrl}/s/${encodeURIComponent(track.trackId)}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedSongPage({ params, searchParams }: Props) {
  const { id } = await params;
  const track = await getSharedTrack(decodeURIComponent(id));
  if (!track) notFound();
  const hook = hookAt(track, (await searchParams).h);
  return <SharePlayer track={track} hook={hook} appUrl={appUrl} />;
}
