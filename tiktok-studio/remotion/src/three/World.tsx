// 3D-POV-Welt im Comic-Look (Toon-Shading + schwarze Konturen), gerendert mit @remotion/three.
// Szenen: Klassenzimmer, Flur, Treppenhaus – mit Rauch, Alarmlicht und Kopfkamera (Ich-Perspektive).
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type V3 = [number, number, number];

// 3-stufiger Verlauf → typischer Cartoon-Look
const gradient = (() => {
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

const outlineMat = new THREE.MeshBasicMaterial({ color: "#14110f", side: THREE.BackSide });
const matCache = new Map<string, THREE.Material>();
const toon = (color: string, emissive?: string) => {
  const k = color + (emissive ?? "");
  if (!matCache.has(k)) {
    matCache.set(k, new THREE.MeshToonMaterial({ color, gradientMap: gradient, emissive: emissive ?? "#000000", emissiveIntensity: emissive ? 1 : 0 }));
  }
  return matCache.get(k)!;
};

// Box mit Kontur (inverted hull)
export const TBox: React.FC<{ p: V3; s: V3; c: string; r?: V3; e?: string; line?: number; noLine?: boolean }> = ({ p, s, c, r, e, line = 0.025, noLine }) => (
  <group position={p} rotation={r ?? [0, 0, 0]}>
    <mesh material={toon(c, e)}><boxGeometry args={s} /></mesh>
    {!noLine && <mesh material={outlineMat}><boxGeometry args={[s[0] + line * 2, s[1] + line * 2, s[2] + line * 2]} /></mesh>}
  </group>
);
const TSphere: React.FC<{ p: V3; r: number; c: string; sc?: V3 }> = ({ p, r, c, sc }) => (
  <group position={p} scale={sc ?? [1, 1, 1]}>
    <mesh material={toon(c)}><sphereGeometry args={[r, 20, 14]} /></mesh>
    <mesh material={outlineMat}><sphereGeometry args={[r * 1.07, 20, 14]} /></mesh>
  </group>
);

const SKIN = ["#f1c7a5", "#d9a37e", "#a86f4c", "#7a4a2e", "#f5d3b8"];
const HAIR = ["#2b1d14", "#5b3a1e", "#d9b26a", "#111111", "#8a3b1c", "#3d2b1f"];
const SHIRT = ["#e8b33a", "#c0392b", "#3a7bd5", "#6aa84f", "#8e44ad", "#e67e22", "#2c3e50", "#d35480", "#1abc9c"];

// Figur (sitzend oder stehend). look = Kopfdrehung zur Seite (rad), t = Zeit für Atmen/Zappeln
export const Person: React.FC<{ p: V3; ry?: number; seed: number; seated?: boolean; look?: number; t: number; scared?: number; run?: number }> = ({ p, ry = 0, seed, seated, look = 0, t, scared = 0, run = 0 }) => {
  const skin = SKIN[seed % SKIN.length], hair = HAIR[(seed * 7) % HAIR.length], shirt = SHIRT[(seed * 5) % SHIRT.length];
  const pants = seed % 2 ? "#2f3b52" : "#3b3b3b";
  const breathe = Math.sin(t * 2 + seed) * 0.01;
  const fidget = Math.sin(t * (1.3 + (seed % 5) * 0.2) + seed) * 0.08 * (1 + scared * 2);
  const stride = run ? Math.sin(t * 9 + seed) * 0.6 : 0;
  const y0 = seated ? 0.45 : 0.8;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {/* Beine */}
      {seated ? (
        <>
          <TBox p={[-0.1, 0.45, -0.18]} s={[0.15, 0.13, 0.42]} c={pants} />
          <TBox p={[0.1, 0.45, -0.18]} s={[0.15, 0.13, 0.42]} c={pants} />
          <TBox p={[-0.1, 0.22, -0.38]} s={[0.14, 0.45, 0.14]} c={pants} />
          <TBox p={[0.1, 0.22, -0.38]} s={[0.14, 0.45, 0.14]} c={pants} />
        </>
      ) : (
        <>
          <TBox p={[-0.1, 0.42, 0]} s={[0.15, 0.82, 0.16]} c={pants} r={[stride, 0, 0]} />
          <TBox p={[0.1, 0.42, 0]} s={[0.15, 0.82, 0.16]} c={pants} r={[-stride, 0, 0]} />
        </>
      )}
      {/* Oberkörper */}
      <group position={[0, y0 + 0.32 + breathe, 0]} rotation={[run ? -0.25 : 0, 0, 0]}>
        <TBox p={[0, 0, 0]} s={[0.42, 0.6, 0.24]} c={shirt} />
        <TBox p={[-0.27, -0.02, seated ? -0.12 : 0]} s={[0.11, 0.52, 0.12]} c={shirt} r={[seated ? 0.6 + fidget : stride * 0.8, 0, 0.05]} />
        <TBox p={[0.27, -0.02, seated ? -0.12 : 0]} s={[0.11, 0.52, 0.12]} c={shirt} r={[seated ? 0.6 - fidget : -stride * 0.8, 0, -0.05]} />
        {/* Kopf */}
        <group position={[0, 0.48, 0]} rotation={[0, look + fidget * 0.5, 0]}>
          <TSphere p={[0, 0, 0]} r={0.19} c={skin} sc={[1, 1.12, 1]} />
          <TSphere p={[0, 0.07, 0.02]} r={0.195} c={hair} sc={[1.04, 0.85, 1.05]} />
          <mesh position={[-0.065, 0.0, -0.18]} material={toon("#111")}><sphereGeometry args={[0.022 + scared * 0.01, 8, 8]} /></mesh>
          <mesh position={[0.065, 0.0, -0.18]} material={toon("#111")}><sphereGeometry args={[0.022 + scared * 0.01, 8, 8]} /></mesh>
        </group>
      </group>
    </group>
  );
};

const Desk: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <TBox p={[0, 0.74, 0]} s={[1.1, 0.05, 0.6]} c="#e3c99a" />
    {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
      <TBox key={i} p={[x, 0.37, z]} s={[0.04, 0.74, 0.04]} c="#555b66" line={0.012} />
    ))}
    <TBox p={[0.15, 0.775, 0.05]} s={[0.3, 0.01, 0.4]} c="#ffffff" line={0.008} r={[0, 0.15, 0]} />
  </group>
);
const Chair: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <TBox p={[0, 0.45, 0]} s={[0.45, 0.05, 0.42]} c="#24345a" />
    <TBox p={[0, 0.75, 0.2]} s={[0.45, 0.45, 0.04]} c="#24345a" />
    {[[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].map(([x, z], i) => (
      <TBox key={i} p={[x, 0.22, z]} s={[0.035, 0.45, 0.035]} c="#555b66" line={0.01} />
    ))}
  </group>
);

