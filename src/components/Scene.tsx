"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { getState as jbState, toggle as jbToggle } from "@/lib/jukebox";
import { MOODS, type MoodId } from "@/data/moods";

const PINK = new THREE.Color("#ff3d71");
// the deck light takes the colour of the face last picked
const MOOD_COLOR = Object.fromEntries(MOODS.map((m) => [m.id, new THREE.Color(m.accent)])) as Record<
  MoodId,
  THREE.Color
>;
/** hold the record this long (without dragging it) and the mood ring opens */
const RECORD_HOLD_MS = 420;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
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

/* ---------- the show ----------
   The turntable lives in the hero only, in its own box. It used to be a
   full-screen fixed canvas choreographed across every chapter — the record
   flew over the copy, the sleeve rose behind the ritual text — and on real
   screens it kept landing on top of the words. Framed inside one element it
   can't overlap anything, and it stops drawing once that element scrolls away. */
function Story() {
  const turntable = useRef<THREE.Group>(null!);
  const vinyl = useRef<THREE.Group>(null!);
  const platter = useRef<THREE.Mesh>(null!);
  const arm = useRef<THREE.Group>(null!);
  const keyLight = useRef<THREE.PointLight>(null!);
  const eq = useRef<THREE.InstancedMesh>(null!);
  const glowRing = useRef<THREE.Mesh>(null!);
  const glowPlate = useRef<THREE.Mesh>(null!);

  const vinylMap = useMemo(() => vinylTexture(), []);
  const plateMap = useMemo(() => plateTexture(), []);
  // scratch object for the EQ bars' matrices — mutated every frame, so it
  // lives in a ref, not in render state
  const dummyRef = useRef<THREE.Object3D | null>(null);
  const EQ_N = 48;

  const mouse = useRef({ x: 0, y: 0 });
  // drag-to-spin: velocity injected by dragging the record, eased back to base speed
  const spin = useRef({ vel: 0.012, dragging: false, lastX: 0 });
  // hold-for-a-mood: a press that doesn't move opens the ring; one that moves
  // is a spin. `fired` swallows the click that follows the hold's release.
  const hold = useRef<{ timer?: number; fired: boolean; x: number; y: number }>({
    fired: false, x: 0, y: 0,
  });
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

  const sm = useRef({ armDrop: 0, keyColor: PINK.clone(), camX: 0, camY: 0 });
  const t0 = useRef<number | null>(null);

  useFrame(({ camera, clock, size }) => {
    const S = sm.current;
    if (t0.current === null) t0.current = clock.elapsedTime;
    const age = clock.elapsedTime - t0.current;

    // needle drops once, a beat after the deck appears
    S.armDrop = damp(S.armDrop, clamp01((age - 0.6) / 1.2), 0.06);
    // the light takes the colour of the last mood picked anywhere on the page
    const picked = jbState().mood;
    S.keyColor.lerp(picked ? MOOD_COLOR[picked] : PINK, 0.06);
    // a little parallax, so the deck feels like an object in the room
    S.camX = damp(S.camX, mouse.current.x * 0.35);
    S.camY = damp(S.camY, -mouse.current.y * 0.22);
    // frame the whole deck in whatever box it's given: narrow boxes pull the
    // camera back instead of cropping the plinth into a hard rectangle. On a
    // wide stage the deck sits right of centre, clear of the phone beside it.
    const aspect = size.width / Math.max(1, size.height);
    const dist = 10.4 / Math.min(1.15, Math.max(0.62, aspect));
    const shift = aspect > 0.75 && size.width > 520 ? -0.6 : 0;
    camera.position.set(S.camX + shift, 3.4 + S.camY, dist);
    camera.lookAt(shift, -0.45, 0);

    const playing = jbState().playing;
    const sp = spin.current;
    if (!sp.dragging) sp.vel = damp(sp.vel, playing ? 0.05 : 0.012, 0.05);
    platter.current.rotation.y += sp.vel;
    vinyl.current.rotation.y += sp.vel;
    // tonearm: parked along the edge, swings in and the stylus settles
    arm.current.rotation.y = lerp(0.12, 0.62, S.armDrop);
    arm.current.rotation.z = lerp(-0.09, 0.02, S.armDrop);

    keyLight.current.color.copy(S.keyColor);
    keyLight.current.intensity =
      90 + Math.sin(clock.elapsedTime * 2.2) * 14 +
      (playing ? (1 + Math.sin(clock.elapsedTime * 7.3)) * 9 : 0); // pumps with the music

    const ringMat = glowRing.current.material as THREE.MeshStandardMaterial;
    ringMat.emissive.copy(S.keyColor);
    ringMat.emissiveIntensity = 0.7 + (playing ? 0.5 : 0);
    const plateMat = glowPlate.current.material as THREE.MeshBasicMaterial;
    plateMat.color.copy(S.keyColor);
    plateMat.opacity = 0.14 + (playing ? 0.04 : 0);

    // waveform wall behind the deck — a traveling pulse
    const dummy = (dummyRef.current ??= new THREE.Object3D());
    const m = eq.current;
    for (let i = 0; i < EQ_N; i++) {
      const wave = Math.abs(Math.sin(i * 0.45 - clock.elapsedTime * 2.2));
      const h = 0.08 + (playing ? 1.25 : 1) * (0.16 + 0.55 * wave);
      dummy.position.set((i / (EQ_N - 1) - 0.5) * 6.2, h / 2, -2.7);
      dummy.scale.set(1, h, 1);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    const eqMat = m.material as THREE.MeshStandardMaterial;
    eqMat.emissive.copy(S.keyColor);
    eqMat.emissiveIntensity = 0.45 * (playing ? 1.6 : 1);
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

      <group ref={turntable} position={[0, -0.6, 0]} rotation={[0, -0.35, 0]}>
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
          <circleGeometry args={[3.6, 48]} />
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
      <group ref={vinyl} position={[0, -0.39, 0]}>
        <mesh
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (hold.current.fired) {
              hold.current.fired = false; // the hold opened the ring; this is its release
              return;
            }
            if (e.delta < 6 && !(e.nativeEvent.target as HTMLElement)?.closest?.("a,button")) jbToggle();
          }}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            if ((e.nativeEvent.target as HTMLElement)?.closest?.("a,button")) return;
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
              spin.current.dragging = false; // from here the finger aims, it doesn't spin
              document.body.removeAttribute("data-grabbing");
              window.dispatchEvent(
                new CustomEvent("hooked:hold-record", { detail: { x: clientX, y: clientY } }),
              );
            }, RECORD_HOLD_MS);
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

    </>
  );
}

export default function Scene() {
  // pointer events ride on <body> so the canvas can stay pointer-events:none
  // (the copy stays clickable; the record still raycasts for click/drag/hold)
  const [eventSource] = useState<HTMLElement | undefined>(() =>
    typeof document !== "undefined" ? document.body : undefined,
  );
  const wrap = useRef<HTMLDivElement>(null);
  // draw only while the stage is on screen — nothing to animate past the hero
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="scene-wrap" ref={wrap}>
      <Canvas
        camera={{ fov: 34, position: [0, 3.1, 9.4] }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        eventSource={eventSource}
        onCreated={(state) => {
          // pointer position relative to THIS canvas: it scrolls with the
          // page now, so client coordinates alone would miss the record
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
        <Story />
      </Canvas>
    </div>
  );
}
