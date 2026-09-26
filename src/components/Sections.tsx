"use client";
import { Fragment, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { FAQS } from "@/data/faq";

/*
 * Shared pieces of the page: section tags, the headline reveal, the FAQ list
 * and the footer. The story itself is in Film.tsx.
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

/* word-by-word headline reveal */
export function Headline({
  words,
  delay = 0.55,
}: {
  /** `br` ends a line after that word (on screens wide enough to hold it) */
  words: { t: string; alt?: boolean; br?: boolean }[];
  delay?: number;
}) {
  return (
    <h1>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className={`word-mask${w.br ? " line-end" : ""}`}>
            <motion.span
              className={w.alt ? "alt" : undefined}
              initial={{ y: "110%", rotate: 4 }}
              animate={{ y: "0%", rotate: 0 }}
              transition={{ delay: delay + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {w.t}
            </motion.span>{" "}
          </span>
          {/* a real break: a pseudo-element inside the word's inline-block
              can't end the line it sits on */}
          {w.br && <br className="line-break" />}
        </Fragment>
      ))}
    </h1>
  );
}

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq-list">
      {FAQS.map((item, i) => (
        <FaqItem
          key={item.q}
          q={item.q}
          a={item.a}
          open={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
        />
      ))}
    </div>
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
      <span>hookedcue © 2026 · previews via itunes · your taste stays yours</span>
    </footer>
  );
}
