import type { Metadata } from "next";
import Link from "next/link";

const updated = "26 September 2026";

export const metadata: Metadata = {
  title: "terms of use",
  description:
    "The terms for using hookedcue — a music discovery app in closed testing. Plain English, no surprises.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">last updated {updated}</p>
      <h1>terms of use</h1>
      <p className="legal-lede">
        Short, and written to be read. Using hookedcue — this site, the browser app, or the Android
        build — means you agree to what is below.
      </p>

      <h2>this is a test build</h2>
      <p>
        hookedcue is in closed testing. Things will break, features will change, and{" "}
        <strong>data may be reset</strong> while we get it right. Do not treat your hookedcue library
        as the only copy of anything you care about. We will avoid wiping libraries and will warn you
        if we have to, but this is a beta and we cannot promise it.
      </p>

      <h2>you must be 18 or older</h2>
      <p>
        hookedcue is for adults. The catalogue is real chart music, some of it explicit, so you must
        be at least 18 to use the app or apply for the beta. If we learn an account belongs to
        someone younger, we will delete it.
      </p>

      <h2>access is invited, not owed</h2>
      <p>
        Accounts exist only after an application is approved. We can decline an application, and we
        can suspend or remove an account, without giving a reason — usually that just means the test
        round is full. If your account is removed, the{" "}
        <Link href="/data-deletion">data deletion</Link> terms apply to what we hold.
      </p>

      <h2>the music is not ours</h2>
      <p>
        hookedcue plays short preview clips supplied by Apple&rsquo;s iTunes service, along with the
        artwork that comes with them. Those recordings belong to their rights holders. hookedcue does
        not host, sell or licence the music, and it is not a substitute for a streaming service — the
        full song opens on Apple Music, Spotify or YouTube. If you are a rights holder and want a
        track out of the catalogue, email{" "}
        <a href="mailto:privacy@hookedcue.com">privacy@hookedcue.com</a> and it will be removed.
      </p>

      <h2>what you agree not to do</h2>
      <ul>
        <li>Break into, overload, or probe the service — including scraping the catalogue or hammering the API. There are rate limits, and getting around them is not a game we are playing.</li>
        <li>Use someone else&rsquo;s email to apply, or hold more than one account without asking.</li>
        <li>Rip, redistribute or re-host the preview audio.</li>
        <li>Put anything unlawful, hateful or someone else&rsquo;s private information into the free-text fields.</li>
      </ul>

      <h2>your account</h2>
      <p>
        Keep your password to yourself; anything done from your account is treated as done by you.
        Tell us if you think someone else is in it. You can leave whenever you like — Settings →
        Delete my account, no email required, nothing to cancel.
      </p>

      <h2>what you make</h2>
      <p>
        Your playlists, saves and swipes are yours. We use them to run the app for you and to make
        the recommendations better. We do not claim ownership of them and we do not publish them.
      </p>

      <h2>no warranty, and the limit of our liability</h2>
      <p>
        hookedcue is provided as-is, with no guarantee that it will be available, accurate or
        uninterrupted. To the extent the law allows, we are not liable for indirect or consequential
        loss, and our total liability is limited to what you have paid us — which, since hookedcue is
        free, is nothing.
      </p>

      <h2>price</h2>
      <p>
        hookedcue is free during testing. If that ever changes you will be told before it affects you,
        and never retroactively.
      </p>

      <h2>governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts of India have jurisdiction over
        any dispute. Nothing here removes a right you have under consumer law where you live.
      </p>

      <h2>changes</h2>
      <p>
        We may update these terms. The date at the top will change, and material changes will be
        emailed to account holders. If you do not agree with a change, delete your account.
      </p>

      <h2>contact</h2>
      <p>
        <a href="mailto:privacy@hookedcue.com">privacy@hookedcue.com</a> — built in public by MiNUs,
        unaware.
      </p>
    </article>
  );
}
