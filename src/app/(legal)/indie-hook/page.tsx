import type { Metadata } from "next";
import Link from "next/link";
import { appUrl, appLinkProps } from "@/lib/site";
import { bigArt, indieArchive, weekLabel } from "@/lib/indieHook";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [now] = await indieArchive();
  const title = now ? `${now.title} — indie hook of the week` : "indie hook of the week";
  const description = now
    ? `${now.title} by ${now.artist}: ${now.blurb}`
    : "Every week hookedcue picks one independent song and puts it at the top of Home.";
  return {
    title,
    description,
    alternates: { canonical: "/indie-hook" },
    openGraph: { title, description, url: "/indie-hook", images: now ? [{ url: bigArt(now.artwork, 1200) }] : undefined },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function IndieHookPage() {
  const picks = await indieArchive();
  const [now, ...past] = picks;
  return (
    <article className="legal indie">
      <p className="legal-kicker">indie hook of the week</p>
      {now ? (
        <>
          <div className="indie-now">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="indie-art" src={bigArt(now.artwork, 600)} alt={`${now.title} artwork`} width={300} height={300} />
            <div>
              <h1>{now.title}</h1>
              <p className="indie-artist">{now.artist}</p>
              <p className="legal-lede">{now.blurb}</p>
              <p className="indie-week">week of {weekLabel(now.week)} · chosen by us, not paid for</p>
              <a className="btn-primary" href={appUrl} {...appLinkProps}>
                hear it at its hook
              </a>
            </div>
          </div>
          <p className="indie-share">
            Sharing it? The{" "}
            <a href="/indie-hook/story" target="_blank" rel="noreferrer">
              story image
            </a>{" "}
            is sized for Instagram (1080 × 1920).
          </p>
        </>
      ) : (
        <>
          <h1>coming soon</h1>
          <p className="legal-lede">
            Every week we pick one independent song and put it at the top of everyone&apos;s Home, starting at its hook.
          </p>
        </>
      )}

      {past.length > 0 && (
        <>
          <h2>past picks</h2>
          <ul className="indie-archive">
            {past.map((p) => (
              <li key={p.week}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bigArt(p.artwork, 120)} alt="" width={56} height={56} />
                <span>
                  <strong>{p.title}</strong> — {p.artist}
                  <br />
                  <small>week of {weekLabel(p.week)}</small>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="legal-foot-note">
        Are you an independent artist? <Link href="/artists">Put your music in the deck</Link>.
      </p>
    </article>
  );
}
