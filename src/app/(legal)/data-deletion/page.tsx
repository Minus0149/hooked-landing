import type { Metadata } from "next";
import Link from "next/link";
import { appUrl, appLinkProps } from "@/lib/site";

const updated = "26 September 2026";

export const metadata: Metadata = {
  title: "delete your data",
  description:
    "How to delete your hookedcue account and everything stored with it — in the app in two taps, or by email.",
  alternates: { canonical: "/data-deletion" },
  robots: { index: true, follow: true },
};

export default function DataDeletionPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">last updated {updated}</p>
      <h1>delete your hookedcue data</h1>
      <p className="legal-lede">
        You do not have to ask us, and you do not have to wait. Deleting your hookedcue account is
        built into the app, and it is immediate.
      </p>

      <h2>in the app</h2>
      <ol>
        <li>Open <strong>Settings</strong> — the gear at the top right of Home.</li>
        <li>Tap <strong>Data &amp; privacy</strong>.</li>
        <li>Tap <strong>Delete my account</strong> and confirm. That is it.</li>
      </ol>
      <p>
        <a className="btn-primary" href={appUrl} {...appLinkProps}>
          open the app
        </a>
      </p>

      <h2>what gets deleted, immediately</h2>
      <ul>
        <li>Your sign-in — email, name and password. The account can no longer be signed in to.</li>
        <li>Your profile and settings.</li>
        <li>Your library — every saved song, in every playlist — and your playlists.</li>
        <li>Every artist you blocked with a left swipe, and every song you buried.</li>
        <li>Your entire swipe history and the moods you picked.</li>
        <li>Playlists you imported, and any crash reports your device sent.</li>
        <li>If you were a creator: your creator profile, every song you uploaded and its audio files.</li>
        <li>Your beta application, so the email is free to apply again later.</li>
      </ul>
      <p>
        This is a real delete, not a flag — the records are removed from the database. It cannot be
        undone, and we cannot restore it for you afterwards.
      </p>

      <h2>what stays, and for how long</h2>
      <ul>
        <li>
          <strong>Anonymous totals</strong> — how many times a song was played or saved, and the
          published mood tags for a song. They never held your name or email, so nothing in them
          points back to you. Kept as long as the song is in the catalogue.
        </li>
        <li>
          <strong>Rate-limit counters</strong> keyed to an IP address or email, used to stop abuse.
          They expire on their own within 24 hours.
        </li>
        <li>
          <strong>Server and email-delivery logs</strong>, which record that a request or an email
          happened, for security and debugging. They are deleted automatically within 30 days.
        </li>
        <li>
          Anything stored on <strong>your own device</strong>. Use{" "}
          <strong>Settings → Data &amp; privacy → Reset local data</strong>, or clear your browser
          data, to remove that too.
        </li>
      </ul>

      <h2>delete only part of your data</h2>
      <p>
        You can remove single songs, playlists and blocked artists in the app at any time. To have
        something else removed while keeping your account — your swipe history, for example —
        email <a href="mailto:privacy@hookedcue.com">privacy@hookedcue.com</a> from your account&apos;s
        address and say what you want deleted. We will do it and confirm within 30 days.
      </p>

      <h2>if you cannot get into your account</h2>
      <p>
        Email <a href="mailto:privacy@hookedcue.com">privacy@hookedcue.com</a> from the address you
        signed up with and ask us to delete it. We will confirm it is you, do it, and write back
        within 30 days — usually the same week.
      </p>

      <h2>if you only applied and never got in</h2>
      <p>
        If you filled in the beta form but never had an account, email the same address and we will
        remove the application. Nothing else about you exists.
      </p>

      <p className="legal-foot-note">
        More detail on what is stored and why is on the <Link href="/privacy">privacy policy</Link>.
      </p>
    </article>
  );
}
