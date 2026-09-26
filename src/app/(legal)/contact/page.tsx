import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "contact",
  description: "How to reach hookedcue: support, artists, privacy, copyright and grievances.",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">contact</p>
      <h1>talk to us</h1>
      <p className="legal-lede">
        hookedcue is operated by MiNUs from India. Email is the fastest way to reach a person; we answer
        within 2 business days, Monday to Friday, 10:00–18:00 IST.
      </p>

      <h2>where to write</h2>
      <ul>
        <li>
          <strong>Help, beta access and artists:</strong>{" "}
          <a href="mailto:hello@hookedcue.com">hello@hookedcue.com</a>
        </li>
        <li>
          <strong>Payments and refunds:</strong> <a href="mailto:hello@hookedcue.com">hello@hookedcue.com</a>
          , with your payment id (<code>pay_…</code>). See the <Link href="/refunds">refunds policy</Link>.
        </li>
        <li>
          <strong>Your data:</strong> <a href="mailto:privacy@hookedcue.com">privacy@hookedcue.com</a> —
          or delete it yourself, as the <Link href="/data-deletion">data deletion page</Link> explains.
        </li>
        <li>
          <strong>Copyright:</strong> <a href="mailto:copyright@hookedcue.com">copyright@hookedcue.com</a>{" "}
          — the process is on the <Link href="/copyright">copyright page</Link>.
        </li>
        <li>
          <strong>Security issues:</strong> <a href="mailto:security@hookedcue.com">security@hookedcue.com</a>
        </li>
        <li>
          <strong>Grievance officer:</strong>{" "}
          <a href="mailto:grievance@hookedcue.com">grievance@hookedcue.com</a>. We acknowledge within 24
          hours and resolve within 15 days, as India&apos;s IT Rules require.
        </li>
      </ul>

      <p className="legal-foot-note">
        More: <Link href="/privacy">privacy</Link> · <Link href="/terms">terms</Link> ·{" "}
        <Link href="/artists">promote your music</Link>
      </p>
    </article>
  );
}
