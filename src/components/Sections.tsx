"use client";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { Magnetic, Tilt } from "@/components/Chrome";

const rise = {
  initial: { opacity: 0, y: 46 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12% 0px" },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
};

function Tag({ n, label }: { n: string; label: string }) {
  return (
    <motion.div className="sec-tag" {...rise}>
      <span>{n}</span> — {label}
    </motion.div>
  );
}

/* word-by-word headline reveal */
function Headline({ words, delay = 0.55 }: { words: { t: string; alt?: boolean }[]; delay?: number }) {
  return (
    <h1>
      {words.map((w, i) => (
        <span key={i} className="word-mask">
          <motion.span
            className={w.alt ? "alt" : undefined}
            initial={{ y: "110%", rotate: 4 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ delay: delay + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {w.t}
          </motion.span>{" "}
        </span>
      ))}
    </h1>
  );
}

const TICKER = ["psych pop", "punjabi wave", "afrobeats", "bollywood strings", "deep house", "motown soul", "bedroom indie", "k-pop b-sides"];

// the future app.<domain> home — configurable so it goes live the day the domain does
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "#cta";

export function Hero() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="hero">
      <div className="hero-copy">
      <motion.p
        className="kicker"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.7 }}
      >
        a tiktok for music
      </motion.p>
      <Headline
        words={[
          { t: "your" }, { t: "next" }, { t: "favorite" }, { t: "song" }, { t: "is" },
          { t: "one", alt: true }, { t: "swipe", alt: true }, { t: "away", alt: true },
        ]}
      />
      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.8 }}
      >
        we play the best 30 seconds of songs you&apos;ve never heard. four swipes teach
        us exactly what you love. no leftovers, no filler — just hooks.
      </motion.p>
      <motion.div
        className="hero-cta"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.8 }}
      >
        <Magnetic>
          <a className="btn-primary" href="/hooked.apk" download>
            download for android
          </a>
        </Magnetic>
        <a className="btn-browser" href={APP_URL} {...(APP_URL.startsWith("#") ? {} : { target: "_blank", rel: "noreferrer" })}>
          try it in your browser <span>→</span>
        </a>
      </motion.div>
      <motion.div
        className="hero-stats"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.45, duration: 0.8 }}
      >
        <div><b>118</b><span>hand-cut hooks</span></div>
        <div><b>19</b><span>genres deep</span></div>
        <div><b>30s</b><span>only the good part</span></div>
        <div><b>4</b><span>swipes to read you</span></div>
      </motion.div>
      <motion.div
        className="now-spinning"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <i /> now spinning&nbsp;
        <span key={tick} className="ticker-word">{TICKER[tick % TICKER.length]}</span>
      </motion.div>
      </div>
      <a className="scroll-hint" href="#why">scroll</a>
    </section>
  );
}

export function Why() {
  return (
    <section className="chapter right" id="why">
      <div className="copy">
        <Tag n="01" label="the problem" />
        <motion.h2 {...rise}>
          algorithms feed you <span style={{ color: "var(--pink)" }}>leftovers.</span>
        </motion.h2>
        <motion.p {...rise}>
          every platform plays it safe — the same forty songs, reheated. discovery
          shouldn&apos;t feel like a queue. it should feel like flipping through a crate of
          records, dropping the needle on something you&apos;ve never heard, and knowing
          within seconds.
        </motion.p>
        <motion.div className="receipts" {...rise}>
          <span>your weekly mix: 80% songs you already saved</span>
          <span>radio: the same rotation since 2019</span>
          <span>hooked.: zero repeats until you ask</span>
        </motion.div>
      </div>
    </section>
  );
}

const GESTURES = [
  { color: "#fff", stamp: "skip ↑", title: "not feeling it? gone in a flick.", copy: "swipe up and the next hook is already playing. even your skips teach us." },
  { color: "var(--save)", stamp: "♥ saved", title: "love it? it becomes a record.", copy: "swipe down and the card morphs into vinyl, sliding into its own sleeve. saved — with ceremony." },
  { color: "var(--more)", stamp: "✦ more like this", title: "chase the vibe without saving.", copy: "the gesture no other app has: swipe right and the feed bends toward that exact sound." },
  { color: "var(--never)", stamp: "✕ never", title: "hate it? it never returns.", copy: "swipe left and that artist is gone from your universe. we hold grudges so you don't have to." },
];

