import { FAQS } from "@/data/faq";
import { appUrl, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt — the llmstxt.org convention: a short, curated map of the site for
 * language models, in markdown, at a predictable path.
 *
 * Kept deliberately small. The long version lives at /llms-full.txt.
 */
export function GET() {
  const body = `# hooked.

> A swipe-based music discovery app. It plays the strongest 30 seconds of a song
> first — the hook, not the intro — and learns from four gestures: skip, save,
> more-like-this, and never-again. Built in public by MiNUs, unaware. Currently
> in invite-only closed testing.

The premise: the first chorus in a charting song tends to land around 40 seconds
in, while roughly a third of listeners have already skipped by 0:30. People quit
songs shortly before the part that would have won them over. hooked. starts at
that part instead.

## Pages

- [Home](${siteUrl}/): the product story — the problem, the four gestures, the save ritual, the catalogue.
- [Join the beta](${siteUrl}/beta): try the browser build, then apply for the Android closed test.
- [Privacy policy](${siteUrl}/privacy): what is stored, who sees it, how long it is kept.
- [Terms of use](${siteUrl}/terms): the terms for using the app during testing.
- [Delete your data](${siteUrl}/data-deletion): how to remove an account and everything in it.

## The app

- [Browser app](${appUrl}): the real deck — 118 hand-cut hooks across 19 genres, no install.

## Facts

- Gestures: swipe up to skip, down to save, right for more like this, left to block an artist permanently.
- Catalogue: 118 hooks, 19 genres, each clip 30 seconds and hand-cut to start at the hook.
- Previews come from publicly available iTunes preview clips; full songs open on Apple Music, Spotify or YouTube.
- Android ships through Google Play closed testing. iOS is not scheduled.
- Free. No ads, no tracking, no analytics SDKs.

## Common questions

${FAQS.map((f) => `- **${f.q}** ${f.a}`).join("\n")}

## Full text

- [llms-full.txt](${siteUrl}/llms-full.txt): every page's content in one file.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
