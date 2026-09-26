import type { Metadata } from "next";
import Link from "next/link";
import { appUrl, appLinkProps } from "@/lib/site";

const updated = "12 August 2026";

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
      <h1>delete your data</h1>
      <p className="legal-lede">
        You do not have to ask us, and you do not have to wait. Deletion is built into the app and it
        is immediate.
      </p>

      <h2>in the app — two taps</h2>
      <ol>
        <li>Open <strong>Settings</strong> (the gear, bottom right).</li>
        <li>Scroll to <strong>Delete my account</strong>.</li>
        <li>Confirm twice. That is it.</li>
      </ol>
      <p>
        <a className="btn-primary" href={appUrl} {...appLinkProps}>
          open the app
        </a>
      </p>

      <h2>what gets deleted, immediately</h2>
      <ul>
        <li>Your profile — email, name and settings.</li>
        <li>Your library — every saved song, in every playlist.</li>
        <li>Your playlists.</li>
        <li>Every artist you blocked with a left swipe.</li>
        <li>Your entire swipe history.</li>
        <li>Your access request, so the email is free to apply again later.</li>
      </ul>
      <p>
        This is a real delete, not a flag — the rows are removed from the database. It cannot be
        undone, and we cannot restore it for you afterwards.
      </p>

      <h2>what stays, briefly</h2>
      <ul>
        <li>
          <strong>Sign-in records</strong> held by our authentication component are cleared when the
          session ends and are orphaned the moment the profile is gone — there is nothing left for
          them to point at, and they cannot be used to sign back in to anything.
        </li>
        <li>
          <strong>Rate-limit counters</strong> keyed to an IP or email. These hold no profile data
          and expire on their own within hours.
        </li>
        <li>
          <strong>Server logs</strong> kept for security and debugging, which roll over on their own.
        </li>
        <li>
          Anything stored on <strong>your own device</strong>. Use{" "}
          <strong>Settings → Reset local data</strong>, or clear your browser data, to remove that
          too.
        </li>
      </ul>

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
