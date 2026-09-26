import type { Metadata } from "next";
import Link from "next/link";
import { appUrl, appLinkProps } from "@/lib/site";
import {
  CAMPAIGN_DAYS,
  COUNTED_LISTEN_SECONDS,
  LAUNCH_OFFER_PERCENT,
  PROMOTION_PACKAGES,
  perListener,
} from "@/data/promotion";

export const metadata: Metadata = {
  title: "promote your music",
  description:
    "Put your song in front of people who are already swiping for new music, starting at its hook. Pay per real listener, refunded for any we don't reach.",
  alternates: { canonical: "/artists" },
  robots: { index: true, follow: true },
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ArtistsPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">for artists</p>
      <h1>get your song heard at its hook</h1>
      <p className="legal-lede">
        hookedcue plays every song from its hook, and people swipe through them looking for something
        new. Promote a song and we deal it to listeners who haven&apos;t heard it — starting at the part
        you&apos;d want them to hear first. You pay for real listeners, and anything we don&apos;t
        deliver comes back to you.
      </p>

      <h2>what you get</h2>
      <ul>
        <li>
          <strong>Your hook, first.</strong> You mark where your song&apos;s hook is; that&apos;s where it
          starts playing.
        </li>
        <li>
          <strong>Real listeners, counted once.</strong> A listen counts when someone has heard your song
          for {COUNTED_LISTEN_SECONDS} seconds or more, and each person counts once per campaign.
        </li>
        <li>
          <strong>Honest numbers.</strong> Listens, saves, skips, &ldquo;more like this&rdquo; and
          &ldquo;never&rdquo; — and your save rate, the number that tells you if the song lands.
        </li>
        <li>
          <strong>Clearly labelled.</strong> Promoted songs carry a &ldquo;Promoted&rdquo; label, as the
          advertising code requires. No bots, no incentives, no fake streams.
        </li>
      </ul>

      <h2>pricing</h2>
      <p>Prices are in Indian rupees and are final — there are no extra fees on top.</p>
      <table className="price-table">
        <thead>
          <tr>
            <th scope="col">package</th>
            <th scope="col">listeners</th>
            <th scope="col">price</th>
            <th scope="col">per listener</th>
          </tr>
        </thead>
        <tbody>
          {PROMOTION_PACKAGES.map((p) => (
            <tr key={p.id}>
              <th scope="row">{p.name}</th>
              <td>{p.listeners.toLocaleString("en-IN")}</td>
              <td>{inr(p.priceInr)}</td>
              <td>₹{perListener(p.priceInr, p.listeners).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <strong>Launch offer:</strong> {LAUNCH_OFFER_PERCENT}% off your first campaign. While
        hookedcue is in beta we only sell as many listeners as we can actually reach, so a big package
        may show as full — try a smaller one, or come back soon.
      </p>

      <h2>how it works</h2>
      <ol>
        <li>
          <strong>Get in.</strong> hookedcue is invite-only for now.{" "}
          <Link href="/beta">Apply for the beta</Link> and mention you&apos;re an artist; we email you when
          you&apos;re in.
        </li>
        <li>
          <strong>Become a creator.</strong> Signed in, open the{" "}
          <a href={`${appUrl}/creator`} {...appLinkProps}>
            creator dashboard
          </a>{" "}
          and apply with your artist name and links. We check you&apos;re who you say you are.
        </li>
        <li>
          <strong>Upload and mark your hook.</strong> Upload a song you own the rights to and drag the
          marker to where it hooks.
        </li>
        <li>
          <strong>Pick a package and pay</strong> on the web, by UPI, card or netbanking, through
          Razorpay.
        </li>
        <li>
          <strong>Watch it land.</strong> Your campaign runs for up to {CAMPAIGN_DAYS} days; the
          dashboard shows every listen and swipe as it happens.
        </li>
      </ol>

      <h2>questions</h2>
      <h3>what if you don&apos;t reach everyone I paid for?</h3>
      <p>
        You get the difference back, automatically. If a campaign ends after {CAMPAIGN_DAYS} days with
        listeners still owed, the unused share is refunded pro rata to the way you paid. The full policy
        is on the <Link href="/refunds">refunds page</Link>.
      </p>
      <h3>can I stop a campaign?</h3>
      <p>Yes, any time from the dashboard. Whatever hasn&apos;t been delivered is refunded the same way.</p>
      <h3>which songs can I promote?</h3>
      <p>
        Your own, uploaded to hookedcue, that you have the rights to. Songs that break our{" "}
        <Link href="/guidelines">guidelines</Link> or someone else&apos;s{" "}
        <Link href="/copyright">copyright</Link> are removed, and the campaign refunded.
      </p>
      <h3>do you promote songs from the charts?</h3>
      <p>No. Promotion is for independent artists and their own uploads.</p>
      <h3>can I buy from the Android app?</h3>
      <p>No — promotion is bought on the web, at app.hookedcue.com.</p>

      <p>
        <Link className="btn-primary" href="/beta">
          apply as an artist
        </Link>
      </p>
      <p className="legal-foot-note">
        Questions before you start? Write to{" "}
        <a href="mailto:hello@hookedcue.com">hello@hookedcue.com</a>. More on the{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </article>
  );
}
