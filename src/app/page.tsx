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

export default function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hookedcue.com";
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.hookedcue.com";
  const appUrl = configuredAppUrl.includes("localhost") ? siteUrl : configuredAppUrl;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "hooked.",
      applicationCategory: "MusicApplication",
      operatingSystem: "Android, Web",
      url: siteUrl,
      downloadUrl: `${siteUrl}/hooked.apk`,
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
      mainEntity: [
        {
          "@type": "Question",
          name: "What is hooked.?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "hooked. is a swipe-based music discovery app that plays short song previews so you can find new music quickly.",
          },
        },
        {
          "@type": "Question",
          name: "How does hooked. learn my music taste?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The app uses four gestures: skip, save, more like this, and never. Each swipe becomes a taste signal for future recommendations.",
          },
        },
        {
          "@type": "Question",
          name: "Can I try hooked. in a browser?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes. You can try the web app at ${appUrl} or download the Android APK from the landing page.`,
          },
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
