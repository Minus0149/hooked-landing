import type { Metadata } from "next";
import Link from "next/link";
import BetaForm from "@/components/BetaForm";
import { appUrl, appLinkProps } from "@/lib/site";

/**
 * hookedcue.com/hi — the landing hero and the beta signup in Hindi.
 *
 * Its own quiet page like /beta (no 3D film): the pitch, the four swipes, and
 * the same two-step form with lang="hi". Conversational Hindi that keeps the
 * words people actually say in English — hook, swipe, playlist, android.
 */
const title = "हर गाना उसके hook से शुरू";
const description =
  "HookedCue पर हर गाना सीधे अपने सबसे अच्छे हिस्से से बजता है। स्वाइप करें, सेव करें, और अपना अगला फ़ेवरेट गाना ढूँढें। browser में आज़माएँ या android beta से जुड़ें।";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/hi", languages: { en: "/", hi: "/hi" } },
  openGraph: {
    type: "website",
    url: "/hi",
    locale: "hi_IN",
    siteName: "HookedCue",
    title: `${title} | HookedCue`,
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "HookedCue" }],
  },
  robots: { index: true, follow: true },
};

const SWIPES = [
  { arrow: "↓", name: "नीचे", what: "गाना सेव — आपकी पसंद या किसी प्लेलिस्ट में" },
  { arrow: "↑", name: "ऊपर", what: "अगला गाना, तुरंत" },
  { arrow: "→", name: "दाएँ", what: "ऐसे और गाने लाओ" },
  { arrow: "←", name: "बाएँ", what: "ये फिर कभी नहीं" },
];

export default function HindiPage() {
  return (
    <main id="main" className="beta-page" lang="hi">
      <nav className="beta-nav">
        <Link className="wordmark" href="/">
          HookedCue<i>.</i>
        </Link>
        <span className="lang-switch">
          <Link className="beta-back" href="/" hrefLang="en" lang="en">
            English
          </Link>
        </span>
      </nav>

      <div className="beta-body">
        <header className="beta-head">
          <p className="sec-tag"><span>HookedCue</span> — गाने ढूँढने का नया तरीका</p>
          <h1>
            हर गाना उसके <span>hook से शुरू।</span>
          </h1>
          <p className="beta-intro">
            तीस सेकंड का intro सुनने की ज़रूरत नहीं। HookedCue हर गाने को सीधे उसके सबसे अच्छे
            हिस्से से बजाता है — आप स्वाइप करते जाइए, वो आपकी पसंद समझता जाता है।
          </p>
        </header>

        <ul className="hi-swipes" aria-label="चार स्वाइप">
          {SWIPES.map((s) => (
            <li key={s.arrow}>
              <b aria-hidden="true">{s.arrow}</b>
              <span>
                <strong>{s.name}</strong> {s.what}
              </span>
            </li>
          ))}
        </ul>

        <aside className="beta-try">
          <div>
            <b>अभी आज़माएँ</b>
            <span>browser वाला version ही पूरा ऐप है — हर स्वाइप, हर mood। कोई signup नहीं।</span>
          </div>
          <a className="btn-browser" href={appUrl} {...appLinkProps}>
            browser में सुनें <span>→</span>
          </a>
        </aside>

        <header className="beta-head hi-beta-head">
          <p className="sec-tag"><span>beta</span> — android closed test</p>
          <h2>
            android beta से <span>जुड़ें।</span>
          </h2>
          <p className="beta-intro">
            android ऐप पहले play store के closed test से आ रहा है। बस वो google account चाहिए जो
            आपके फ़ोन पर signed in है — invite उसी पर आएगा।
          </p>
        </header>

        <section className="beta-card" aria-label="android beta से जुड़ें">
          <BetaForm lang="hi" />
        </section>
      </div>

      <footer className="beta-foot">
        <span>
          <Link href="/privacy">privacy</Link> · <Link href="/terms">terms</Link> ·{" "}
          <Link href="/data-deletion">अपना डेटा हटाएँ</Link>
        </span>
        <span>HookedCue © 2026 · previews via itunes</span>
      </footer>

      <div className="vignette" />
      <div className="grain" />
    </main>
  );
}
