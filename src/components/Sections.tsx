"use client";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Magnetic } from "@/components/Chrome";
import SceneLoader from "@/components/SceneLoader";
import BetaForm from "@/components/BetaForm";
import { FAQS } from "@/data/faq";
import { appUrl, appLinkProps } from "@/lib/site";

/*
 * The page, in six sections: hero, the problem, the gestures, the moods, quick
 * answers, the beta. It used to be fifteen screens of scroll-driven chapters
 * with a 3D record flying between them — and on real screens the record, the
 * sleeve and the deck kept landing on top of the words. Now the turntable
 * stays in the hero, every section is ordinary flow, and nothing moves over
 * copy.
 */

export const rise = {
  initial: { opacity: 0, y: 34 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-8% 0px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

export function Tag({ n, label }: { n: string; label: string }) {
  return (
    <motion.p className="sec-tag" {...rise}>
      <span>{n}</span> — {label}
    </motion.p>
  );
}

/** A muted clip that plays only while it's on screen. */
function Loop({ name, label }: { name: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="metadata"
      poster={`/media/${name}.jpg`}
      aria-label={label}
    >
      <source src={`/media/${name}.webm`} type="video/webm" />
      <source src={`/media/${name}.mp4`} type="video/mp4" />
    </video>
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

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <motion.p className="kicker" {...fade(0.45)}>
          a tiktok for music
        </motion.p>
        <Headline
          words={[
            { t: "your" }, { t: "next" }, { t: "favorite" }, { t: "song" }, { t: "is" },
            { t: "one", alt: true }, { t: "swipe", alt: true }, { t: "away", alt: true },
          ]}
        />
        <motion.p className="hero-sub" {...fade(1.1)}>
          every song starts at its hook — the part you&apos;d normally sit through forty
          seconds of intro to reach. swipe it away if it isn&apos;t landing. by the fourth
          swipe it has stopped guessing.
        </motion.p>
        <motion.div className="hero-cta" {...fade(1.25)}>
          <Magnetic>
            <Link className="btn-primary" href="/beta">
              join the beta
            </Link>
          </Magnetic>
          <a className="btn-browser" href={appUrl} {...appLinkProps}>
            try it in your browser <span>→</span>
          </a>
        </motion.div>
        <motion.ul className="hero-facts" {...fade(1.4)}>
          <li><b>1,600+</b> songs</li>
          <li><b>30s</b> each, from the hook</li>
          <li><b>4</b> gestures, no menus</li>
        </motion.ul>
      </div>

      <div className="hero-stage">
        <SceneLoader />
        <motion.div
          className="hero-phone"
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -5 }}
          transition={{ delay: 1.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Loop name="hero-deck" label="the hooked. deck: swiping through songs" />
        </motion.div>
      </div>
    </section>
  );
}

const STATS = [
  { n: "24%", t: "of songs are skipped inside the first five seconds" },
  { n: "35%", t: "never make it as far as thirty seconds" },
  { n: "0:40", t: "is roughly where the chorus finally turns up" },
];

export function Problem() {
  return (
    <section className="sec problem" id="why">
      <div className="sec-head">
        <Tag n="01" label="the problem" />
        <motion.h2 {...rise}>
          algorithms feed you <span className="pink">leftovers.</span>
        </motion.h2>
        <motion.p className="lead" {...rise}>
          we bail a few seconds before the part that would have sold us, decide the song
          wasn&apos;t our thing, and go back to the playlist that keeps handing us what we
          saved in 2021.
        </motion.p>
      </div>
      <ol className="stats">
        {STATS.map((s, i) => (
          <motion.li key={s.n} {...rise} transition={{ ...rise.transition, delay: i * 0.08 }}>
            <b>{s.n}</b>
            <span>{s.t}</span>
          </motion.li>
        ))}
      </ol>
      <motion.p className="punch" {...rise}>
        so hooked. starts every song <span className="pink">at the hook.</span>
      </motion.p>
      <p className="sources">
        sources: paul lamere, billions of spotify plays · ohio state, musicae scientiae, 1986–2015
      </p>
    </section>
  );
}

const GESTURES = [
  {
    key: "skip", dir: "↑", verb: "up", title: "skip", color: "var(--text)",
    copy: "the next hook is playing before your thumb is back down. skips teach it as much as saves do.",
  },
  {
    key: "save", dir: "↓", verb: "down", title: "save", color: "var(--save)",
    copy: "the card becomes a record and slides into its sleeve — a second slower than it needs to be, on purpose.",
  },
  {
    key: "more", dir: "→", verb: "right", title: "more like this", color: "var(--more)",
    copy: "not a save. it bends the next few cards toward that sound, then lets go.",
  },
  {
    key: "never", dir: "←", verb: "left", title: "never", color: "var(--never)",
    copy: "that artist doesn't come back. no soft mute, no “show me less often”.",
  },
];

export function Gestures() {
  return (
    <section className="sec gestures" id="gestures">
      <div className="sec-head">
        <Tag n="02" label="the gestures" />
        <motion.h2 {...rise}>
          four swipes. <span className="pink">that&apos;s the whole app.</span>
        </motion.h2>
        <motion.p className="lead" {...rise}>
          no stars, no thumbs, no menus. every card answers to your thumb, and every answer
          moves the deck.
        </motion.p>
      </div>
      <ul className="g-grid">
        {GESTURES.map((g, i) => (
          <motion.li
            key={g.key}
            className="g-card"
            style={{ ["--g" as string]: g.color }}
            {...rise}
            transition={{ ...rise.transition, delay: i * 0.07 }}
          >
            <div className="g-clip">
              <Loop name={`gesture-${g.key}`} label={`swipe ${g.verb} to ${g.title}, in the app`} />
            </div>
            <div className="g-text">
              <span className="g-dir">
                <i aria-hidden="true">{g.dir}</i> swipe {g.verb}
              </span>
              <h3>{g.title}</h3>
              <p>{g.copy}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className={`faq-item${open ? " open" : ""}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-a`} id={`${id}-q`} onClick={onToggle}>
          <span>{q}</span>
          <i aria-hidden="true" />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-a`}
            role="region"
            aria-labelledby={`${id}-q`}
            className="faq-a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="sec faq" id="faq" aria-labelledby="faq-title">
      <div className="faq-side">
        <Tag n="04" label="quick answers" />
        <motion.h2 id="faq-title" {...rise}>
          things people <span className="pink">keep asking.</span>
        </motion.h2>
        <motion.p className="lead" {...rise}>
          something else? <a href="mailto:privacy@hookedcue.com">write to us</a>.
        </motion.p>
      </div>
      <motion.div className="faq-list" {...rise}>
        {FAQS.map((item, i) => (
          <FaqItem
            key={item.q}
            q={item.q}
            a={item.a}
            open={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </motion.div>
    </section>
  );
}

export function Join() {
  return (
    <section className="sec join" id="cta">
      <div className="join-card">
        <Tag n="05" label="the beta" />
        <motion.h2 {...rise}>
          come <span className="pink">break it.</span>
        </motion.h2>
        <motion.p className="lead" {...rise}>
          android goes out through play store closed testing. leave the google account on your
          phone and the invite finds you there.
        </motion.p>
        <motion.div {...rise}>
          <BetaForm compact />
        </motion.div>
        <p className="join-alt">
          not on android, or can&apos;t wait?{" "}
          <a href={appUrl} {...appLinkProps}>
            try it in your browser →
          </a>{" "}
          it&apos;s the whole app, no signup.
        </p>
      </div>
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
      <span className="foot-legal">
        <Link href="/privacy">privacy</Link> · <Link href="/terms">terms</Link> ·{" "}
        <Link href="/data-deletion">delete your data</Link>
      </span>
      <span>hooked. © 2026 · previews via itunes · your taste stays yours</span>
    </footer>
  );
}
