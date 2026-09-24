import type { Metadata } from "next";
import Link from "next/link";

const updated = "24 August 2026";

export const metadata: Metadata = {
  title: "copyright & takedown policy",
  description:
    "How hooked. handles copyright: uploads are rights-declared and fingerprint-checked, and rights holders can get infringing audio removed within 36 hours.",
  alternates: { canonical: "/copyright" },
  robots: { index: true, follow: true },
};

export default function CopyrightPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">last updated {updated}</p>
      <h1>copyright &amp; takedown</h1>
      <p className="legal-lede">
        hooked. streams short previews under the iTunes Affiliate framework and
        full recordings only from the people who hold the rights to them. This
        page explains exactly how that is enforced, and how to reach us if it
        fails.
      </p>

      <h2>what we ask of uploaders</h2>
      <ul>
        <li>
          Every creator confirms, per track, that they own the recording or hold
          a licence for it before anything is published.
        </li>
        <li>
          Uploads are fingerprint-checked against the catalogue in the browser
          before they leave the uploader&apos;s machine. A re-encoded copy of a song
          already on hooked. is refused outright; partial overlaps (a cleared
          sample, say) require an explicit confirmation.
        </li>
        <li>
          Fingerprinting is a duplicate detector, not a content-ID system. It
          catches copies of songs already in the catalogue — it cannot identify
          every third-party recording in existence. The rights declaration and
          this takedown process carry the rest.
        </li>
      </ul>

      <h2>for rights holders</h2>
      <p>
        If you believe audio on hooked. infringes your copyright, write to{" "}
        <a href="mailto:copyright@hookedcue.com">copyright@hookedcue.com</a>{" "}
        with:
      </p>
      <ol>
        <li>the track title and artist as it appears in the app;</li>
        <li>a link to the work you believe it copies, or proof of ownership;</li>
        <li>your name and contact details;</li>
        <li>
          a statement that you have a good-faith belief the use is not
          authorised, and that the information in your notice is accurate.
        </li>
      </ol>
      <p>
        We act on valid notices within{" "}
        <b>36 hours</b>: the audio is disabled while we check. Under India&rsquo;s
        IT Rules, 2021 we target grievance resolution within 15 days for
        copyright matters, and our intermediary status depends on acting this
        fast — so we do.
      </p>

      <h2>counter-notice</h2>
      <p>
        If your audio was removed and you believe that was a mistake, reply to
        the removal notice with your reasoning and evidence. If both sides
        claim the same recording, it stays off hooked. until they agree or a
        court settles it — we are a discovery deck, not a courtroom.
      </p>

      <h2>repeat infringers</h2>
      <p>
        Accounts that upload infringing audio more than once lose their creator
        access permanently, and their tracks are removed with them.
      </p>

      <h2>the previews themselves</h2>
      <p>
        30-second previews of chart music are streamed directly from Apple&rsquo;s
        iTunes servers via the iTunes Search API and its affiliate terms; hooked.
        does not host them. Full-length playback always happens on Apple Music,
        Spotify or YouTube, never inside the app.
      </p>

      <p className="legal-footnote">
        See also the <Link href="/privacy">privacy policy</Link> and{" "}
        <Link href="/terms">terms</Link>.
      </p>
    </article>
  );
}
