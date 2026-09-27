import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SharedTrack } from "./sharedTrack";
import { artworkAt } from "./sharedTrack";
import { waveBars, type RecapImageParams } from "./recapParams";

/**
 * Drawing for share images (next/og). Satori can't read woff2, so the brand
 * fonts ship as TTF under src/assets/og-fonts (both OFL — licences alongside).
 */

const FONT_DIR = path.join(process.cwd(), "src", "assets", "og-fonts");
let fontCache: Promise<{ name: string; data: Buffer; weight: 500 | 600 | 800 }[]> | null = null;

export function brandFonts() {
  fontCache ??= Promise.all([
    readFile(path.join(FONT_DIR, "Unbounded_800ExtraBold.ttf")).then((data) => ({ name: "Unbounded", data, weight: 800 as const })),
    readFile(path.join(FONT_DIR, "InstrumentSans_600SemiBold.ttf")).then((data) => ({ name: "Instrument Sans", data, weight: 600 as const })),
    readFile(path.join(FONT_DIR, "InstrumentSans_500Medium.ttf")).then((data) => ({ name: "Instrument Sans", data, weight: 500 as const })),
  ]);
  return fontCache.then((fonts) => fonts.map((f) => ({ ...f, style: "normal" as const })));
}

const INK = "#08080c";
const PINK = "#ff3d71";
const TEXT = "#f4f2ee";
const MUTED = "#9a98a3";

const MOOD_COLORS: Record<string, string> = {
  hyped: "#ff7a29",
  party: "#ff4d8d",
  sunny: "#ffd23f",
  chill: "#4fd1c5",
  tender: "#8b7cff",
  sleepy: "#5b8def",
};

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", fontFamily: "Unbounded", fontWeight: 800, fontSize: size, color: TEXT, letterSpacing: -size * 0.03 }}>
      HookedCue<span style={{ color: PINK }}>.</span>
    </div>
  );
}

/** A waveform with the hook lit up — the picture of "starts at the hook". */
function Wave({ seed, width, height, bars, hookFrom, hookTo }: { seed: string; width: number; height: number; bars: number; hookFrom: number; hookTo: number }) {
  const values = waveBars(seed, bars);
  const gap = Math.max(2, Math.round(width / bars / 3));
  const barW = (width - gap * (bars - 1)) / bars;
  return (
    <div style={{ display: "flex", alignItems: "center", width, height, gap }}>
      {values.map((v, i) => {
        const lit = i >= Math.floor(hookFrom * bars) && i < Math.ceil(hookTo * bars);
        return (
          <div
            key={i}
            style={{
              width: barW,
              height: Math.max(4, v * height),
              borderRadius: barW,
              background: lit ? PINK : "rgba(244,242,238,0.22)",
            }}
          />
        );
      })}
    </div>
  );
}

function hookSpan(track: SharedTrack, hook: number): [number, number] {
  const h = track.hooks[hook];
  // a preview is 30 s; creator uploads use their own length
  const total = track.audioUrl ? Math.max(track.durationMs, 1) : 30_000;
  // no marked hook: the app plays the whole preview (web/src/audio/usePlayer.ts)
  if (!h) return [0, 1];
  return [Math.min(h.startMs / total, 0.9), Math.min((h.startMs + h.durationMs) / total, 1)];
}

/** 1200x630 — the preview WhatsApp, Instagram DMs and iMessage show for a song link. */
export function SongCard({ track, hook }: { track: SharedTrack; hook: number }) {
  const [from, to] = hookSpan(track, hook);
  return (
    <div style={{ width: 1200, height: 630, display: "flex", background: INK, padding: 56, gap: 56, fontFamily: "Instrument Sans" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori (next/og) draws plain <img> */}
      <img src={artworkAt(track.artwork, 600)} width={518} height={518} style={{ borderRadius: 36, objectFit: "cover" }} alt="" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Wordmark size={40} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: PINK, letterSpacing: 3, textTransform: "uppercase" }}>hear the hook</div>
          <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: track.title.length > 26 ? 44 : 56, color: TEXT, lineHeight: 1.08, marginTop: 14 }}>
            {track.title.slice(0, 60)}
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, color: MUTED, marginTop: 12 }}>{track.artist.slice(0, 60)}</div>
        </div>
        <Wave seed={track.trackId} width={540} height={96} bars={42} hookFrom={from} hookTo={to} />
      </div>
    </div>
  );
}