// Rauch: halbtransparente Kugelwolken, die mit der Zeit wachsen
const Smoke: React.FC<{ t: number; amount: number; area: [number, number, number, number]; y?: number; seed?: number }> = ({ t, amount, area, y = 2.4, seed = 1 }) => {
  const puffs = useMemo(() => {
    const r = mulberry(seed);
    return Array.from({ length: 40 }, () => [area[0] + r() * (area[1] - area[0]), area[2] + r() * (area[3] - area[2]), r(), r()]);
  }, [area, seed]);
  if (amount <= 0) return null;
  return (
    <group>
      {puffs.map(([x, z, a, b], i) => {
        const s = (0.5 + a * 0.9) * (0.4 + amount);
        return (
          <mesh key={i} position={[x + Math.sin(t * 0.3 + i) * 0.3, y - b * 0.8 * amount + Math.sin(t * 0.5 + i) * 0.05, z]}>
            <sphereGeometry args={[s, 12, 10]} />
            <meshBasicMaterial color={b > 0.5 ? "#8d8f94" : "#6b6d72"} transparent opacity={0.22 + 0.25 * amount} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

function mulberry(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Kopfkamera: Position + Blickrichtung + Wackeln beim Gehen
const HeadCam: React.FC<{ pos: V3; yaw: number; pitch: number; t: number; walk: number; shake: number; fov: number }> = ({ pos, yaw, pitch, t, walk, shake, fov }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const bob = walk ? Math.abs(Math.sin(t * 5.2)) * 0.06 : Math.sin(t * 1.4) * 0.008;
  const sway = walk ? Math.sin(t * 2.6) * 0.035 : 0;
  const r = mulberry(Math.floor(t * 30) + 3);
  const sx = (r() - 0.5) * shake, sy = (r() - 0.5) * shake;
  cam.fov = fov;
  cam.near = 0.05;
  cam.far = 80;
  cam.position.set(pos[0] + sway, pos[1] + bob, pos[2]);
  cam.rotation.order = "YXZ";
  cam.rotation.set(pitch + sy * 0.05, yaw + sx * 0.05, sway * 0.4);
  cam.updateProjectionMatrix();
  return null;
};

export type Scene3D = {
  room: "classroom" | "hallway" | "stairs";
  smoke?: [number, number]; // Rauchmenge von → bis (0..1)
  alarm?: boolean;
  dark?: boolean;
  cam: { pos: V3; yaw: [number, number]; pitch?: number; walk?: number; move?: V3 };
  scared?: number; // Mitschüler werden unruhig / drehen sich um
  look?: number; // Köpfe der Mitschüler drehen sich (rad)
  run?: boolean; // Mitschüler laufen weg (Flur)
  fov?: number;
};

const Classroom: React.FC<{ t: number; sc: Scene3D; k: number }> = ({ t, sc, k }) => {
  const desks: V3[] = [];
  for (const z of [-3.6, -2.2, -0.8, 0.6]) for (const x of [-3, -1, 1, 3]) desks.push([x, 0, z]);
  const lookAt = sc.look ?? 0;
  return (
    <group>
      {/* Boden, Decke, Wände */}
      <TBox p={[0, -0.05, -1.5]} s={[10, 0.1, 10]} c="#d8d4c8" noLine />
      {Array.from({ length: 11 }, (_, i) => <TBox key={`gx${i}`} p={[-5 + i, 0.002, -1.5]} s={[0.02, 0.005, 10]} c="#b9b4a6" noLine />)}
      {Array.from({ length: 11 }, (_, i) => <TBox key={`gz${i}`} p={[0, 0.002, -6.5 + i]} s={[10, 0.005, 0.02]} c="#b9b4a6" noLine />)}
      <TBox p={[0, 3.05, -1.5]} s={[10, 0.1, 10]} c="#ecebe6" noLine />
      {[[-2.5, -4], [2.5, -4], [-2.5, -1], [2.5, -1], [-2.5, 2], [2.5, 2]].map(([x, z], i) => (
        <TBox key={`l${i}`} p={[x, 2.98, z]} s={[1.6, 0.04, 0.6]} c="#ffffff" e={sc.dark ? undefined : "#fffdf0"} />
      ))}
      <TBox p={[0, 1.5, -6.05]} s={[10, 3.2, 0.1]} c="#efe6d2" />
      <TBox p={[0, 1.5, 3.55]} s={[10, 3.2, 0.1]} c="#efe6d2" />
      <TBox p={[5.05, 1.5, -1.25]} s={[0.1, 3.2, 9.6]} c="#e9dfc8" />
      <TBox p={[-5.05, 1.5, -1.25]} s={[0.1, 3.2, 9.6]} c="#e9dfc8" />
      <TBox p={[0, 0.06, -6]} s={[10, 0.12, 0.05]} c="#9a8f7a" />
      {/* Tafel + Text-Linien */}
      <TBox p={[0, 1.65, -5.97]} s={[4.2, 1.4, 0.05]} c="#f8f8f4" />
      {[0, 1, 2, 3].map((i) => <TBox key={`tx${i}`} p={[-0.9 + (i % 2) * 0.4, 2.05 - i * 0.25, -5.93]} s={[1.8 - i * 0.3, 0.05, 0.01]} c="#3a5ba0" noLine />)}
      <TBox p={[1.3, 1.9, -5.93]} s={[1.1, 0.06, 0.01]} c="#c0392b" noLine />
      {/* Uhr, Lautsprecher, Flagge */}
      <TSphere p={[3.2, 2.6, -5.95]} r={0.22} c="#ffffff" sc={[1, 1, 0.15]} />
      <TBox p={[3.2, 2.62, -5.9]} s={[0.02, 0.15, 0.01]} c="#111" noLine r={[0, 0, t * 0.2]} />
      {/* Fenster links */}
      {[-4.2, -2.4, -0.6, 1.2].map((z, i) => (
        <group key={`w${i}`}>
          <TBox p={[-5.0, 1.8, z]} s={[0.05, 1.5, 1.4]} c="#9fd3f5" e={sc.dark ? "#2a3e55" : "#9fd3f5"} />
          <TBox p={[-4.98, 1.8, z]} s={[0.05, 1.5, 0.06]} c="#f2f2f2" />
          <TBox p={[-4.98, 1.8, z]} s={[0.05, 0.06, 1.4]} c="#f2f2f2" />
        </group>
      ))}
      {/* Tür rechts vorne + Notausgang-Schild */}
      <TBox p={[4.98, 1.05, -4.6]} s={[0.06, 2.1, 1.0]} c="#7a5230" />
      <TBox p={[4.95, 1.05, -4.25]} s={[0.04, 0.06, 0.12]} c="#c9c9c9" />
      <TBox p={[4.97, 1.65, -4.85]} s={[0.04, 0.5, 0.3]} c="#cfe8ff" e="#9cc8ee" />
      <TBox p={[4.97, 2.4, -4.6]} s={[0.05, 0.18, 0.5]} c="#2ecc71" e="#2ecc71" />
      {/* Pinnwand + Poster rechts */}
      <TBox p={[4.98, 1.7, -1.6]} s={[0.04, 1.2, 2.2]} c="#b5651d" />
      {[["#f6d365", -2.2], ["#a1c4fd", -1.5], ["#fda085", -0.9]].map(([c, z], i) => (
        <TBox key={`p${i}`} p={[4.95, 1.75 + (i % 2) * 0.1, z as number]} s={[0.02, 0.6, 0.5]} c={c as string} r={[0.05 * (i - 1), 0, 0]} />
      ))}
      {/* Alarm-Leuchte */}
      {sc.alarm && <TBox p={[4.95, 2.75, -3.2]} s={[0.08, 0.18, 0.18]} c="#ff2a2a" e={Math.sin(t * 9) > 0 ? "#ff2a2a" : "#550000"} />}
      {/* Tische, Stühle, Mitschüler */}
      {desks.map((d, i) => {
        const me = d[0] === 1 && (d[2] === 0.6 || d[2] === -0.8);
        return (
          <group key={`d${i}`}>
            <Desk p={d} />
            <Chair p={[d[0], 0, d[2] + 0.6]} />
            {!me && i % 5 !== 3 && (
              <Person p={[d[0], 0, d[2] + 0.62]} seed={i + 2} seated t={t}
                look={lookAt * (0.6 + ((i * 13) % 7) / 10) * Math.min(1, k * 3)} scared={sc.scared ?? 0} />
            )}
          </group>
        );
      })}
      {/* Lehrerin an der Tafel */}
      <Person p={[-1.6, 0, -5.1]} ry={Math.PI + (sc.scared ? -0.9 : 0.2)} seed={11} t={t} scared={sc.scared ?? 0} />
      <Smoke t={t} amount={lerp(sc.smoke?.[0] ?? 0, sc.smoke?.[1] ?? 0, k)} area={[2.5, 4.9, -5.5, -3.5]} y={2.7} seed={4} />
    </group>
  );
};

const Hallway: React.FC<{ t: number; sc: Scene3D; k: number }> = ({ t, sc, k }) => {
  const len = 34;
  return (
    <group>
      <TBox p={[0, -0.05, -len / 2]} s={[3.6, 0.1, len]} c="#cfc9b8" noLine />
      {Array.from({ length: 34 }, (_, i) => <TBox key={`f${i}`} p={[0, 0.002, -i]} s={[3.6, 0.005, 0.03]} c="#aea793" noLine />)}
      <TBox p={[0, 3.05, -len / 2]} s={[3.6, 0.1, len]} c="#e8e6df" noLine />
      <TBox p={[1.85, 1.5, -len / 2]} s={[0.1, 3.2, len]} c="#e6dcc4" />
      <TBox p={[-1.85, 1.5, -len / 2]} s={[0.1, 3.2, len]} c="#e6dcc4" />
      <TBox p={[0, 1.5, -len]} s={[3.6, 3.2, 0.1]} c="#e6dcc4" />
      {/* Spinde */}
      {Array.from({ length: 26 }, (_, i) => (
        <group key={`lk${i}`}>
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <TBox p={[sd * 1.65, 0.95, -2 - i * 0.62]} s={[0.35, 1.8, 0.58]} c={i % 7 === 3 ? "#c0392b" : "#3d6fb6"} />
              <TBox p={[sd * 1.46, 1.55, -2 - i * 0.62]} s={[0.02, 0.25, 0.3]} c="#2a4f86" noLine />
            </group>
          ))}
        </group>
      ))}
      {/* Deckenlampen */}
      {Array.from({ length: 9 }, (_, i) => <TBox key={`cl${i}`} p={[0, 2.98, -2 - i * 3.6]} s={[0.6, 0.04, 1.4]} c="#fff" e={sc.dark ? undefined : "#fffbea"} />)}
      {/* Notausgang am Ende */}
      <TBox p={[0, 1.1, -len + 0.08]} s={[1.6, 2.2, 0.06]} c="#6e7b86" />
      <TBox p={[0, 2.5, -len + 0.1]} s={[0.9, 0.3, 0.05]} c="#2ecc71" e="#2ecc71" />
      {/* Alarmleuchten */}
      {sc.alarm && Array.from({ length: 5 }, (_, i) => (
        <TBox key={`al${i}`} p={[1.78, 2.6, -4 - i * 6]} s={[0.08, 0.2, 0.2]} c="#ff2a2a" e={Math.sin(t * 9 + i) > 0 ? "#ff2a2a" : "#550000"} />
      ))}
      {/* Mitschüler laufen voraus */}
      {sc.run && [0, 1, 2, 3, 4].map((i) => (
        <Person key={`r${i}`} p={[-0.9 + (i % 3) * 0.8, 0, -5 - i * 1.6 - t * 2.4]} ry={Math.PI} seed={20 + i} t={t} run={1} />
      ))}
      <Smoke t={t} amount={lerp(sc.smoke?.[0] ?? 0, sc.smoke?.[1] ?? 0, k)} area={[-1.6, 1.6, -len + 2, -4]} y={2.6} seed={9} />
    </group>
  );
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));

export const World3D: React.FC<{ sc: Scene3D; t: number; dur: number; width: number; height: number; shake?: number }> = ({ sc, t, dur, width, height, shake = 0 }) => {
  const k = dur > 0 ? t / dur : 0;
  const yaw = lerp(sc.cam.yaw[0], sc.cam.yaw[1], easeInOut(k));
  const move = sc.cam.move ?? [0, 0, 0];
  const pos: V3 = [sc.cam.pos[0] + move[0] * k, sc.cam.pos[1] + move[1] * k, sc.cam.pos[2] + move[2] * k];
  const smokeAmt = lerp(sc.smoke?.[0] ?? 0, sc.smoke?.[1] ?? 0, k);
  const alarmPulse = sc.alarm ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0;
  return (
    <ThreeCanvas width={width} height={height} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }}>
      <color attach="background" args={[sc.dark ? "#1a1c22" : "#dfe6ee"]} />
      <fog attach="fog" args={[sc.dark ? "#22252c" : "#b9bcc2", 2 + (1 - smokeAmt) * 30, 9 + (1 - smokeAmt) * 60]} />
      <ambientLight intensity={sc.dark ? 0.45 : 0.75} />
      <directionalLight position={[-6, 5, 2]} intensity={sc.dark ? 0.6 : 1.9} />
      {sc.alarm && <pointLight position={[0, 2.6, pos[2] - 2]} color="#ff2020" intensity={alarmPulse * 7} distance={9} />}
      <HeadCam pos={pos} yaw={yaw} pitch={sc.cam.pitch ?? -0.12} t={t} walk={sc.cam.walk ?? 0} shake={shake} fov={sc.fov ?? 98} />
      {sc.room === "classroom" && <Classroom t={t} sc={sc} k={k} />}
      {sc.room === "hallway" && <Hallway t={t} sc={sc} k={k} />}
    </ThreeCanvas>
  );
};

const easeInOut = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