export function Gestures() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [count, setCount] = useState(1);
  useMotionValueEvent(scrollYProgress, "change", (v) =>
    setCount(Math.min(4, Math.max(1, Math.floor(v * 4) + 1))),
  );
  // the whole stage (last panel + the big counter) must exit with the
  // section — otherwise it scrolls away still visible, ghosting the next chapter
  const stageOpacity = useTransform(scrollYProgress, [0.93, 1], [1, 0]);
  const stageY = useTransform(scrollYProgress, [0.93, 1], [0, -60]);
  const g = GESTURES[count - 1];
  return (
    <section id="gestures" ref={ref}>
      <div className="gesture-stage">
        <motion.div
          style={{
            opacity: stageOpacity, y: stageY,
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center",
          }}
        >
          <div className="sec-tag stage-tag"><span>02</span> — the gestures</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              className="gesture-panel"
              style={{ color: g.color }}
              initial={{ opacity: 0, y: 46 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -46 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="stamp">{g.stamp}</span>
              <h2 style={{ color: "var(--text)" }}>{g.title}</h2>
              <p style={{ color: "var(--muted)" }}>{g.copy}</p>
            </motion.div>
          </AnimatePresence>
          <div className="gesture-count">0{count}</div>
          <div className="gesture-dashes">
            {GESTURES.map((gg, i) => (
              <span key={i} className={i < count ? "on" : ""} style={i < count ? { background: gg.color } : undefined} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Ritual() {
  return (
    <section id="ritual">
      <div className="pin">
        <div className="copy">
          <Tag n="03" label="the ritual" />
          <motion.h2 {...rise}>
            saving a song should <span style={{ color: "var(--save)" }}>feel like something.</span>
          </motion.h2>
          <motion.p {...rise} style={{ color: "var(--muted)" }}>
            watch the sleeve open. every save is a record slid home — your taste,
            pressed to wax, one swipe at a time.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

export function Transform() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.42, 0.55], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.42, 0.58], [0.9, 1]);
  const py = useTransform(scrollYProgress, [0.45, 0.8], [40, -30]);
  return (
    <section id="transform" ref={ref}>
      <div className="pin">
        <Tag n="04" label="the app" />
        <motion.div className="phone-shell" style={{ opacity, scale, y: py }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/03-discover-deck.png" alt="the hooked. swipe deck" />
        </motion.div>
        <motion.h2 {...rise}>
          118 hooks. four gestures.
          <br />
          zero leftovers.
        </motion.h2>
      </div>
    </section>
  );
}

const GENRES = "afrobeats ✦ psych pop ✦ bollywood ✦ house ✦ soul ✦ reggaeton ✦ indie folk ✦ k-pop ✦ hip hop ✦ classic rock ✦ punjabi ✦ electronic ✦ ";

function MarqueeRow({ reverse }: { reverse?: boolean }) {
  return (
    <div className={`marquee-track ${reverse ? "reverse" : ""}`}>
      {(GENRES + GENRES).split("✦").map((g, i) => (
        <span key={i}>
          {g}
          <i>✦</i>
        </span>
      ))}
    </div>
  );
}
export function Marquee() {
  return (
    <div className="marquee">
      <MarqueeRow />
      <MarqueeRow reverse />
    </div>
  );
}

const FAQS = [
  {
    q: "what is hooked.?",
    a: "hooked. is a swipe-based music discovery app. it plays the strongest 30 seconds of a song first, then lets your gestures decide what comes next.",
  },
  {
    q: "how is it different from spotify radio?",
    a: "radio leans on safe repeats. hooked. treats every skip, save, more-like-this, and never-again swipe as a direct taste signal for discovery.",
  },
  {
    q: "where do the previews come from?",
    a: "the catalog uses publicly available song previews and focuses on fast discovery. full-song links can open on services like apple music, spotify, or youtube.",
  },
  {
    q: "can i save songs and playlists?",
    a: "yes. swipe down to save a track, choose a destination, and build playlists around the songs you actually discovered.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title">
      <Tag n="05" label="quick answers" />
      <motion.h2 id="faq-title" {...rise}>
        music discovery, minus the <span style={{ color: "var(--pink)" }}>dead air.</span>
      </motion.h2>
      <div className="faq-grid">
        {FAQS.map((item) => (
          <motion.article className="faq-card" key={item.q} {...rise}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section id="cta">
      <Tag n="06" label="get it" />
      <motion.h2 {...rise} style={{ textAlign: "center" }}>
        stop queueing. <span style={{ color: "var(--pink)" }}>start swiping.</span>
      </motion.h2>
      <motion.div className="shots" {...rise}>
        {/* eslint-disable @next/next/no-img-element */}
        <Tilt><img src="/06-home-library.png" alt="home and library" /></Tilt>
        <Tilt><img src="/03-discover-deck.png" alt="the deck" /></Tilt>
        <Tilt><img src="/05-vinyl-into-sleeve.png" alt="the vinyl save" /></Tilt>
        {/* eslint-enable @next/next/no-img-element */}
      </motion.div>
      <motion.div className="cta-row" {...rise}>
        <Magnetic>
          <a className="btn-primary" href="/hooked.apk" download>
            download for android
          </a>
        </Magnetic>
        <a className="btn-browser" href={APP_URL} {...(APP_URL.startsWith("#") ? {} : { target: "_blank", rel: "noreferrer" })}>
          try it in your browser <span>→</span>
        </a>
        <a className="btn-ghost" href="#top">
          ios — soon, probably
        </a>
      </motion.div>
      <p className="cta-note">free · 90mb · no ads, no tracking, no idea what we&apos;re doing</p>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="who">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/minus-unaware-avatar.png" alt="minus, unaware" />
        <span>
          built in public by <strong style={{ color: "var(--text)" }}>MiNUs, unaware</strong> —
          mi &apos;n us, building things we&apos;re not qualified to build.
        </span>
      </div>
      <span>hooked. © 2026 · previews via itunes · your taste stays yours</span>
    </footer>
  );
}
