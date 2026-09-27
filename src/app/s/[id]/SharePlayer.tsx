"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SharedTrack } from "@/lib/sharedTrack";
import { artworkAt } from "@/lib/sharedTrack";
import { waveBars } from "@/lib/recapParams";

/** Mirrors web/src/lib/attribution.ts: which previews are Apple's. */
function itunesId(track: SharedTrack): string | null {
  if (/^\d+$/.test(track.trackId)) return track.trackId;
  const imported = /^imp:itunes:(\d+)$/.exec(track.trackId);
  return imported ? imported[1] : null;
}
const fromApple = (t: SharedTrack) =>
  itunesId(t) !== null || /(^|\.)itunes\.apple\.com\/|(^|\.)mzstatic\.com\//.test(t.previewUrl);

const BARS = 44;

/**
 * The shared-song page: play the hook right here (Apple's own preview URL, or
 * a creator's upload — nothing is re-hosted), then go on to the app.
 */
export function SharePlayer({ track, hook, appUrl }: { track: SharedTrack; hook: number; appUrl: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const h = track.hooks[hook] ?? { startMs: 0, durationMs: 15_000, label: null };
  const src = track.audioUrl ?? track.previewUrl;
  const total = track.audioUrl ? Math.max(track.durationMs, 1) : 30_000;
  const from = Math.min(h.startMs / total, 0.9);
  const to = Math.min((h.startMs + h.durationMs) / total, 1);
  const bars = waveBars(track.trackId, BARS);
  const apple = fromApple(track);
  const id = itunesId(track);
  const appleMusic = id
    ? `https://music.apple.com/us/song/${id}`
    : `https://music.apple.com/us/search?term=${encodeURIComponent(`${track.title} ${track.artist}`)}`;
  const openInApp = `${appUrl}/discover?track=${encodeURIComponent(track.trackId)}${hook > 0 ? `&h=${hook}` : ""}`;

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => {
      const within = (el.currentTime * 1000 - h.startMs) / h.durationMs;
      setProgress(Math.min(Math.max(within, 0), 1));
      // the hook, not the whole preview: stop where the window ends
      if (el.currentTime * 1000 >= h.startMs + h.durationMs) {
        el.pause();
        setPlaying(false);
      }
    };
    const onEnd = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("pause", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("pause", onEnd);
    };
  }, [h.startMs, h.durationMs]);

  const toggle = async () => {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      return;
    }
    try {
      if (el.currentTime * 1000 < h.startMs || el.currentTime * 1000 >= h.startMs + h.durationMs - 250) {
        el.currentTime = h.startMs / 1000;
      }
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <main id="main" className="sp" style={{ ["--sp-accent" as string]: track.accent || "#ff3d71" }}>
      <header className="sp-top">
        <Link href="/" className="sp-mark" aria-label="hookedcue home">
          hookedcue<span>.</span>
        </Link>
      </header>

      <section className="sp-card">
        {/* eslint-disable-next-line @next/next/no-img-element -- Apple's artwork CDN, sized per request */}
        <img className="sp-art" src={artworkAt(track.artwork, 600)} alt={`${track.title} cover art`} width={600} height={600} />
        <p className="sp-kicker">hear the hook</p>
        <h1 className="sp-title">{track.title}</h1>
        <p className="sp-artist">{track.artist}</p>

        <button className="sp-play" onClick={() => void toggle()} aria-pressed={playing}>
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
          {playing ? "pause" : "play the hook"}
        </button>

        <div className="sp-wave" aria-hidden="true">
          {bars.map((v, i) => {
            const pos = i / BARS;
            const lit = pos >= from && pos < to;
            const played = lit && playing && (pos - from) / Math.max(to - from, 0.01) <= progress;
            return (
              <i
                key={i}
                className={lit ? (played ? "lit played" : "lit") : undefined}
                style={{ height: `${Math.round(v * 100)}%` }}
              />
            );
          })}
        </div>
        <audio ref={audio} src={src} preload="none" />

        <div className="sp-actions">
          <a className="btn-primary sp-open" href={openInApp}>
            open in hookedcue
          </a>
          <Link className="sp-secondary" href="/beta">
            get the android beta
          </Link>
        </div>

        <p className="sp-links">
          <a href={`/s/${encodeURIComponent(track.trackId)}/story${hook > 0 ? `?h=${hook}` : ""}`} target="_blank" rel="noreferrer">
            story image
          </a>
          {" · "}
          <a href={appleMusic} target="_blank" rel="noreferrer">
            full song on Apple Music ↗
          </a>
        </p>
        {apple && <p className="sp-credit">preview provided courtesy of iTunes</p>}
      </section>
    </main>
  );
}