/** 1080x1920 — a story image for a song. */
export function SongStory({ track, hook }: { track: SharedTrack; hook: number }) {
  const [from, to] = hookSpan(track, hook);
  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", alignItems: "center", background: INK, padding: "150px 90px", fontFamily: "Instrument Sans" }}>
      <Wordmark size={64} />
      {/* eslint-disable-next-line @next/next/no-img-element -- satori (next/og) draws plain <img> */}
      <img src={artworkAt(track.artwork, 900)} width={820} height={820} style={{ borderRadius: 56, marginTop: 110, objectFit: "cover" }} alt="" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 70, width: 900 }}>
        <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: track.title.length > 22 ? 58 : 72, color: TEXT, textAlign: "center", lineHeight: 1.08 }}>
          {track.title.slice(0, 60)}
        </div>
        <div style={{ fontSize: 42, fontWeight: 500, color: MUTED, marginTop: 18, textAlign: "center" }}>{track.artist.slice(0, 60)}</div>
      </div>
      <div style={{ display: "flex", marginTop: 70 }}>
        <Wave seed={track.trackId} width={860} height={130} bars={48} hookFrom={from} hookTo={to} />
      </div>
      <div style={{ display: "flex", marginTop: "auto", padding: "22px 44px", borderRadius: 999, background: PINK, color: INK, fontSize: 38, fontWeight: 600 }}>
        hear the hook · hookedcue.com
      </div>
    </div>
  );
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;

/** 1080x1920 — "my week in hooks". */
export function RecapStory({ p }: { p: RecapImageParams }) {
  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", background: INK, padding: "150px 96px", fontFamily: "Instrument Sans" }}>
      <Wordmark size={60} />
      <div style={{ fontSize: 34, fontWeight: 600, color: MUTED, letterSpacing: 5, textTransform: "uppercase", marginTop: 120 }}>
        {p.name ? `${p.name.toLowerCase()}'s week in hooks` : "my week in hooks"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
        <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: 220, color: PINK, lineHeight: 1 }}>{p.cards.toLocaleString("en-IN")}</div>
        <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: 72, color: TEXT, marginTop: 10 }}>intros skipped</div>
        <div style={{ fontSize: 36, fontWeight: 500, color: MUTED, marginTop: 18 }}>every song started at its hook</div>
      </div>
      <div style={{ display: "flex", gap: 28, marginTop: 90 }}>
        {[
          [plural(p.saves, "song", "songs"), "saved"],
          [plural(p.newArtists, "artist", "artists"), "new to me"],
          [`${p.saveRatePct}%`, "save rate"],
        ].map(([big, small]) => (
          <div key={small} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "30px 28px", borderRadius: 32, border: "2px solid rgba(244,242,238,0.14)" }}>
            <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: 44, color: TEXT }}>{big}</div>
            <div style={{ fontSize: 30, fontWeight: 500, color: MUTED, marginTop: 8 }}>{small}</div>
          </div>
        ))}
      </div>
      {p.moods.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 80 }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: MUTED, letterSpacing: 4, textTransform: "uppercase" }}>my moods</div>
          <div style={{ display: "flex", gap: 20, marginTop: 24 }}>
            {p.moods.map((m) => (
              <div key={m} style={{ display: "flex", padding: "16px 32px", borderRadius: 999, border: `3px solid ${MOOD_COLORS[m]}`, color: MOOD_COLORS[m], fontSize: 38, fontWeight: 600 }}>
                {m}
              </div>
            ))}
          </div>
        </div>
      )}
      {p.topArtist && (
        <div style={{ display: "flex", fontSize: 38, fontWeight: 500, color: TEXT, marginTop: 70 }}>
          on repeat: <span style={{ marginLeft: 12, fontWeight: 600, color: PINK }}>{p.topArtist}</span>
        </div>
      )}
      <div style={{ display: "flex", marginTop: "auto", alignSelf: "center", padding: "22px 44px", borderRadius: 999, background: PINK, color: INK, fontSize: 38, fontWeight: 600 }}>
        find yours · hookedcue.com
      </div>
    </div>
  );
}
