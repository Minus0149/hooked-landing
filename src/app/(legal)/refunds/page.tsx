import type { Metadata } from "next";
import Link from "next/link";
import { CAMPAIGN_DAYS } from "@/data/promotion";

const updated = "26 September 2026";

export const metadata: Metadata = {
  title: "refunds and cancellation",
  description:
    "How cancelling a hookedcue promotion works, how refunds are calculated, and how long they take.",
  alternates: { canonical: "/refunds" },
  robots: { index: true, follow: true },
};

export default function RefundsPage() {
  return (
    <article className="legal">
      <p className="legal-kicker">last updated {updated}</p>
      <h1>refunds and cancellation</h1>
      <p className="legal-lede">
        The only thing you can pay hookedcue for is promoting your own song to listeners. Listening to
        music on hookedcue is free. This page covers what happens to your money when a promotion
        stops.
      </p>

      <h2>what you pay for</h2>
      <p>
        A promotion buys a number of distinct listeners who hear your song for at least 3 seconds. A
        campaign has {CAMPAIGN_DAYS} days to reach them.
      </p>

      <h2>you get back what we don&apos;t deliver</h2>
      <ul>
        <li>
          <strong>If the campaign ends short.</strong> When the {CAMPAIGN_DAYS} days are up with
          listeners still owed, we refund the unused share automatically: the amount you paid ×
          (listeners not reached ÷ listeners bought), rounded down to the paisa.
        </li>
        <li>
          <strong>If you cancel.</strong> Stop a campaign any time from the creator dashboard; the
          undelivered share is refunded the same way. Listeners already reached are not refundable.
        </li>
        <li>
          <strong>If we remove your song</strong> for breaking our <Link href="/guidelines">guidelines</Link>{" "}
          or a copyright claim, the undelivered share is refunded.
        </li>
        <li>
          <strong>If a payment went through twice</strong> or you were charged for a campaign that never
          started, write to us and we refund it in full.
        </li>
      </ul>

      <h2>how long it takes</h2>
      <ul>
        <li>We start the refund within 2 business days of the campaign ending or being cancelled.</li>
        <li>
          It goes back to the way you paid (UPI, card, netbanking or wallet) through Razorpay, and
          normally reaches you in 5–7 business days after that. Your bank may take longer to show it.
        </li>
        <li>You can see each refund and its status on your campaign in the creator dashboard.</li>
      </ul>

      <h2>what isn&apos;t refundable</h2>
      <ul>
        <li>Listeners already delivered — they heard your song.</li>
        <li>A campaign that reached everyone it was bought for.</li>
      </ul>

      <h2>problems with a payment</h2>
      <p>
        Email <a href="mailto:hello@hookedcue.com">hello@hookedcue.com</a> with your Razorpay payment
        id (it starts with <code>pay_</code>) and we reply within 2 business days. If you are not
        satisfied, write to our grievance officer at{" "}
        <a href="mailto:grievance@hookedcue.com">grievance@hookedcue.com</a>.
      </p>

      <p className="legal-foot-note">
        Pricing is on the <Link href="/artists">artists page</Link>; the full terms are on the{" "}
        <Link href="/terms">terms page</Link>.
      </p>
    </article>
  );
}
