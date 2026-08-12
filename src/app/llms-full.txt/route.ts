import { FAQS } from "@/data/faq";
import { appUrl, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms-full.txt — the long companion to llms.txt: the substance of every page in
 * one markdown file, so a model doesn't have to crawl and reassemble the site.
 *
 * Written by hand rather than scraped, because the pages are heavy with 3D and
 * scroll choreography that carries meaning the DOM alone doesn't.
 */
export function GET() {
  const body = `# hooked. — full text

> A swipe-based music discovery app that plays the strongest 30 seconds of a song
> first. Built in public by MiNUs, unaware. Invite-only closed testing.
> Site: ${siteUrl} · App: ${appUrl}

---

## The problem it exists for

The first chorus in a charting song usually lands somewhere around forty seconds
in. Roughly 24% of listeners skip inside the first five seconds, and about 35%
are gone before 0:30 — which is, in most cases, before the chorus arrives. So
people quit songs shortly before the part that would have sold them, decide the
song wasn't for them, and go back to a playlist of things they already saved.

Sources for those figures: Paul Lamere's analysis of billions of Spotify plays
for the skip rates; Ohio State / Musicae Scientiae (1986–2015) for intro length
and song structure.

hooked. starts every song at its hook instead.

## How it works

Four gestures, and that's the whole interface:

- **Swipe up — skip.** The next hook is playing before your thumb is back down.
  Skips count as much as saves; they just point the other way.
- **Swipe down — save.** The card turns into a record and slides into a sleeve.
  It takes about a second longer than it needs to, on purpose. Saves go to Liked
  Songs, Discoveries, or a playlist you choose.
- **Swipe right — more like this.** Not a save. It bends the next few cards
  toward that sound and then lets go.
- **Swipe left — never.** That artist doesn't come back. No soft mute, no "show
  me less often".

There is a back control that returns to the previous song and reverts the swipe.

## The catalogue

118 hooks across 19 genres — afrobeats, psych pop, bollywood, house, soul,
reggaeton, indie folk, k-pop, hip hop, classic rock, punjabi, electronic and
more. Every clip is 30 seconds and was cut by hand to start at the hook rather
than at the top of the file.

Previews are publicly available iTunes preview clips. hooked. does not host,
sell or licence the music; the full song opens on Apple Music, Spotify or
YouTube. Rights holders can have a track removed by emailing
privacy@hookedcue.com.

## Access

The app is invite-only while it is in testing.

1. Try the browser build at ${appUrl} — the real deck, no install, no signup.
   Anonymous visitors get five free swipes.
2. After that, an application form: name, email, optionally the phone you'd test
   on and the genres you actually play.
3. An admin reviews it. Approval is what allows an account to be created —
   signing in is not enough on its own.
4. Android ships through Google Play closed testing, so the email must be the
   Google account on the device. iOS is not scheduled.

Free. No ads, no analytics, no advertising SDKs, no third-party trackers.

## Privacy, in brief

- **If you apply:** name, email, optional phone model and genres, anything typed
  into the notes box, browser user-agent, and the time. IP is used at the moment
  of submitting to rate limit the form and is not stored against the row.
- **If you have an account:** email, hashed password, optional name, a session
  cookie, your saved songs and playlists, artists you blocked, your swipe
  history (track, artist, genre, which gesture), and your settings.
- **On your device:** a local library cache, whether you've seen the tutorial,
  and a free-swipe count. One cookie, for staying signed in.
- **Third parties:** Apple serves the preview audio and artwork. Cloudflare sits
  in front of the domains. The database is a self-hosted Convex instance.
- Nothing is sold or shared for marketing.
- Deletion is self-service: Settings → Delete my account removes the profile,
  library, playlists, blocked artists, swipe history and the access request.

Full policy: ${siteUrl}/privacy · Deletion: ${siteUrl}/data-deletion

## Terms, in brief

It is a test build: things break, features change, and data may be reset.
Access is invited and can be declined or withdrawn. The music belongs to its
rights holders. Don't scrape the catalogue, rip the previews, or work around the
rate limits. Provided as-is with no warranty. Governed by the laws of India.

Full terms: ${siteUrl}/terms

## Questions

${FAQS.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n")}

## Who makes it

MiNUs, unaware — "mi 'n us, building things we're not qualified to build."
One person, building in public. Contact: privacy@hookedcue.com

---

Generated from the site's own content. Short version: ${siteUrl}/llms.txt
`;

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
