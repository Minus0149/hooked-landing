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
import Link from "next/link";
import { FAQS } from "@/data/faq";
import { appUrl, appLinkProps } from "@/lib/site";

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
        every song here starts at its hook — the part you&apos;d normally sit through
        forty seconds of intro to reach. swipe up if it isn&apos;t landing. by the
        fourth swipe it has stopped guessing.
      </motion.p>
      <motion.div
        className="hero-cta"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.8 }}
      >
        <Magnetic>
          <Link className="btn-primary" href="/beta">
            join the beta
          </Link>
        </Magnetic>
        <a className="btn-browser" href={appUrl} {...appLinkProps}>
          try it in your browser <span>→</span>
        </a>
      </motion.div>
      <motion.div
        className="hero-stats"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.45, duration: 0.8 }}
      >
        <div><b>118</b><span>hooks, cut by hand</span></div>
        <div><b>19</b><span>genres</span></div>
        <div><b>30s</b><span>only the good part</span></div>
        <div><b>4</b><span>ways to answer</span></div>
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
          the chorus usually turns up around forty seconds in, and a third of us are
          gone by thirty. so we bail a few seconds before the part that would have
          sold us, decide the song wasn&apos;t our thing, and go back to the playlist
          that keeps handing us stuff we saved in 2021.
        </motion.p>
        <motion.div className="receipts" {...rise}>
          <span>24% of songs are skipped inside the first 5 seconds</span>
          <span>35% never make it as far as 0:30</span>
          <span>the chorus normally lands somewhere after that</span>
          <span>hooked. starts you at the hook</span>
        </motion.div>
        <motion.p className="receipts-src" {...rise}>
          sources: paul lamere, billions of spotify plays · ohio state, musicae
          scientiae, 1986–2015
        </motion.p>
      </div>
    </section>
  );
}

const GESTURES = [
  { color: "#fff", stamp: "skip ↑", title: "up, and it's gone.", copy: "the next hook is playing before your thumb is back down. skips count for as much as saves here — they just point the other way." },
  { color: "var(--save)", stamp: "♥ saved", title: "down, and it's yours.", copy: "the card turns into a record and slides into its sleeve. it takes about a second longer than it strictly needs to. that was on purpose." },
  { color: "var(--more)", stamp: "✦ more like this", title: "right, for more of whatever that was.", copy: "not a save. it bends the next few cards toward that sound and then lets go." },
  { color: "var(--never)", stamp: "✕ never", title: "left, and that's the end of it.", copy: "the artist doesn't come back. no soft mute, no 'show me less often' — off the list." },
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
            we made saving <span style={{ color: "var(--save)" }}>slow on purpose.</span>
          </motion.h2>
          <motion.p {...rise} style={{ color: "var(--muted)" }}>
            the card becomes a record and slides into its sleeve. it costs you about a
            second. you could argue that second is wasted and you would probably be
            right, but a library you had to wait for ends up feeling like it cost
            something.
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
          <img
            src="/03-discover-deck.webp"
            alt="the hooked. swipe deck"
            width={600}
            height={1298}
            loading="lazy"
            decoding="async"
          />
        </motion.div>
        <motion.h2 {...rise}>
          118 hooks, cut by hand.
          <br />
          four gestures. that&apos;s the app.
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

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title">
      <Tag n="05" label="quick answers" />
      <motion.h2 id="faq-title" {...rise}>
        things people <span style={{ color: "var(--pink)" }}>keep asking.</span>
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
      <Tag n="06" label="the beta" />
      <motion.h2 {...rise} style={{ textAlign: "center" }}>
        come <span style={{ color: "var(--pink)" }}>break it.</span>
      </motion.h2>
      <motion.div className="shots" {...rise}>
        {/* eslint-disable @next/next/no-img-element */}
        <Tilt><img src="/06-home-library.webp" alt="home and library" width={600} height={1298} loading="lazy" decoding="async" /></Tilt>
        <Tilt><img src="/03-discover-deck.webp" alt="the deck" width={600} height={1298} loading="lazy" decoding="async" /></Tilt>
        <Tilt><img src="/05-vinyl-into-sleeve.webp" alt="the vinyl save" width={600} height={1298} loading="lazy" decoding="async" /></Tilt>
        {/* eslint-enable @next/next/no-img-element */}
      </motion.div>
      <motion.div className="cta-row" {...rise}>
        <Magnetic>
          <a className="btn-primary" href="/beta">
            join the beta
          </a>
        </Magnetic>
        <a className="btn-browser" href={appUrl} {...appLinkProps}>
          try it in your browser <span>→</span>
        </a>
        <span className="btn-ghost">android — play store, once testing closes</span>
      </motion.div>
      <p className="cta-note">free · no ads, no tracking, no idea what we&apos;re doing</p>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="who">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/minus-unaware-avatar.webp"
          alt="minus, unaware"
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
        />
        <span>
          built in public by <strong style={{ color: "var(--text)" }}>MiNUs, unaware</strong> —
          mi &apos;n us, building things we&apos;re not qualified to build.
        </span>
      </div>
      <span>hooked. © 2026 · previews via itunes · your taste stays yours</span>
    </footer>
  );
}
