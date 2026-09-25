"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Magnetic } from "@/components/Chrome";
import BetaForm from "@/components/BetaForm";
import { FaqList, Headline, Tag } from "@/components/Sections";
import { MoodTry } from "@/components/Moods";
import { HeroCaption, SongTimeline, StagePhone, StageWheel } from "@/components/StageOverlays";
import { SCENES, onFilm, playhead, setFilm, type SceneId } from "@/lib/film";
import { appLinkProps, appUrl } from "@/lib/site";

/*
 * The page is one film. Scenes run down the copy column; the stage is pinned
 * beside them (above them on a phone) and plays the story as they pass: a
 * record on a turntable that lifts off, acts out each gesture, gets a mood
 * and is filed away, then comes back to the deck for the finale.
 *
 * The words and the stage are separate boxes by construction. The first
 * version of this story drew one full-screen canvas under the copy and the
 * record kept landing on the words; here it can't reach them.
 */

// three.js is client-only, and waits for the preloader to lift (see Chrome)
const Stage = dynamic(() => import("./Stage"), { ssr: false });
const PRELOADER_MS = 1500;

type Block = {
  id: SceneId;
  /** the copy doesn't pin: it's taller than a screen, so it scrolls normally */
  flow?: boolean;
  /** flows on a phone only (pinned on wide screens) */
  flowPhone?: boolean;
};

const BLOCKS: Block[] = [
  { id: "needle", flowPhone: true },
  { id: "problem" },
  { id: "skip" },
  { id: "save" },
  { id: "more" },
  { id: "never" },
  { id: "mood", flow: true },
  { id: "archive" },
  { id: "faq", flow: true },
  { id: "join", flow: true },
];

const GESTURE_COPY: Record<string, { dir: string; verb: string; title: React.ReactNode; body: string; color: string }> = {
  skip: {
    dir: "↑", verb: "swipe up", color: "var(--text)",
    title: <>up, and it&apos;s <span className="pink">gone.</span></>,
    body: "the next hook is already playing before your thumb is back down. a skip teaches it as much as a save does.",
  },
  save: {
    dir: "↓", verb: "swipe down", color: "var(--save)",
    title: <>down, and it&apos;s <span style={{ color: "var(--save)" }}>yours.</span></>,
    body: "the song slides into its sleeve — a second slower than it needs to be, on purpose — and lands in your library, or the playlist you're filling.",
  },
  more: {
    dir: "→", verb: "swipe right", color: "var(--more)",
    title: <>right, for <span style={{ color: "var(--more)" }}>more of that.</span></>,
    body: "not a save. the next few cards bend toward that sound, then let go.",
  },
  never: {
    dir: "←", verb: "swipe left", color: "var(--never)",
    title: <>left, and <span style={{ color: "var(--never)" }}>never again.</span></>,
    body: "that artist doesn't come back. no soft mute, no “show me less often”.",
  },
};

