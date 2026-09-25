"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { getState as jbState, spectrum, toggle as jbToggle } from "@/lib/jukebox";
import { bandLevels } from "@/lib/spectrum";
import { MOODS, type MoodId } from "@/data/moods";
import { film } from "@/lib/film";
import {
  ARCHIVE_SLEEVES,
  CUES,
  archive,
  deckView,
  deckY,
  fan,
  needle,
  phoneShown,
  recordPose,
  sleeveY,
} from "@/lib/choreo";
import { cuesCrossed, play } from "@/lib/sfx";

/**
 * The stage: one record's journey through the story, played by the scroll.
 *
 * Every position comes from lib/choreo.ts (pure, tested); this file only
 * copies those numbers onto meshes and lights them. The canvas fills the
 * pinned stage box beside (or above, on a phone) the copy — it never spans
 * the page, so nothing it draws can land on the words.
 */

const PINK = new THREE.Color("#ff3d71");
const MOOD_COLOR = Object.fromEntries(MOODS.map((m) => [m.id, new THREE.Color(m.accent)])) as Record<
  MoodId,
  THREE.Color
>;
/** the room takes the colour of the gesture being told */
const SCENE_LIGHT: Record<number, THREE.Color> = {
  2: new THREE.Color("#f4f2ee"),
  3: new THREE.Color("#00e5a0"),
  4: new THREE.Color("#ffb627"),
  5: new THREE.Color("#ff5252"),
};
/** each new song on stage wears a new label */
const LABELS: [string, string, string][] = [
  ["#ff5e88", "#e62c60", "#b81247"],
  ["#5ff2c2", "#00d493", "#00976a"],
  ["#ffcf6a", "#ffb627", "#c97f00"],
  ["#b3a4ff", "#8b7cff", "#5b4bd6"],
  ["#7fe0ff", "#3fbde8", "#1d86b0"],
];
const GREY_LABEL: [string, string, string] = ["#8a8894", "#5f5d68", "#3b3a42"];
const RECORD_HOLD_MS = 420;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (cur: number, target: number, f = 0.08) => cur + (target - cur) * f;

/* ---------- textures: one canvas = hundreds of grooves = one draw call ---------- */
function vinylTexture(label: [string, string, string]) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d")!;
  x.fillStyle = "#07070a";
  x.beginPath(); x.arc(512, 512, 512, 0, 7); x.fill();
  for (let r = 190; r < 500; r += 2.6) {
    const sheen = 0.035 + 0.045 * Math.abs(Math.sin(r * 0.12));
    x.strokeStyle = `rgba(255,255,255,${sheen.toFixed(3)})`;
    x.lineWidth = 1.1;
    x.beginPath(); x.arc(512, 512, r, 0, 7); x.stroke();
  }
  x.strokeStyle = "rgba(255,255,255,0.10)"; x.lineWidth = 3;
  x.beginPath(); x.arc(512, 512, 182, 0, 7); x.stroke();
  const g = x.createRadialGradient(470, 470, 20, 512, 512, 170);
  g.addColorStop(0, label[0]); g.addColorStop(0.6, label[1]); g.addColorStop(1, label[2]);
  x.fillStyle = g; x.beginPath(); x.arc(512, 512, 168, 0, 7); x.fill();
  x.strokeStyle = "rgba(8,8,12,.5)"; x.lineWidth = 4;
  x.beginPath(); x.arc(512, 512, 130, 0, 7); x.stroke();
  x.fillStyle = "#0b0b10";
  x.font = "900 56px Unbounded, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("hooked.", 512, 488);
  x.font = "600 26px Instrument Sans, sans-serif";
  x.fillText("SIDE A · YOUR TASTE", 512, 556);
  x.beginPath(); x.arc(512, 512, 14, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function sleeveTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 1024, 1024);
  g.addColorStop(0, "#123a2e"); g.addColorStop(1, "#0b1512");
  x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
  x.strokeStyle = "rgba(0,229,160,.9)"; x.lineWidth = 18; x.strokeRect(22, 22, 980, 980);
  x.strokeStyle = "rgba(0,229,160,.45)"; x.lineWidth = 13;
  x.beginPath(); x.arc(512, 470, 250, 0, 7); x.stroke();
  x.fillStyle = "#f4f2ee"; x.font = "900 96px Unbounded, sans-serif"; x.textAlign = "center";
  x.fillText("kept.", 512, 900);
  x.fillStyle = "rgba(244,242,238,.5)"; x.font = "600 34px Instrument Sans, sans-serif";
  x.fillText("THE TASTE ARCHIVE — VOL. 1", 512, 120);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function plaqueTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 160;
  const x = c.getContext("2d")!;
  x.fillStyle = "#15121a"; x.fillRect(0, 0, 1024, 160);
  x.fillStyle = "rgba(244,242,238,.9)";
  x.font = "900 54px Unbounded, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("the taste archive", 512, 66);
  x.fillStyle = "rgba(244,242,238,.45)"; x.font = "600 26px Instrument Sans, sans-serif";
  x.fillText("EVERY SONG YOU SWIPED DOWN", 512, 122);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** a soft round glow, for the light behind a standing record */
