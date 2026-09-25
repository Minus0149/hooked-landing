import Link from "next/link";
import SmoothScroll from "@/components/SmoothScroll";
import SoundToggle from "@/components/SoundToggle";
import { Preloader, Cursor, JukeboxDock, Magnetic, NavShell } from "@/components/Chrome";

/**
 * The home page shell: preloader, smooth scroll, nav (with the story's sound
 * toggle), the hook player. The story and its WebGL stage are in Film.tsx.
 *
 * This lives in a route group rather than the root layout so that quieter routes
 * — /beta — don't drag in a 947KB three.js bundle and a 1.5s preloader to show
 * someone a form. Every fixed-position layer mounts here, OUTSIDE template.tsx,
 * because template's motion wrapper becomes a CSS containing block and would
 * resolve `position: fixed` against the whole page instead of the viewport.
 */
export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <Preloader />
      <Cursor />
      <NavShell>
        <a className="wordmark" href="#" aria-label="back to top">
          hooked<i>.</i>
        </a>
        <div className="nav-right">
          <SoundToggle />
          <Magnetic>
            <Link className="nav-cta" href="/beta">
              join the beta
            </Link>
          </Magnetic>
        </div>
      </NavShell>
      {children}
      <JukeboxDock />
      <div className="vignette" />
      <div className="grain" />
    </SmoothScroll>
  );
}
