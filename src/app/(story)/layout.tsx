import Link from "next/link";
import SmoothScroll from "@/components/SmoothScroll";
import SceneLoader from "@/components/SceneLoader";
import {
  Preloader,
  Cursor,
  ProgressRail,
  BigWord,
  JukeboxDock,
  Magnetic,
} from "@/components/Chrome";

/**
 * The scroll story: WebGL scene, preloader, smooth scroll, the lot.
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
      <BigWord />
      <SceneLoader />
      <ProgressRail />
      <nav>
        <a className="wordmark" href="#" aria-label="back to top">
          hooked<i>.</i>
        </a>
        <Magnetic>
          <Link className="nav-cta" href="/beta">
            join the beta
          </Link>
        </Magnetic>
      </nav>
      {children}
      <JukeboxDock />
      <div className="vignette" />
      <div className="grain" />
    </SmoothScroll>
  );
}
