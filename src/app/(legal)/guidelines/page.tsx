import type { Metadata } from "next";
import Link from "next/link";

const updated = "24 August 2026";

export const metadata: Metadata = {
  title: "community guidelines",
  description:
    "What belongs on hookedcue, what doesn't, and what happens when the line is crossed.",
  alternates: { canonical: "/guidelines" },
  robots: { index: true, follow: true },
};

export default function GuidelinesPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">last updated {updated}</p>
      <h1>community guidelines</h1>
      <p className="legal-lede">
        hookedcue is a small room with good acoustics. These are the house rules —
        short, because most of it is obvious.
      </p>

      <h2>what belongs here</h2>
      <ul>
        <li>Music you made, or music you have the rights to share.</li>
        <li>Honest hooks: mark the parts of the song that are actually good.</li>
        <li>Cover art and links that match the recording.</li>
      </ul>

      <h2>what doesn&rsquo;t</h2>
      <ul>
        <li>
          Copies, re-uploads or &ldquo;slowed + reverb&rdquo; editions of other
          people&rsquo;s recordings.
        </li>
        <li>
          Content that is hateful, harassing, sexually explicit, or that
          endangers children — the categories Indian law calls Prohibited
          Content, and then some.
        </li>
        <li>Anything that exists only to shock, scam or spam the deck.</li>
        <li>
          Artificial inflation of any kind: bot swipes, save farms, hook
          manipulation. The ranking reads real behaviour; faking it is theft
          from every honest creator on the platform.
        </li>
      </ul>

      <h2>what happens when someone crosses the line</h2>
      <ol>
        <li>Audio or tracks are unpublished while we look.</li>
        <li>
          First offences get a warning and a fix window where a fix exists.
        </li>
        <li>
          Prohibited content and repeat offences mean permanent removal, no
          ceremony.
        </li>
        <li>
          Anything illegal is escalated as the law requires — including to
          authorities where mandated.
        </li>
      </ol>

      <h2>reporting</h2>
      <p>
        Something in the deck that shouldn&rsquo;t be? Write to{" "}
        <a href="mailto:grievance@hookedcue.com">grievance@hookedcue.com</a>.
        Grievances are acknowledged within 24 hours and resolved within 72 for
        urgent matters (15 days for copyright cases, per{" "}
        <Link href="/copyright">the copyright policy</Link>). The designated
        Grievance Officer for hookedcue is the operator, MiNUs.
      </p>

      <p className="legal-footnote">
        The long-form obligations live in the{" "}
        <Link href="/terms">terms</Link>; your data rights live in the{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>
    </article>
  );
}
