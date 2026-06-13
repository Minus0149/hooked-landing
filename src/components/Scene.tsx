"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { getState as jbState, toggle as jbToggle } from "@/lib/jukebox";

const PINK = new THREE.Color("#ff3d71");
const SAVE = new THREE.Color("#00e5a0");
const GESTURE = [new THREE.Color("#ffffff"), SAVE, new THREE.Color("#ffb627"), new THREE.Color("#ff5252")];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const damp = (cur: number, target: number, f = 0.07) => cur + (target - cur) * f;

/* ---------- textures: one canvas = hundreds of grooves = ONE draw call ---------- */
function vinylTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d")!;
  x.fillStyle = "#07070a";
  x.beginPath(); x.arc(512, 512, 512, 0, 7); x.fill();
  // grooves: many thin rings with subtle sheen variance
  for (let r = 190; r < 500; r += 2.6) {
    const sheen = 0.035 + 0.045 * Math.abs(Math.sin(r * 0.12));
    x.strokeStyle = `rgba(255,255,255,${sheen.toFixed(3)})`;
    x.lineWidth = 1.1;
    x.beginPath(); x.arc(512, 512, r, 0, 7); x.stroke();
  }
  // dead wax ring
  x.strokeStyle = "rgba(255,255,255,0.10)"; x.lineWidth = 3;
  x.beginPath(); x.arc(512, 512, 182, 0, 7); x.stroke();
  // label
  const g = x.createRadialGradient(470, 470, 20, 512, 512, 170);
  g.addColorStop(0, "#ff5e88"); g.addColorStop(0.6, "#e62c60"); g.addColorStop(1, "#b81247");
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
  return t;
}
function sleeveTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 1024, 1024);
  g.addColorStop(0, "#2a1320"); g.addColorStop(1, "#100d14");
  x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
  x.strokeStyle = "rgba(255,61,113,.9)"; x.lineWidth = 18; x.strokeRect(22, 22, 980, 980);
  x.strokeStyle = "rgba(255,61,113,.5)"; x.lineWidth = 13;
  x.beginPath(); x.arc(512, 490, 250, 0, 7); x.stroke();
  x.fillStyle = "#f4f2ee"; x.font = "900 96px Unbounded, sans-serif"; x.textAlign = "center";
  x.fillText("hooked.", 512, 930);
  x.fillStyle = "rgba(244,242,238,.45)"; x.font = "600 34px Instrument Sans, sans-serif";
  x.fillText("THE TASTE ARCHIVE — VOL. 1", 512, 120);
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
  return new THREE.CanvasTexture(c);
}

