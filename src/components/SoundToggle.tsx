"use client";
import { useSyncExternalStore } from "react";
import { onSound, setSound, soundOn } from "@/lib/sfx";

/**
 * Sound for the story — off until asked. Each gesture in the film has its
 * sound (the whoosh of a skip, the drop into the sleeve…); a landing page that
 * made noise uninvited would just get closed.
 */
export default function SoundToggle() {
  const on = useSyncExternalStore(onSound, soundOn, () => false);
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      onClick={() => setSound(!on)}
      title={on ? "turn the story's sound off" : "hear the story as you scroll"}
    >
      <span className="bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="label">{on ? "sound on" : "sound off"}</span>
    </button>
  );
}
