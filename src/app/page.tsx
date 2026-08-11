import {
  Hero,
  Why,
  Gestures,
  Ritual,
  Transform,
  Marquee,
  Faq,
  Cta,
  Footer,
} from "@/components/Sections";
import { FAQS } from "@/data/faq";
import { appUrl, siteUrl } from "@/lib/site";

export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "hooked.",
      applicationCategory: "MusicApplication",
      // android is in closed testing, so the only thing anyone can open today
      // is the web app — claiming a download would be a lie to the crawler
      operatingSystem: "Web",
      url: siteUrl,
      installUrl: appUrl,
      description:
        "A swipe-based music discovery app that plays short song previews and learns your taste from skips, saves, more-like-this signals, and never-again blocks.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: {
        "@type": "Organization",
        name: "MiNUs, unaware",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      // built from the same array the page renders — google wants the markup
      // and the visible text to be the same questions
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <main>
        <Hero />
        <Why />
        <Gestures />
        <Ritual />
        <Transform />
        <Marquee />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