/* ---------- the show ---------- */
function Story() {
  const turntable = useRef<THREE.Group>(null!);
  const vinyl = useRef<THREE.Group>(null!);
  const platter = useRef<THREE.Mesh>(null!);
  const arm = useRef<THREE.Group>(null!);
  const sleeve = useRef<THREE.Group>(null!);
  const keyLight = useRef<THREE.PointLight>(null!);
  const points = useRef<THREE.Points>(null!);
  const eq = useRef<THREE.InstancedMesh>(null!);
  const glowRing = useRef<THREE.Mesh>(null!);
  const glowPlate = useRef<THREE.Mesh>(null!);

  const vinylMap = useMemo(vinylTexture, []);
  const sleeveMap = useMemo(sleeveTexture, []);
  const plateMap = useMemo(plateTexture, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const EQ_N = 48;

  const COUNT = typeof window !== "undefined" && window.innerWidth < 700 ? 1500 : 3200;
  const { fromArr, toArr, cur, colArr } = useMemo(() => {
    const fromArr = new Float32Array(COUNT * 3);
    const toArr = new Float32Array(COUNT * 3);
    const colArr = new Float32Array(COUNT * 3);
    const palette = [
      new THREE.Color("#ff3d71"), new THREE.Color("#ff3d71"), new THREE.Color("#ff7ca1"),
      new THREE.Color("#f4f2ee"), new THREE.Color("#00e5a0"),
    ];
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.7 + Math.sqrt(Math.random()) * 1.3;
      fromArr.set([Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.1], i * 3);
      toArr.set([(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 4.1, (Math.random() - 0.5) * 0.06], i * 3);
      const col = palette[Math.min(palette.length - 1, Math.floor(Math.random() * 5.5))];
      colArr.set([col.r, col.g, col.b], i * 3);
    }
    return { fromArr, toArr, cur: fromArr.slice(), colArr };
  }, [COUNT]);

  const mouse = useRef({ x: 0, y: 0 });
  // drag-to-spin: velocity injected by dragging the record, eased back to base speed
  const spin = useRef({ vel: 0.012, dragging: false, lastX: 0 });
  useMemo(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointermove", (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (spin.current.dragging) {
        const dx = e.clientX - spin.current.lastX;
        spin.current.lastX = e.clientX;
        spin.current.vel = Math.max(-0.35, Math.min(0.35, dx * 0.004));
      }
    });
    window.addEventListener("pointerup", () => {
      spin.current.dragging = false;
      document.body.removeAttribute("data-grabbing");
    });
  }, []);

  const sm = useRef({
    camX: 0, camY: 1.4, camZ: 10.2, lookX: 1.0, lookY: -0.25,
    ttX: 2.9, ttY: -1.6, ttScale: 1, vX: 2.9, vY: -1.39, tilt: 0, vinylScale: 1,
    sleeveY: -9, armDrop: 0, energy: 1, keyColor: PINK.clone(),
    discOp: 1, pointsOp: 0, morph: 0,
  });
  const t0 = useRef<number | null>(null);

  useFrame(({ camera, clock }) => {
    const S = sm.current;
    const vh = window.innerHeight, sy = window.scrollY;
    if (t0.current === null) t0.current = clock.elapsedTime;
    const age = clock.elapsedTime - (t0.current ?? 0);

    const rect = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return { top: 1e9, h: 1 };
      const r = el.getBoundingClientRect();
      return { top: r.top + sy, h: r.height };
    };
    const why = rect("why"), ges = rect("gestures"), rit = rect("ritual"), tra = rect("transform");

    /* Storyboard rule: the 3D object always sits OPPOSITE the copy.
       hero: copy left  / deck right      why: copy right / deck left
       gestures: copy left / record right ritual: copy left / sleeve right
       transform + cta: centered.
       The record travels ONE continuous arc: platter → up-and-over right →
       hover → slide into sleeve → (as particles) drift to center. */
    // stacked composition for anything portrait (phones AND tablets) — on a
    // taller-than-wide screen the side-by-side staging shoves the deck offscreen
    const aspect = window.innerWidth / window.innerHeight;
    const mob = aspect < 1 || window.innerWidth < 700;
    // composition scale: constants are tuned for a 1.6 aspect — widen/narrow with the
    // viewport so the deck/record hold the same SCREEN position on any monitor
    const kx = mob ? 1 : Math.min(1.25, Math.max(0.85, aspect / 1.6));
    // tablet-portrait factor: phone constants assume ~0.46 aspect; iPads are ~0.75
    const mx = mob ? Math.min(1.7, Math.max(1, aspect / 0.462)) : 1;
    const ms = Math.min(1.3, mx); // gentler factor for object scales

    // resting pose (hero)
    let camX = 0, camY = 1.4, camZ = 10.2, lookX = mob ? 0.4 * mx : 1.0 * kx, lookY = -0.25;
    let ttX = mob ? 0.8 * mx : 3.05 * kx, ttY = mob ? -3.8 : -1.6, ttScale = 1;
    let tilt = 0, vinylScale = 1;
    let sleeveY = -9;
    const sleeveX = mob ? 0.45 * mx : 2.2 * kx;
    let energy = 1, discOp = 1, pointsOp = 0, morph = 0;
    let target = PINK;
    // needle drop on load
    let armDrop = clamp01((age - 1.0) / 1.4);

    // WHY: the deck ducks low, crosses UNDER the copy, and re-emerges lower-left
    const pW = clamp01((sy + vh - why.top) / (why.h + vh));
    ttX = lerp(ttX, mob ? 0.5 * mx : -2.3 * kx, pW);
    ttY = lerp(ttY, mob ? -2.7 : -2.0, pW) - Math.sin(pW * Math.PI) * 1.3; // the duck-under
    camX = lerp(0, -0.5, pW); camY = lerp(camY, 1.1, pW); camZ = lerp(10.2, 7.2, pW);
    lookX = lerp(lookX, ttX * 0.6, pW); lookY = lerp(lookY, -1.15, pW);
    energy = lerp(1, 0.15, pW);

    // the record rides the deck until the gestures pry it off
    let vX = ttX, vY = ttY + 0.21;

    // GESTURES: the record arcs up-and-over to stage right while the deck sinks away
    const pGin = clamp01((sy + vh * 0.5 - ges.top) / (vh * 0.9));
    const pG = clamp01((sy - ges.top) / (ges.h - vh));
    if (pGin > 0) {
      const floatX = mob ? 0.55 * mx : 3.1 * kx, floatY = mob ? -1.85 : 0.95;
      vX = lerp(vX, floatX, pGin);
      vY = lerp(vY, floatY, pGin) + Math.sin(pGin * Math.PI) * (mob ? 0.7 : 1.6); // the arc
      tilt = lerp(0, Math.PI / 2 - 0.12, pGin);
      vinylScale = lerp(1, mob ? 0.72 * ms : 0.92, pGin);
      ttY = lerp(ttY, -7, pGin); // the deck bows out below
      camX = lerp(camX, 0, pGin); camY = lerp(camY, 0.45, pGin); camZ = lerp(camZ, 9.4, pGin);
      lookX = lerp(lookX, mob ? 0 : 0.6 * kx, pGin); lookY = lerp(lookY, 0.15, pGin);
      armDrop = lerp(armDrop, 0, pGin); // needle lifts as the record leaves
      energy = lerp(energy, 0.55, pGin);
    }
    if (sy >= ges.top - 1 && pG < 1) target = GESTURE[Math.min(3, Math.floor(pG * 4))];

    // RITUAL: the sleeve rises on the right, the record drifts over and slides home
    const rStart = rit.top - 0.8 * vh;
    const pR = clamp01((sy - rStart) / (rit.h - vh + 0.8 * vh));
    if (pR > 0) {
      vX = lerp(vX, sleeveX, seg(pR, 0, 0.35));
      vY = lerp(vY, mob ? 0.7 : 1.6, seg(pR, 0, 0.35));
      vY = lerp(vY, mob ? -1.2 : -0.4, seg(pR, 0.45, 0.9)); // the slide into the sleeve
      vinylScale = lerp(vinylScale, mob ? 0.5 * ms : 0.8, seg(pR, 0, 0.35));
      sleeveY = lerp(-9, mob ? -1.3 : -0.15, seg(pR, 0.05, 0.5));
      camX = lerp(camX, 0.2, pR); camZ = lerp(camZ, 9.8, pR);
      lookX = lerp(lookX, mob ? 0.3 : 0.8 * kx, pR);
      energy = lerp(energy, 0.3, pR);
      if (pR > 0.3) target = SAVE;
    }

    // TRANSFORM: the sleeve drops away, particles burst → phone
    const tStart = tra.top - 0.9 * vh;
    const tEnd = tra.top + tra.h / 2 - vh / 2;
    const pT = clamp01((sy - tStart) / (tEnd - tStart));
    const pT2 = clamp01((sy - tEnd) / (0.6 * vh));
    if (pT > 0) {
      discOp = pT < 0.22 ? 1 : 0;
      pointsOp = lerp(0, 0.9, seg(pT, 0, 0.25));
      sleeveY = lerp(sleeveY, -10, seg(pT, 0, 0.3));
      morph = seg(pT, 0.15, 0.7);
      camX = lerp(camX, 0, pT); camY = lerp(camY, 0.2, pT); camZ = lerp(camZ, 9, pT);
      lookX = lerp(lookX, 0, pT); lookY = lerp(lookY, 0, pT);
      if (pT > 0.2) target = PINK;
      pointsOp = lerp(pointsOp, 0, pT2);
    }
    // CTA: the turntable returns as a desk-toy in the corner, just above the
    // jukebox dock — small but fully readable, never behind the buttons
    if (pT2 > 0) {
      ttX = lerp(ttX, mob ? 0.9 * mx : 3.0 * kx, pT2);
      ttY = lerp(ttY, mob ? -1.9 : -1.55, pT2);
      ttScale = lerp(ttScale, mob ? 0.34 * ms : 0.45, pT2);
      energy = lerp(energy, 1.15, pT2);
      camY = lerp(camY, 0.35, pT2); lookX = lerp(lookX, 0, pT2);
      if (pT2 > 0.35) {
        discOp = 1; vX = ttX; vY = ttY + 0.21 * ttScale; tilt = 0; vinylScale = ttScale;
        armDrop = clamp01((pT2 - 0.5) * 3);
      }
    }

    if (mob) camZ += 1.6;

    /* smooth everything */
    S.camX = damp(S.camX, camX); S.camY = damp(S.camY, camY); S.camZ = damp(S.camZ, camZ);
    S.lookX = damp(S.lookX, lookX); S.lookY = damp(S.lookY, lookY);
    S.ttX = damp(S.ttX, ttX); S.ttY = damp(S.ttY, ttY);
    S.ttScale = damp(S.ttScale, ttScale);
    S.vX = damp(S.vX, vX, 0.09); S.vY = damp(S.vY, vY, 0.09);
    S.tilt = damp(S.tilt, tilt);
    S.vinylScale = damp(S.vinylScale, vinylScale);
    S.sleeveY = damp(S.sleeveY, sleeveY);
    S.armDrop = damp(S.armDrop, armDrop, 0.06);
    S.energy = damp(S.energy, energy);
    S.discOp = discOp; S.pointsOp = damp(S.pointsOp, pointsOp, 0.12);
    S.morph = damp(S.morph, morph, 0.12);
    S.keyColor.lerp(target, 0.08);

    /* apply */
    camera.position.set(S.camX + mouse.current.x * 0.25, S.camY - mouse.current.y * 0.18, S.camZ);
    camera.lookAt(S.lookX, S.lookY, 0);

    const playing = jbState().playing;
    const tt = turntable.current;
    tt.position.set(S.ttX, S.ttY, 0);
    tt.scale.setScalar(S.ttScale);
    // spin: base speed, faster while a hook plays, overridden by drag
    const sp = spin.current;
    if (!sp.dragging) sp.vel = damp(sp.vel, playing ? 0.05 : 0.012, 0.05);
    platter.current.rotation.y += sp.vel;
    const v = vinyl.current;
    // gentle bob while the record floats free (scaled by how tilted-up it is)
    const floatFrac = S.tilt / (Math.PI / 2 - 0.12);
    v.position.set(S.vX, S.vY + Math.sin(clock.elapsedTime * 1.7) * 0.07 * floatFrac, 0);
    v.scale.setScalar(S.vinylScale);
    v.rotation.y += sp.vel;
    v.rotation.x = S.tilt;
    v.visible = S.discOp > 0.5;
    // tonearm: parked along the edge, swings in and the stylus settles
    arm.current.rotation.y = lerp(0.12, 0.62, S.armDrop);
    arm.current.rotation.z = lerp(-0.09, 0.02, S.armDrop);

    sleeve.current.position.set(sleeveX, S.sleeveY, 0);
    sleeve.current.scale.setScalar(mob ? 0.62 * ms : 1);
    keyLight.current.color.copy(S.keyColor);
    keyLight.current.intensity =
      90 + Math.sin(clock.elapsedTime * 2.2) * 14 * S.energy +
      (playing ? (1 + Math.sin(clock.elapsedTime * 7.3)) * 9 : 0); // pumps with the music

    // platter glow ring + under-deck light wash follow the chapter color;
    // energy² so they vanish completely in quiet chapters instead of lingering
    const e2 = S.energy * S.energy;
    const ringMat = glowRing.current.material as THREE.MeshStandardMaterial;
    ringMat.emissive.copy(S.keyColor);
    ringMat.emissiveIntensity = 0.7 * e2 + (playing ? 0.5 : 0);
    const plateMat = glowPlate.current.material as THREE.MeshBasicMaterial;
    plateMat.color.copy(S.keyColor);
    plateMat.opacity = 0.04 + 0.1 * e2 + (playing ? 0.04 : 0);

    // waveform wall behind the deck — a traveling pulse, fades with chapter energy
    const m = eq.current;
    for (let i = 0; i < EQ_N; i++) {
      const wave = Math.abs(Math.sin(i * 0.45 - clock.elapsedTime * 2.2));
      const h = 0.08 + S.energy * (0.16 + 0.55 * wave);
      dummy.position.set((i / (EQ_N - 1) - 0.5) * 6.2, h / 2, -2.7);
      dummy.scale.set(1, h, 1);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    const eqMat = m.material as THREE.MeshStandardMaterial;
    eqMat.emissive.copy(S.keyColor);
    eqMat.emissiveIntensity = 0.45 * S.energy * (playing ? 1.6 : 1);
    eqMat.opacity = clamp01(S.energy * 1.3 - 0.08);
    m.visible = eqMat.opacity > 0.02;

    const pts = points.current;
    (pts.material as THREE.PointsMaterial).opacity = S.pointsOp;
    pts.visible = S.pointsOp > 0.01;
    if (pts.visible) {
      const pos = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < pos.length; i++) pos[i] = fromArr[i] + (toArr[i] - fromArr[i]) * S.morph;
      (pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      // burst from where the sleeve swallowed the record, settle center-stage
      pts.position.set(lerp(sleeveX, 0, S.morph), lerp(mob ? -1.2 : -0.35, 0.2, S.morph), 0.5);
      pts.rotation.z -= 0.004 * (1 - S.morph);
    }
  });

  return (
    <>
      <pointLight ref={keyLight} color="#ff3d71" intensity={90} distance={60} position={[4.5, 5.5, 7]} />
      <directionalLight color="#ffffff" intensity={0.8} position={[-6, 6, 6]} />
      <ambientLight color="#3a3a46" intensity={0.85} />

      {/* studio reflections without any HDR download */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} color="#f4f2ee" />
        <Lightformer intensity={2.5} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#ff3d71" />
        <Lightformer intensity={1.5} position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#8e8c99" />
      </Environment>

      <group ref={turntable} position={[2.9, -1.6, 0]} rotation={[0, -0.35, 0]}>
        {/* plinth */}
        <RoundedBox args={[5.6, 0.5, 4.4]} radius={0.12} smoothness={3} position={[0, -0.45, 0]}>
          <meshStandardMaterial color="#15121a" roughness={0.55} metalness={0.25} />
        </RoundedBox>
        <RoundedBox args={[5.7, 0.1, 4.5]} radius={0.05} smoothness={2} position={[0, -0.74, 0]}>
          <meshStandardMaterial color="#0c0a10" roughness={0.8} />
        </RoundedBox>
        {/* platter */}
        <mesh ref={platter} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[2.25, 2.3, 0.18, 96]} />
          <meshStandardMaterial color="#23232c" roughness={0.25} metalness={0.9} />
        </mesh>
        {/* glow ring hugging the platter — pulses with the chapter color */}
        <mesh ref={glowRing} position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.36, 0.022, 8, 80]} />
          <meshStandardMaterial color="#1a1a22" emissive="#ff3d71" emissiveIntensity={0.7} />
        </mesh>
        {/* light wash under the deck */}
        <mesh ref={glowPlate} position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[4.4, 48]} />
          <meshBasicMaterial
            color="#ff3d71" transparent opacity={0.12}
            blending={THREE.AdditiveBlending} depthWrite={false}
          />
        </mesh>
        {/* spindle */}
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.3, 16]} />
          <meshStandardMaterial color="#c9c5bd" roughness={0.3} metalness={1} />
        </mesh>
        {/* deck hardware: speed knob, start/stop, pitch slider, brand plate */}
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
        {/* tonearm assembly */}
        <group ref={arm} position={[2.3, 0.42, -1.55]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.26, 0.5, 24]} />
            <meshStandardMaterial color="#2a2a33" roughness={0.35} metalness={0.85} />
          </mesh>
          {/* arm tube lies along local -X; the group's yaw swings it over the record */}
          <mesh position={[-1.1, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.05, 2.2, 12]} />
            <meshStandardMaterial color="#cfcac1" roughness={0.25} metalness={1} />
          </mesh>
          <mesh position={[-2.2, 0.04, 0]}>
            <boxGeometry args={[0.42, 0.14, 0.16]} />
            <meshStandardMaterial color="#ff3d71" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* stylus */}
          <mesh position={[-2.3, -0.07, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.03, 0.1, 8]} />
            <meshStandardMaterial color="#e8e4dc" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* counterweight */}
          <mesh position={[0.5, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.3, 20]} />
            <meshStandardMaterial color="#9c97a4" roughness={0.3} metalness={1} />
          </mesh>
        </group>
        {/* waveform wall: 48 bars, ONE instanced draw call */}
        <instancedMesh ref={eq} args={[undefined, undefined, EQ_N]} position={[0, -0.2, 0]}>
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial color="#1a1a22" emissive="#ff3d71" emissiveIntensity={0.5} transparent />
        </instancedMesh>
      </group>

      {/* the record: world-space so it can leave the deck, ONE textured disc.
          Clickable (play a hook) and draggable (spin it) — events come from
          the body eventSource so the canvas itself stays pointer-events:none */}
      <group ref={vinyl} position={[2.9, -1.39, 0]}>
        <mesh
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta < 6 && !(e.nativeEvent.target as HTMLElement)?.closest?.("a,button")) jbToggle();
          }}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            if ((e.nativeEvent.target as HTMLElement)?.closest?.("a,button")) return;
            spin.current.dragging = true;
            spin.current.lastX = e.nativeEvent.clientX;
            document.body.setAttribute("data-grabbing", "1");
          }}
          onPointerOver={() => document.body.setAttribute("data-disc-hover", "1")}
          onPointerOut={() => document.body.removeAttribute("data-disc-hover")}
        >
          <cylinderGeometry args={[2.05, 2.05, 0.045, 96]} />
          <meshPhysicalMaterial
            map={vinylMap} color="#ffffff"
            roughness={0.5} metalness={0.06}
            clearcoat={0.5} clearcoatRoughness={0.35}
            envMapIntensity={0.25}
          />
        </mesh>
      </group>

      {/* the sleeve, waiting below stage right */}
      <group ref={sleeve} position={[2.2, -9, 0]} rotation={[0, 0, -0.045]}>
        <mesh position-z={0.24}>
          <boxGeometry args={[4.6, 4.6, 0.07]} />
          <meshStandardMaterial map={sleeveMap} roughness={0.65} />
        </mesh>
        <mesh position-z={-0.24}>
          <boxGeometry args={[4.6, 4.6, 0.07]} />
          <meshStandardMaterial color="#15121a" roughness={0.8} />
        </mesh>
        <mesh position-y={-2.3}>
          <boxGeometry args={[4.6, 0.12, 0.55]} />
          <meshStandardMaterial color="#15121a" roughness={0.8} />
        </mesh>
      </group>

      <points ref={points} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cur, 3]} />
          <bufferAttribute attach="attributes-color" args={[colArr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff" vertexColors size={0.035} transparent opacity={0}
          blending={THREE.AdditiveBlending} depthWrite={false}
        />
      </points>
    </>
  );
}

export default function Scene() {
  // pointer events ride on <body> so the fixed canvas can stay pointer-events:none
  // (DOM stays clickable; the record still raycasts for click/drag)
  const [eventSource] = useState<HTMLElement | undefined>(() =>
    typeof document !== "undefined" ? document.body : undefined,
  );
  return (
    <div className="scene-wrap">
      <Canvas
        camera={{ fov: 36, position: [0, 1.4, 10.2] }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.75]}
        eventSource={eventSource}
        eventPrefix="client"
      >
        <fog attach="fog" args={["#08080c", 16, 30]} />
        <Story />
      </Canvas>
    </div>
  );
}