function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
function plateTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "rgba(244,242,238,.88)";
  x.font = "900 58px Unbounded, sans-serif"; x.textAlign = "left"; x.textBaseline = "middle";
  x.fillText("hooked.", 16, 48);
  x.fillStyle = "rgba(244,242,238,.4)"; x.font = "600 24px Instrument Sans, sans-serif";
  x.fillText("MODEL 01 · TASTE TURNTABLE", 18, 102);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A standing/lying record: roll (picture plane) > tilt (up) > spin > disc. */
function Disc({
  map,
  discRef,
  spinRef,
  tiltRef,
  matRef,
  events,
}: {
  map: THREE.Texture;
  discRef: React.RefObject<THREE.Group | null>;
  spinRef: React.RefObject<THREE.Group | null>;
  tiltRef: React.RefObject<THREE.Group | null>;
  matRef: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  events?: Record<string, unknown>;
}) {
  return (
    <group ref={discRef}>
      <group ref={tiltRef}>
        <group ref={spinRef}>
          <mesh {...events}>
            <cylinderGeometry args={[2.05, 2.05, 0.045, 96]} />
            <meshPhysicalMaterial
              ref={matRef}
              map={map}
              color="#ffffff"
              roughness={0.5}
              metalness={0.06}
              clearcoat={0.5}
              clearcoatRoughness={0.35}
              envMapIntensity={0.25}
              transparent
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Show() {
  const turntable = useRef<THREE.Group>(null!);
  const platter = useRef<THREE.Mesh>(null!);
  const arm = useRef<THREE.Group>(null!);
  const keyLight = useRef<THREE.PointLight>(null!);
  const eq = useRef<THREE.InstancedMesh>(null!);
  const glowRing = useRef<THREE.Mesh>(null!);
  const glowPlate = useRef<THREE.Mesh>(null!);
  const sleeve = useRef<THREE.Group>(null!);
  const crate = useRef<THREE.Group>(null!);
  const spines = useRef<(THREE.Mesh | null)[]>([]);

  // the hero record + the four "more like this" clones
  const disc = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const spinG = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const fanRefs = useRef<{ g: THREE.Group | null; m: THREE.MeshPhysicalMaterial | null }[]>(
    [0, 1, 2, 3].map(() => ({ g: null, m: null })),
  );

  const labelMaps = useMemo(() => LABELS.map((l) => vinylTexture(l)), []);
  const greyMap = useMemo(() => vinylTexture(GREY_LABEL), []);
  const sleeveMap = useMemo(() => sleeveTexture(), []);
  const plaqueMap = useMemo(() => plaqueTexture(), []);
  const plateMap = useMemo(() => plateTexture(), []);
  const haloMap = useMemo(() => haloTexture(), []);
  const halo = useRef<THREE.Mesh>(null!);
  const front = useRef<THREE.DirectionalLight>(null!);
  const dummyRef = useRef<THREE.Object3D | null>(null);
  const levelsRef = useRef<Float32Array | null>(null);
  const EQ_N = 48;

  const mouse = useRef({ x: 0, y: 0 });
  const spin = useRef({ vel: 0.012, dragging: false, lastX: 0 });
  const hold = useRef<{ timer?: number; fired: boolean; x: number; y: number }>({ fired: false, x: 0, y: 0 });
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (hold.current.timer !== undefined &&
          Math.abs(e.clientX - hold.current.x) + Math.abs(e.clientY - hold.current.y) > 10) {
        window.clearTimeout(hold.current.timer);
        hold.current.timer = undefined;
      }
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (spin.current.dragging) {
        const dx = e.clientX - spin.current.lastX;
        spin.current.lastX = e.clientX;
        spin.current.vel = Math.max(-0.35, Math.min(0.35, dx * 0.004));
      }
    };
    const up = () => {
      window.clearTimeout(hold.current.timer);
      hold.current.timer = undefined;
      spin.current.dragging = false;
      document.body.removeAttribute("data-grabbing");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const S = useRef({ t: film.t, lastT: film.t, keyColor: PINK.clone(), camX: 0, camY: 0, arm: 0 });
  const born = useRef<number | null>(null);

  useFrame(({ camera, clock, size }) => {
    const s = S.current;
    if (born.current === null) born.current = clock.elapsedTime;
    const age = clock.elapsedTime - born.current;
    // the playhead, smoothed: a jump from the scene list glides through the
    // story instead of teleporting
    s.t = damp(s.t, film.t, 0.14);
    const t = s.t;
    for (const sfx of cuesCrossed(CUES, s.lastT, film.t)) play(sfx);
    s.lastT = film.t;

    // ---- camera: looking down at the deck, or straight at a standing record
    const aspect = size.width / Math.max(1, size.height);
    const wide = aspect > 0.8 && size.width > 640;
    const dv = deckView(t);
    s.camX = damp(s.camX, mouse.current.x * 0.3);
    s.camY = damp(s.camY, -mouse.current.y * 0.18);
    // pulled back a little in the opening, so the whole deck has room around it
    const deckDist = (10.4 / Math.min(1.15, Math.max(0.62, aspect))) * lerp(1, 1.12, 1 - Math.min(1, t));
    const frontDist = 10.2 / Math.min(1.1, Math.max(0.6, aspect));
    // with the app clip beside it, the record steps left of centre
    const shift = wide ? 1.35 * phoneShown(t) : 0;
    camera.position.set(
      lerp(s.camX * 0.5 + shift, s.camX, dv),
      lerp(0.35 + s.camY * 0.5, 3.4 + s.camY, dv),
      lerp(frontDist, deckDist, dv),
    );
    camera.lookAt(lerp(shift, 0, dv), lerp(0.1, -0.45, dv), 0);

    // ---- the deck
    turntable.current.position.y = deckY(t);
    turntable.current.visible = deckY(t) > -8.5;
    const playing = jbState().playing;
    const sp = spin.current;
    if (!sp.dragging) sp.vel = damp(sp.vel, playing ? 0.05 : 0.014, 0.05);
    platter.current.rotation.y += sp.vel;
    s.arm = damp(s.arm, needle(t, age), 0.08);
    arm.current.rotation.y = lerp(0.12, 0.62, s.arm);
    arm.current.rotation.z = lerp(-0.09, 0.02, s.arm);

    // ---- the record
    const p = recordPose(t);
    const d = disc.current!;
    d.position.set(p.x, p.y, p.z);
    d.rotation.set(0, 0, p.roll);
    d.scale.setScalar(p.scale);
    tilt.current!.rotation.x = p.up * (Math.PI / 2 - 0.12);
    spinG.current!.rotation.y += sp.vel;
    const m = mat.current!;
    const wantMap = p.grey > 0.5 ? greyMap : labelMaps[p.label % labelMaps.length];
    if (m.map !== wantMap) {
      m.map = wantMap;
      m.needsUpdate = true;
    }
    m.color.setScalar(lerp(1, 0.55, p.grey));
    m.opacity = p.opacity;
    // standing up, the record faces away from the key light: a front fill and
    // more of the studio reflections make its grooves read instead of a hole
    m.envMapIntensity = lerp(0.25, 0.42, p.up);
    d.visible = p.opacity > 0.01;
    // the glow behind it, in the room's colour
    halo.current.position.set(p.x, p.y, p.z - 0.6);
    halo.current.scale.setScalar(p.scale * 9);
    const hm = halo.current.material as THREE.MeshBasicMaterial;
    hm.opacity = 0.42 * p.up * p.opacity * (1 - p.grey * 0.6);
    front.current.intensity = 0.55 * (1 - dv);

    // ---- "more like this": the fan
    fanRefs.current.forEach((f, k) => {
      if (!f.g || !f.m) return;
      const c = fan(t, k);
      f.g.visible = c.opacity > 0.01;
      f.g.position.set(c.x, 0.15, 0.6 - 0.35 * (k + 1));
      f.g.scale.setScalar(0.78 * Math.pow(0.9, k + 1));
      f.m.opacity = c.opacity;
    });

    // ---- the sleeve
    sleeve.current.position.y = sleeveY(t);
    sleeve.current.visible = sleeveY(t) > -8.5;

    // ---- the archive
    const a = archive(t);
    crate.current.visible = a.opacity > 0.01;
    crate.current.position.y = a.y;
    spines.current.forEach((sp2, k) => {
      if (!sp2) return;
      const inK = Math.min(1, Math.max(0, a.filed - k));
      sp2.position.y = lerp(3.5, 0.95, 1 - Math.pow(1 - inK, 3));
      sp2.visible = inK > 0.001;
      (sp2.material as THREE.MeshStandardMaterial).opacity = a.opacity * inK;
    });

    // ---- light: the gesture's colour, the previewed/picked mood, or pink
    const scene = Math.floor(t);
    const mood = jbState().mood;
    const target =
      scene === 6 && film.preview
        ? new THREE.Color(film.preview)
        : SCENE_LIGHT[scene] ?? (mood ? MOOD_COLOR[mood] : PINK);
    s.keyColor.lerp(target, 0.06);
    keyLight.current.color.copy(s.keyColor);
    keyLight.current.intensity =
      90 + Math.sin(clock.elapsedTime * 2.2) * 14 +
      (playing ? (1 + Math.sin(clock.elapsedTime * 7.3)) * 9 : 0);
    const ringMat = glowRing.current.material as THREE.MeshStandardMaterial;
    ringMat.emissive.copy(s.keyColor);
    ringMat.emissiveIntensity = 0.7 + (playing ? 0.5 : 0);
    const plateMat = glowPlate.current.material as THREE.MeshBasicMaterial;
    plateMat.color.copy(s.keyColor);
    (halo.current.material as THREE.MeshBasicMaterial).color.copy(s.keyColor);

    // ---- the equaliser wall behind the deck: the actual sound while a hook
    // plays (mirrored from the middle, bass at the centre), a slow ripple
    // while it doesn't. It used to be switched off under reduced motion,
    // which left a row of frozen boxes on machines that report it.
    const dummy = (dummyRef.current ??= new THREE.Object3D());
    const bars = eq.current;
    const bins = spectrum();
    const half = EQ_N / 2;
    const levels = bins ? bandLevels(bins, half) : null;
    const lv = (levelsRef.current ??= new Float32Array(EQ_N));
    for (let i = 0; i < EQ_N; i++) {
      const idle = 0.16 + 0.5 * Math.abs(Math.sin(i * 0.45 - clock.elapsedTime * 1.8)) * (0.6 + 0.4 * Math.sin(clock.elapsedTime * 0.7 + i));
      const band = levels ? levels[Math.abs(Math.floor(i - half + (i < half ? 1 : 0)))] ?? 0 : null;
      // squared-ish: loud masters sit near the top on every band, and a
      // straight mapping made one flat wall; this lets the peaks stand out
      const target = band === null ? idle : 0.06 + Math.pow(band, 1.8) * 1.45;
      // rise fast, fall slow, like a meter
      lv[i] = target > lv[i] ? lv[i] + (target - lv[i]) * 0.6 : lv[i] + (target - lv[i]) * 0.12;
      const h = 0.08 + lv[i];
      dummy.position.set((i / (EQ_N - 1) - 0.5) * 6.2, h / 2, -2.7);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      bars.setMatrixAt(i, dummy.matrix);
    }
    bars.instanceMatrix.needsUpdate = true;
    const eqMat = bars.material as THREE.MeshStandardMaterial;
    eqMat.emissive.copy(s.keyColor);
    eqMat.emissiveIntensity = 0.45 * (playing ? 1.6 : 1);
  });

  // click plays a hook, drag spins, hold opens the mood wheel
  const recordEvents = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (hold.current.fired) {
        hold.current.fired = false;
        return;
      }
      if (e.delta < 6) jbToggle();
    },
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      spin.current.dragging = true;
      spin.current.lastX = e.nativeEvent.clientX;
      document.body.setAttribute("data-grabbing", "1");
      const { clientX, clientY } = e.nativeEvent;
      hold.current.fired = false;
      hold.current.x = clientX;
      hold.current.y = clientY;
      window.clearTimeout(hold.current.timer);
      hold.current.timer = window.setTimeout(() => {
        hold.current.timer = undefined;
        hold.current.fired = true;
        spin.current.dragging = false;
        document.body.removeAttribute("data-grabbing");
        window.dispatchEvent(new CustomEvent("hooked:hold-record", { detail: { x: clientX, y: clientY } }));
      }, RECORD_HOLD_MS);
    },
    onPointerOver: () => document.body.setAttribute("data-disc-hover", "1"),
    onPointerOut: () => document.body.removeAttribute("data-disc-hover"),
  };

  const SPINE_COLORS = ["#ff4d8d", "#ffb627", "#4fd1c5", "#8b7cff", "#00e5a0", "#ff6b35", "#5b8def", "#ffd23f", "#e040fb"];

  return (
    <>
      <pointLight ref={keyLight} color="#ff3d71" intensity={90} distance={60} position={[4.5, 5.5, 7]} />
      <directionalLight color="#ffffff" intensity={0.8} position={[-6, 6, 6]} />
      <ambientLight color="#3a3a46" intensity={0.85} />
      {/* fill from the camera's side, for the standing-record scenes */}
      <directionalLight ref={front} color="#ffffff" intensity={0} position={[1.5, 2, 10]} />
      <mesh ref={halo} position={[0, 0, -1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={haloMap} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} color="#f4f2ee" />
        <Lightformer intensity={2.5} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#ff3d71" />
        <Lightformer intensity={1.5} position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#8e8c99" />
      </Environment>

      {/* the turntable — the room the story starts and ends in */}
      <group ref={turntable} position={[0, -0.6, 0]} rotation={[0, -0.35, 0]}>
        <RoundedBox args={[5.6, 0.5, 4.4]} radius={0.12} smoothness={3} position={[0, -0.45, 0]}>
          <meshStandardMaterial color="#15121a" roughness={0.55} metalness={0.25} />
        </RoundedBox>
        <RoundedBox args={[5.7, 0.1, 4.5]} radius={0.05} smoothness={2} position={[0, -0.74, 0]}>
          <meshStandardMaterial color="#0c0a10" roughness={0.8} />
        </RoundedBox>
        <mesh ref={platter} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[2.25, 2.3, 0.18, 96]} />
          <meshStandardMaterial color="#23232c" roughness={0.25} metalness={0.9} />
        </mesh>
        <mesh ref={glowRing} position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.36, 0.022, 8, 80]} />
          <meshStandardMaterial color="#1a1a22" emissive="#ff3d71" emissiveIntensity={0.7} />
        </mesh>
        <mesh ref={glowPlate} position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.6, 48]} />
          <meshBasicMaterial color="#ff3d71" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.3, 16]} />
          <meshStandardMaterial color="#c9c5bd" roughness={0.3} metalness={1} />
        </mesh>
        <mesh position={[-2.2, -0.13, 1.6]}>
          <cylinderGeometry args={[0.16, 0.18, 0.14, 24]} />
          <meshStandardMaterial color="#b9b4ab" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[-1.7, -0.15, 1.7]}>
          <cylinderGeometry args={[0.09, 0.1, 0.1, 20]} />
          <meshStandardMaterial color="#ff3d71" roughness={0.4} emissive="#ff3d71" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[2.45, -0.18, 0.7]}>
          <boxGeometry args={[0.06, 0.03, 0.85]} />
          <meshStandardMaterial color="#0c0a10" roughness={0.6} />
        </mesh>
        <mesh position={[2.45, -0.14, 0.52]}>
          <boxGeometry args={[0.16, 0.06, 0.12]} />
          <meshStandardMaterial color="#cfcac1" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0.3, -0.168, 1.92]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.15, 0.29]} />
          <meshBasicMaterial map={plateMap} transparent />
        </mesh>
        <group ref={arm} position={[2.3, 0.42, -1.55]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.26, 0.5, 24]} />
            <meshStandardMaterial color="#2a2a33" roughness={0.35} metalness={0.85} />
          </mesh>
          <mesh position={[-1.1, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.05, 2.2, 12]} />
            <meshStandardMaterial color="#cfcac1" roughness={0.25} metalness={1} />
          </mesh>
          <mesh position={[-2.2, 0.04, 0]}>
            <boxGeometry args={[0.42, 0.14, 0.16]} />
            <meshStandardMaterial color="#ff3d71" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[-2.3, -0.07, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.03, 0.1, 8]} />
            <meshStandardMaterial color="#e8e4dc" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0.5, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.3, 20]} />
            <meshStandardMaterial color="#9c97a4" roughness={0.3} metalness={1} />
          </mesh>
        </group>
        <instancedMesh ref={eq} args={[undefined, undefined, EQ_N]} position={[0, -0.2, 0]}>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color="#1a1a22" emissive="#ff3d71" emissiveIntensity={0.5} transparent />
        </instancedMesh>
      </group>

      {/* the sleeve that "down" slides the record into */}
      <group ref={sleeve} position={[0, -9, 1.0]} scale={0.78}>
        <mesh>
          <boxGeometry args={[4.4, 4.4, 0.08]} />
          <meshStandardMaterial map={sleeveMap} roughness={0.65} />
        </mesh>
      </group>

      {/* the taste archive: sleeves filing into a crate, spines out */}
      <group ref={crate} position={[0, -6, 0]}>
        {SPINE_COLORS.slice(0, ARCHIVE_SLEEVES).map((c, k) => (
          <mesh
            key={k}
            ref={(el) => {
              spines.current[k] = el;
            }}
            position={[(k - (ARCHIVE_SLEEVES - 1) / 2) * 0.3, 0.95, 0]}
            rotation={[0, 0, (k % 3 === 1 ? 1 : -1) * 0.03]}
          >
            <boxGeometry args={[0.2, 1.9 - (k % 4) * 0.07, 1.8]} />
            <meshStandardMaterial color={c} roughness={0.55} emissive={c} emissiveIntensity={0.18} transparent />
          </mesh>
        ))}
        {/* the crate: a low open box and its label */}
        <RoundedBox args={[3.5, 0.9, 2.1]} radius={0.06} smoothness={2} position={[0, 0.3, 0]}>
          <meshStandardMaterial color="#1c1822" roughness={0.7} transparent opacity={0.96} />
        </RoundedBox>
        <mesh position={[0, 0.3, 1.06]}>
          <planeGeometry args={[3.2, 0.5]} />
          <meshBasicMaterial map={plaqueMap} />
        </mesh>
      </group>

      {/* the record */}
      <Disc
        map={labelMaps[0]}
        discRef={disc}
        spinRef={spinG}
        tiltRef={tilt}
        matRef={mat}
        events={recordEvents}
      />
      {/* four like it, for "more like this" */}
      {[0, 1, 2, 3].map((k) => (
        <group
          key={k}
          ref={(el) => {
            fanRefs.current[k].g = el;
          }}
          visible={false}
        >
          <group rotation={[Math.PI / 2 - 0.12, 0, 0]}>
            <mesh rotation={[0, k * 0.9, 0]}>
              <cylinderGeometry args={[2.05, 2.05, 0.045, 64]} />
              <meshPhysicalMaterial
                ref={(el) => {
                  fanRefs.current[k].m = el;
                }}
                map={labelMaps[k % 2 === 0 ? 2 : 0]}
                roughness={0.5}
                metalness={0.06}
                clearcoat={0.4}
                clearcoatRoughness={0.4}
                envMapIntensity={0.35}
                transparent
                opacity={0}
              />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

export default function Stage() {
  const [eventSource] = useState<HTMLElement | undefined>(() =>
    typeof document !== "undefined" ? document.body : undefined,
  );
  const wrap = useRef<HTMLDivElement>(null);
  // draw only while the stage is on screen
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="stage-canvas" ref={wrap}>
      <Canvas
        camera={{ fov: 34, position: [0, 3.1, 9.4] }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        eventSource={eventSource}
        onCreated={(state) => {
          // the live stage is up: the poster standing in for it can go
          requestAnimationFrame(() => document.documentElement.setAttribute("data-stage", "live"));
          // pointer position relative to this canvas, wherever it sits
          state.setEvents({
            compute: (event, st) => {
              const r = st.gl.domElement.getBoundingClientRect();
              st.pointer.set(
                ((event.clientX - r.left) / r.width) * 2 - 1,
                -((event.clientY - r.top) / r.height) * 2 + 1,
              );
              st.raycaster.setFromCamera(st.pointer, st.camera);
            },
          });
        }}
      >
        <fog attach="fog" args={["#08080c", 16, 30]} />
        <Show />
      </Canvas>
    </div>
  );
}
