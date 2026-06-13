import {
  Hero,
  Why,
  Gestures,
  Ritual,
  Transform,
  Marquee,
  Cta,
  Footer,
} from "@/components/Sections";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Why />
        <Gestures />
        <Ritual />
        <Transform />
        <Marquee />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