function SceneCopy({ id }: { id: SceneId }) {
  if (id === "needle") {
    return (
      <div className="hero-copy">
        <p className="kicker">a tiktok for music</p>
        <Headline
          words={[
            { t: "your" }, { t: "next" }, { t: "favorite" }, { t: "song" }, { t: "is" },
            { t: "one", alt: true }, { t: "swipe", alt: true }, { t: "away", alt: true },
          ]}
        />
        <p className="hero-sub">
          every song starts at its hook — the part you&apos;d sit through forty seconds of intro
          to reach. by the fourth swipe it has stopped guessing.
        </p>
        <div className="hero-cta">
          <Magnetic>
            <Link className="btn-primary" href="/beta">
              join the beta
            </Link>
          </Magnetic>
          <a className="btn-browser" href={appUrl} {...appLinkProps}>
            try the web app <span>→</span>
          </a>
        </div>
      </div>
    );
  }
  if (id === "problem") {
    return (
      <div className="scene-copy">
        <Tag n="01" label="the problem" />
        <h2>
          algorithms feed you <span className="pink">leftovers.</span>
        </h2>
        <p className="lead">
          we bail a few seconds before the part that would have sold us, decide the song
          wasn&apos;t our thing, and go back to the playlist that keeps handing us what we saved
          in 2021.
        </p>
        <p className="punch">
          so hooked. starts every song <span className="pink">at the hook.</span>
        </p>
        <p className="sources">
          sources: paul lamere, billions of spotify plays · ohio state, musicae scientiae,
          1986–2015
        </p>
      </div>
    );
  }
  if (id in GESTURE_COPY) {
    const g = GESTURE_COPY[id];
    const n = ["skip", "save", "more", "never"].indexOf(id) + 1;
    return (
      <div className="scene-copy" style={{ ["--g" as string]: g.color }}>
        <Tag n={`02.${n}`} label="the gestures" />
        <span className="g-dir">
          <i aria-hidden="true">{g.dir}</i> {g.verb}
        </span>
        <h2>{g.title}</h2>
        <p className="lead">{g.body}</p>
        {id === "never" && (
          <p className="g-sum">four swipes, no menus. that&apos;s the whole app.</p>
        )}
      </div>
    );
  }
  if (id === "mood") {
    return (
      <div className="scene-copy">
        <Tag n="03" label="hold" />
        <h2>
          hold a song. <span className="pink">pick a mood.</span>
        </h2>
        <p className="lead">
          press and hold any card and a wheel of six moods opens under your thumb. push toward
          one and let go — the deck leans that way for the rest of the session. changed your
          mind? slide back to the middle.
        </p>
        <MoodTry />
      </div>
    );
  }
  if (id === "archive") {
    return (
      <div className="scene-copy">
        <Tag n="04" label="your archive" />
        <h2>
          everything you kept, <span style={{ color: "var(--save)" }}>filed.</span>
        </h2>
        <p className="lead">
          liked songs, discoveries and your playlists fill themselves as you swipe down. start
          a playlist for a mood and the deck fills it for you — on your phone and in the
          browser, the same library.
        </p>
      </div>
    );
  }
  if (id === "faq") {
    return (
      <div className="scene-copy scene-faq" id="faq">
        <Tag n="05" label="quick answers" />
        <h2 id="faq-title">
          things people <span className="pink">keep asking.</span>
        </h2>
        <FaqList />
        <p className="lead faq-more">
          something else? <a href="mailto:privacy@hookedcue.com">write to us</a>.
        </p>
      </div>
    );
  }
  return (
    <div className="scene-copy join-copy" id="cta">
      <Tag n="06" label="the beta" />
      <h2>
        come <span className="pink">break it.</span>
      </h2>
      <p className="lead">
        android goes out through play store closed testing. leave the google account on your
        phone and the invite finds you there.
      </p>
      <BetaForm compact />
      <p className="join-alt">
        not on android, or can&apos;t wait?{" "}
        <a href={appUrl} {...appLinkProps}>
          try it in your browser →
        </a>{" "}
        it&apos;s the whole app, no signup.
      </p>
    </div>
  );
}

/** Where you are in the story — and a way to jump to any scene. Wide screens. */
function SceneIndex({ active }: { active: number }) {
  return (
    <nav className="scene-index" aria-label="scenes">
      <ol>
        {SCENES.map((s, i) => (
          <li key={s.id} className={i === active ? "on" : i < active ? "past" : undefined}>
            <a href={`#scene-${s.id}`} aria-current={i === active ? "step" : undefined}>
              <i aria-hidden="true" />
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function Film() {
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const [stageReady, setStageReady] = useState(false);
  const [active, setActive] = useState(0);
  const [inFilm, setInFilm] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setStageReady(true), PRELOADER_MS);
    return () => clearTimeout(t);
  }, []);

  // the playhead: where each scene block sits against the anchor line
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const phone = window.innerWidth < 960;
      // on a phone the copy lives in the lower half, under the stage
      const anchor = window.innerHeight * (phone ? 0.74 : 0.5);
      const rects = blocks.current.map((el) => {
        const r = el?.getBoundingClientRect();
        return { top: r?.top ?? 0, height: r?.height ?? 1 };
      });
      setFilm(playhead(rects, anchor));
      const last = rects[rects.length - 1];
      setInFilm(rects[0].top < window.innerHeight && last.top + last.height > window.innerHeight * 0.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => onFilm((t) => setActive(Math.min(SCENES.length - 1, Math.floor(t)))), []);

  return (
    <section className="film" id="top" data-scene={SCENES[active]?.id}>
      <div className="film-stage" aria-hidden={false}>
        <div className="stage-box">
          {stageReady && <Stage />}
          <HeroCaption />
          <SongTimeline />
          <StagePhone />
          <StageWheel />
          <div className="stage-fade" aria-hidden="true" />
        </div>
      </div>

      <div className="film-copy">
        {BLOCKS.map((b, i) => (
          <article
            key={b.id}
            id={`scene-${b.id}`}
            ref={(el) => {
              blocks.current[i] = el;
            }}
            className={`scene scene-${b.id}${b.flow ? " flow" : ""}${b.flowPhone ? " flow-phone" : ""}`}
            aria-label={SCENES[i].label}
          >
            <motion.div
              className="scene-inner"
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: "some", margin: "0px 0px -12% 0px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <SceneCopy id={b.id} />
            </motion.div>
          </article>
        ))}
      </div>

      {inFilm && <SceneIndex active={active} />}
    </section>
  );
}
