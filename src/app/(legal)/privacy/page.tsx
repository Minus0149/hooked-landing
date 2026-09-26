import type { Metadata } from "next";
import Link from "next/link";

const updated = "12 August 2026";

export const metadata: Metadata = {
  title: "privacy policy",
  description:
    "What hookedcue stores, why, who it is shared with, how long it is kept, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">last updated {updated}</p>
      <h1>privacy policy</h1>
      <p className="legal-lede">
        hookedcue is run by one person. This is written plainly because there is no reason for it not
        to be. It describes exactly what the app stores, and nothing it does not do.
      </p>

      <h2>the short version</h2>
      <ul>
        <li>There are no analytics, no advertising SDKs and no third-party trackers in the app or on this site.</li>
        <li>We store the account you create, the songs you keep, and the swipes that teach the deck.</li>
        <li>Nothing is sold or shared for marketing. Ever.</li>
        <li>You can delete everything yourself from Settings, in two taps.</li>
      </ul>

      <h2>who is responsible</h2>
      <p>
        hookedcue is operated by MiNUs (&ldquo;we&rdquo;, &ldquo;us&rdquo;) from India. For anything
        in this policy, including a request to see or delete your data, write to{" "}
        <a href="mailto:privacy@hookedcue.com">privacy@hookedcue.com</a>.
      </p>

      <h2>what we collect, and why</h2>

      <h3>if you ask for access</h3>
      <p>
        The app is invite-only while it is being tested. When you apply — either on this site or
        from inside the browser app — we store the <strong>name and email</strong> you enter, and
        optionally the <strong>phone model</strong> and <strong>genres</strong> you tell us about,
        plus anything you type into the notes box. We also record your{" "}
        <strong>browser user-agent</strong> and the <strong>time</strong> you applied.
      </p>
      <p>
        Your <strong>IP address</strong> is used, at the moment of submitting, to rate limit the
        form. It is held only as part of a counter that expires, and is not stored against your
        application.
      </p>
      <p>
        We need this to decide who to let into the test and to send the invite. Without an email
        there is no way to reach you, so it is required.
      </p>

      <h3>if you have an account</h3>
      <ul>
        <li><strong>Email and password.</strong> The password is hashed by our authentication library — it is never stored in a form anyone can read, including us.</li>
        <li><strong>Your name</strong>, if you give one.</li>
        <li><strong>A session cookie</strong>, so you stay signed in.</li>
        <li><strong>Your library</strong>: saved songs, playlists you make, and artists you have blocked with a left swipe.</li>
        <li><strong>Your swipes</strong>: for each card, the track, artist, genre and which of the four gestures you used. This is what makes the recommendations work. It is the product.</li>
        <li><strong>Settings</strong>: where saves go, whether auto-advance is on, appearance and gesture preferences.</li>
      </ul>

      <h3>house ads</h3>
      <p>
        hookedcue shows occasional first-party sponsored cards between swipes —
        written by us or by an artist promoting their own release, never served
        by a third-party network, with no SDKs and no tracking pixels.
      </p>
      <ul>
        <li>
          We count how many ad cards you were shown (and whether one was
          tapped) so the daily limit works and advertisers can be answered
          honestly. These counters are keyed to your account — or to a random
          per-install id if you haven&rsquo;t signed in — and are deleted after 45
          days.
        </li>
        <li>
          Ad views are not profiled, not shared, and not used to train
          anything. You can turn the cards off entirely in Settings → Support;
          the app keeps working exactly the same without them.
        </li>
      </ul>

      <h3>on your device</h3>
      <p>
        The app keeps a few things in your browser&rsquo;s local storage so it works before you sign
        in and does not nag you twice: your local library cache, whether you have seen the tutorial,
        and a count of free swipes. Clearing your browser data removes all of it, and{" "}
        <strong>Settings → Reset local data</strong> does the same on demand.
      </p>
      <p>
        The only cookie is the one that keeps you signed in. There is no analytics or advertising
        cookie, which is why there is no consent banner — under GDPR a strictly necessary cookie
        does not need one.
      </p>

      <h2>who else sees it</h2>
      <ul>
        <li>
          <strong>Apple.</strong> Song previews and artwork are served from Apple&rsquo;s iTunes
          servers. When a preview plays, your browser requests it from Apple directly, so Apple sees
          that request and your IP. We do not send Apple anything about who you are.
        </li>
        <li>
          <strong>Cloudflare.</strong> Sits in front of our domains for DNS and delivery, and
          processes request metadata including IP addresses in doing so.
        </li>
        <li>
          <strong>Convex.</strong> hookedcue&rsquo;s database is hosted on Convex (convex.dev), a
          managed backend service that stores and processes it on our behalf. Your data is not on a
          third-party analytics platform.
        </li>
        <li>
          <strong>Our own mail server.</strong> Account emails (confirming your address, resetting a
          password) are sent from a mail server we run ourselves, not a third-party email service.
        </li>
      </ul>
      <p>
        We do not sell personal data, and we do not share it for anyone else&rsquo;s marketing. The
        only time we would hand anything over is if the law actually required it.
      </p>

      <h2>how long we keep it</h2>
      <ul>
        <li><strong>Your account and library</strong> — until you delete it.</li>
        <li><strong>Access requests</strong> — while the test is running, so we do not re-review the same person. Deleting your account deletes your request with it.</li>
        <li><strong>Rate-limit counters</strong> — minutes to hours, then they expire.</li>
      </ul>

      <h2>your rights</h2>
      <p>
        Under India&rsquo;s Digital Personal Data Protection Act 2023, and under GDPR if you are in
        the UK or EU, you can ask to see what we hold, correct it, delete it, or withdraw consent.
      </p>
      <p>
        Deletion does not need a request: <strong>Settings → Delete my account</strong> removes your
        profile, library, playlists, blocked artists, swipe history and access request immediately
        and permanently. There is a fuller description on the{" "}
        <Link href="/data-deletion">data deletion</Link> page. For anything else, email{" "}
        <a href="mailto:privacy@hookedcue.com">privacy@hookedcue.com</a>.
      </p>

      <h2>children</h2>
      <p>
        hookedcue is not intended for under-13s and we do not knowingly collect their data. If you are
        under 18, please get a parent or guardian&rsquo;s permission first. If you believe a child
        has an account, email us and we will remove it.
      </p>

      <h2>security</h2>
      <p>
        Traffic is encrypted in transit. Passwords are hashed. Admin functions are behind
        per-permission checks, and every write is rate limited. That said, this is a small project in
        testing, not a bank — please do not put anything sensitive into the notes box.
      </p>

      <h2>changes</h2>
      <p>
        If this policy changes in a way that matters, the date at the top changes and, if you have an
        account, we will email you. Continuing to use hookedcue after a change means you accept it.
      </p>
    </article>
  );
}
