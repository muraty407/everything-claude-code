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
export const Person: React.FC<{ p: V3; ry?: number; seed: number; seated?: boolean; look?: number; t: number; scared?: number; run?: number; dance?: number; sc?: number; shirtC?: string }> = ({ p, ry = 0, seed, seated, look = 0, t, scared = 0, run = 0, dance = 0, sc = 1, shirtC }) => {
  const skin = SKIN[seed % SKIN.length], hair = HAIR[(seed * 7) % HAIR.length], shirt = shirtC ?? SHIRT[(seed * 5) % SHIRT.length];
  const pants = seed % 2 ? "#2f3b52" : "#3b3b3b";
  const breathe = Math.sin(t * 2 + seed) * 0.01;
  const fidget = Math.sin(t * (1.3 + (seed % 5) * 0.2) + seed) * 0.08 * (1 + scared * 2);
  const stride = run ? Math.sin(t * 9 + seed) * 0.6 : 0;
  const y0 = seated ? 0.45 : 0.8;
  // Tanzen: im Takt (dance = Schläge pro Sekunde) wippen, Arme hoch, leicht drehen
  const beatPh = dance ? t * dance * Math.PI * 2 + (seed % 2) * Math.PI : 0;
  const hop = dance ? Math.abs(Math.sin(beatPh / 2)) * 0.09 : 0;
  const armUp = dance ? -2.2 + 0.5 * Math.sin(beatPh + seed) : 0;
  const twist = dance ? Math.sin(beatPh / 2 + seed) * 0.35 : 0;
  return (
    <group position={[p[0], p[1] + hop, p[2]]} rotation={[0, ry + twist, 0]} scale={[sc, sc, sc]}>
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
        <TBox p={[-0.27, dance && seed % 3 ? 0.3 : -0.02, seated ? -0.12 : 0]} s={[0.11, 0.52, 0.12]} c={shirt} r={[seated ? 0.6 + fidget : dance && seed % 3 ? armUp : stride * 0.8, 0, 0.05]} />
        <TBox p={[0.27, dance && seed % 2 ? 0.3 : -0.02, seated ? -0.12 : 0]} s={[0.11, 0.52, 0.12]} c={shirt} r={[seated ? 0.6 - fidget : dance && seed % 2 ? armUp : -stride * 0.8, 0, -0.05]} />
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
  room: "classroom" | "hallway" | "stairs" | "bathroom" | "yard" | "club" | "clubdoor";
  guests?: number; // Club: Gäste auf der Tanzfläche
  queue?: number; // Club-Eingang: Schlange vor der Tür
  dj?: boolean;
  bpm?: number;
  torch?: boolean; // Handy-Taschenlampe
  ladder?: boolean; // Drehleiter am Fenster + Blaulicht
  door?: string; // Schild an der Tür am Flurende
  count?: number; // Schulhof: Anzahl Schüler in der Reihe
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
      {sc.ladder && (
        <group position={[-5.25, -1.0, -1.5]}>
          <TBox p={[0, 1.6, 0]} s={[0.12, 4.4, 0.12]} c="#c0c0c0" r={[0, 0, -0.35]} />
          <TBox p={[0, 1.6, 0.7]} s={[0.12, 4.4, 0.12]} c="#c0c0c0" r={[0, 0, -0.35]} />
          {Array.from({ length: 9 }, (_, i) => <TBox key={i} p={[-0.62 + i * 0.16, -0.1 + i * 0.44, 0.35]} s={[0.06, 0.06, 0.7]} c="#d0d0d0" line={0.01} />)}
          <Person p={[0.55, 1.25, 1.0]} ry={-Math.PI / 2} seed={31} t={t} />
        </group>
      )}
      {sc.ladder && <pointLight position={[-6.5, 1.5, -1.5]} color="#3060ff" intensity={Math.sin(t * 7) > 0 ? 25 : 0} distance={10} />}
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
      {sc.door && <TBox p={[0, 2.0, -len + 0.12]} s={[1.0, 0.25, 0.04]} c="#f1c40f" e="#8a6d00" />}
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

const Bathroom: React.FC<{ t: number; sc: Scene3D; k: number }> = ({ t, sc, k }) => (
  <group>
    <TBox p={[0, -0.05, -3]} s={[5, 0.1, 8]} c="#cfd8dc" noLine />
    {Array.from({ length: 9 }, (_, i) => <TBox key={`t${i}`} p={[-2.5 + i * 0.6, 0.002, -3]} s={[0.02, 0.005, 8]} c="#9fb0b8" noLine />)}
    <TBox p={[0, 3.05, -3]} s={[5, 0.1, 8]} c="#e8eef0" noLine />
    <TBox p={[2.55, 1.5, -3]} s={[0.1, 3.2, 8]} c="#b8dce8" />
    <TBox p={[-2.55, 1.5, -3]} s={[0.1, 3.2, 8]} c="#b8dce8" />
    <TBox p={[0, 1.5, -7]} s={[5, 3.2, 0.1]} c="#b8dce8" />
    {/* Kabinen rechts */}
    {[0, 1, 2].map((i) => (
      <group key={`k${i}`}>
        <TBox p={[1.6, 1.0, -2 - i * 1.5]} s={[0.05, 2.0, 1.4]} c="#e67e22" r={[0, i === 1 ? 0.6 : 0, 0]} />
        <TBox p={[2.0, 1.0, -1.3 - i * 1.5]} s={[1.0, 2.0, 0.05]} c="#d35400" />
      </group>
    ))}
    {/* Waschbecken + Spiegel links */}
    {[0, 1, 2].map((i) => (
      <group key={`w${i}`}>
        <TBox p={[-2.2, 0.85, -2 - i * 1.4]} s={[0.6, 0.15, 0.7]} c="#ffffff" />
        <TBox p={[-2.48, 1.6, -2 - i * 1.4]} s={[0.04, 0.8, 0.6]} c="#d6eaf8" e="#203040" />
      </group>
    ))}
    {/* Lena sitzt am Boden unter den Waschbecken */}
    <Person p={[-1.9, -0.4, -4.6]} ry={-Math.PI / 2 + 0.4} seed={8} seated t={t} scared={1} look={0.3} />
    <Smoke t={t} amount={lerp(sc.smoke?.[0] ?? 0, sc.smoke?.[1] ?? 0, k)} area={[-2, 2, -6.5, -1]} y={2.7} seed={13} />
  </group>
);

const Yard: React.FC<{ t: number; sc: Scene3D; k: number }> = ({ t, sc, k }) => {
  const n = sc.count ?? 28;
  return (
    <group>
      <TBox p={[0, -0.05, -15]} s={[60, 0.1, 60]} c="#8d9196" noLine />
      {Array.from({ length: 6 }, (_, i) => <TBox key={`m${i}`} p={[-10 + i * 4, 0.003, -8]} s={[0.12, 0.005, 6]} c="#f5f5f5" noLine />)}
      {/* Schulgebäude mit Rauch */}
      <TBox p={[0, 4, -26]} s={[34, 8, 6]} c="#d9b38c" />
      {Array.from({ length: 2 }, (_, r) => Array.from({ length: 10 }, (_, i) => (
        <TBox key={`sw${r}${i}`} p={[-15 + i * 3.3, 2.2 + r * 3, -22.9]} s={[1.8, 1.6, 0.05]} c="#9fd3f5" e={r === 1 && i === 4 ? "#ff6a00" : "#2a4a66"} />
      )))}
      <Smoke t={t} amount={0.9} area={[-4, 4, -27, -23]} y={9} seed={21} />
      {/* Feuerwehr */}
      {[-9, 7].map((x, j) => (
        <group key={`fw${j}`} position={[x, 0, -16]} rotation={[0, j ? -0.3 : 0.3, 0]}>
          <TBox p={[0, 1.3, 0]} s={[2.6, 2.2, 7]} c="#c0392b" />
          <TBox p={[0, 1.4, 3.6]} s={[2.5, 1.8, 0.1]} c="#9fd3f5" e="#203040" />
          <TBox p={[0, 2.6, -1]} s={[0.5, 0.3, 5]} c="#bdc3c7" />
          <TBox p={[-0.8, 2.5, 3.3]} s={[0.4, 0.2, 0.3]} c="#3060ff" e={Math.sin(t * 8 + j) > 0 ? "#3060ff" : "#0a1030"} />
          <TBox p={[0.8, 2.5, 3.3]} s={[0.4, 0.2, 0.3]} c="#3060ff" e={Math.sin(t * 8 + j) > 0 ? "#0a1030" : "#3060ff"} />
          {[[-1.2, 2.5], [1.2, 2.5], [-1.2, -2.5], [1.2, -2.5]].map(([wx, wz], i) => (
            <mesh key={i} position={[wx, 0.45, wz]} rotation={[0, 0, Math.PI / 2]} material={toon("#222")}><cylinderGeometry args={[0.45, 0.45, 0.3, 16]} /></mesh>
          ))}
        </group>
      ))}
      {/* Schüler in Reihen am Sammelplatz */}
      {Array.from({ length: n }, (_, i) => (
        <Person key={`s${i}`} p={[-5.5 + (i % 10) * 1.2, 0, -6 - Math.floor(i / 10) * 1.4]} ry={Math.sin(i) * 0.4} seed={i + 3} t={t} look={Math.sin(t + i) * 0.3} />
      ))}
      <Person p={[0, 0, -3.2]} ry={Math.PI} seed={11} t={t} />
      <pointLight position={[0, 3, -12]} color="#3060ff" intensity={Math.sin(t * 8) > 0 ? 30 : 5} distance={25} />
    </group>
  );
};

const GOLD = "#d4af37", GOLD_E = "#7a5c12", MARBLE = "#15151a", VELVET = "#3a0d1c";
const SUITS = ["#0e0e12", "#f2f2f2", "#7a1027", "#1b2a4a", "#2b2b30", "#c9a227", "#0e0e12", "#e8e2d4"];

// gehobener House-Club: schwarzer Marmor, Gold, warmes Licht, Kronleuchter
const Club: React.FC<{ t: number; sc: Scene3D }> = ({ t, sc }) => {
  const bps = (sc.bpm ?? 122) / 60;
  const beat = Math.floor(t * bps);
  const pulse = Math.pow(1 - ((t * bps) % 1), 3); // Kick-Puls 1 → 0
  const n = Math.min(sc.guests ?? 0, 260);
  const r = mulberry(77);
  const spots = Array.from({ length: n }, (_, i) => {
    const ring = Math.sqrt(i + 0.5) * 0.62, a = i * 2.39996;
    return [Math.cos(a) * ring + (r() - 0.5) * 0.2, Math.sin(a) * ring * 0.8 - 2.5 + (r() - 0.5) * 0.2] as [number, number];
  });
  return (
    <group>
      {/* Marmorboden mit goldenen Fugen; Tanzfläche = warm leuchtende Felder im Takt */}
      <TBox p={[0, -0.06, -2.5]} s={[16, 0.1, 14]} c={MARBLE} noLine />
      {Array.from({ length: 9 }, (_, i) => <TBox key={`gx${i}`} p={[-8 + i * 2, 0.0, -2.5]} s={[0.03, 0.01, 14]} c={GOLD} e={GOLD_E} noLine />)}
      {Array.from({ length: 8 }, (_, j) => <TBox key={`gz${j}`} p={[0, 0.0, -9 + j * 2]} s={[16, 0.01, 0.03]} c={GOLD} e={GOLD_E} noLine />)}
      {Array.from({ length: 6 }, (_, i) => Array.from({ length: 5 }, (_, j) => {
        const on = (i + j + beat) % 4 === 0;
        return <TBox key={`f${i}-${j}`} p={[-2.5 + i, 0.01, -4.5 + j]} s={[0.94, 0.04, 0.94]} c={on ? "#ffd98a" : "#1d1c22"} e={on ? "#c9962a" : undefined} noLine />;
      }))}
      <TBox p={[0, 4.6, -2.5]} s={[16, 0.1, 14]} c="#0b0b0e" noLine />
      {/* Wände: dunkler Samt mit Goldleisten */}
      <TBox p={[0, 2.3, -9.3]} s={[16, 4.8, 0.2]} c={VELVET} />
      <TBox p={[-7.9, 2.3, -2.5]} s={[0.2, 4.8, 14]} c="#1a1014" />
      <TBox p={[7.9, 2.3, -2.5]} s={[0.2, 4.8, 14]} c="#1a1014" />
      {[0.9, 3.9].map((y) => <TBox key={`gl${y}`} p={[0, y, -9.17]} s={[16, 0.07, 0.05]} c={GOLD} e={GOLD_E} noLine />)}
      {Array.from({ length: 7 }, (_, i) => <TBox key={`pl${i}`} p={[-7.5 + i * 2.5, 2.4, -9.15]} s={[0.12, 3.0, 0.06]} c={GOLD} e={GOLD_E} noLine />)}
      {/* Wandleuchten */}
      {[-5, 0, 5].map((x) => (
        <group key={`wl${x}`}>
          <TBox p={[x, 3.0, -9.1]} s={[0.25, 0.5, 0.15]} c="#ffe9b8" e="#ffcf7a" />
          <pointLight position={[x, 3.0, -8.4]} color="#ffcf7a" intensity={7} distance={6} />
        </group>
      ))}
      {/* Marmor-Bar mit Goldkante, Barkeeper im schwarzen Hemd, beleuchtetes Flaschenregal */}
      <TBox p={[-6.2, 0.6, -3]} s={[1.0, 1.2, 5]} c="#101014" />
      <TBox p={[-6.2, 1.23, -3]} s={[1.25, 0.08, 5.2]} c={GOLD} e={GOLD_E} />
      <TBox p={[-7.6, 2.3, -3]} s={[0.3, 1.9, 4.6]} c="#0c0c10" />
      <TBox p={[-7.42, 2.3, -3]} s={[0.04, 1.7, 4.4]} c="#ffe2a8" e="#b8842a" noLine />
      {Array.from({ length: 12 }, (_, i) => <TBox key={`b${i}`} p={[-7.36, 1.8 + (i % 3) * 0.5, -4.9 + i * 0.35]} s={[0.09, 0.34, 0.09]} c={["#2d5a3a", "#6b3b1a", "#e8e2d4", "#7a1027"][i % 4]} line={0.01} />)}
      <Person p={[-7.0, 0, -3]} ry={-Math.PI / 2} seed={17} t={t} shirtC="#0e0e12" />
      {[-4.4, -2.9, -1.6].map((z) => <group key={`st${z}`}><TBox p={[-5.3, 0.4, z]} s={[0.06, 0.8, 0.06]} c={GOLD} line={0.01} /><TBox p={[-5.3, 0.82, z]} s={[0.4, 0.08, 0.4]} c={VELVET} /></group>)}
      {/* VIP-Sofas rechts (Samt) mit Tischchen */}
      {[-6, -3.2].map((z) => (
        <group key={`sofa${z}`}>
          <TBox p={[6.9, 0.35, z]} s={[1.0, 0.5, 2.2]} c={VELVET} />
          <TBox p={[7.35, 0.85, z]} s={[0.25, 0.9, 2.2]} c={VELVET} />
          <TBox p={[5.9, 0.4, z]} s={[0.6, 0.06, 0.6]} c={GOLD} e={GOLD_E} />
          <TBox p={[5.9, 0.2, z]} s={[0.08, 0.4, 0.08]} c="#101014" line={0.01} />
        </group>
      ))}
      {/* DJ-Pult: schwarz-gold */}
      <TBox p={[0, 0.7, -8.3]} s={[3.2, 1.4, 1.0]} c="#0c0c10" />
      <TBox p={[0, 1.45, -8.3]} s={[3.4, 0.08, 1.2]} c={GOLD} e={GOLD_E} />
      {[-2.6, 2.6].map((x) => <TBox key={x} p={[x, 1.2, -8.6]} s={[1.0, 2.4, 0.8]} c="#0c0c10" />)}
      {[-2.6, 2.6].map((x) => <mesh key={`sp${x}`} position={[x, 1.5, -8.15]} rotation={[Math.PI / 2, 0, 0]} material={toon("#1c1c20")}><cylinderGeometry args={[0.3 + 0.05 * pulse, 0.3 + 0.05 * pulse, 0.1, 24]} /></mesh>)}
      {sc.dj && <Person p={[0, 0, -8.9]} ry={0} seed={5} t={t} dance={bps} shirtC="#f2f2f2" />}
      {/* Kronleuchter */}
      {[[-3, -2.5], [3, -2.5], [0, -6]].map(([x, z], i) => (
        <group key={`ch${i}`} position={[x, 3.7, z]} rotation={[0, t * 0.15 + i, 0]}>
          <TBox p={[0, 0.55, 0]} s={[0.04, 0.7, 0.04]} c={GOLD} noLine />
          <mesh rotation={[Math.PI / 2, 0, 0]} material={toon(GOLD, GOLD_E)}><torusGeometry args={[0.55, 0.04, 8, 24]} /></mesh>
          {Array.from({ length: 8 }, (_, k) => <TBox key={k} p={[Math.cos(k * 0.785) * 0.55, -0.12, Math.sin(k * 0.785) * 0.55]} s={[0.07, 0.2, 0.07]} c="#fff3d0" e="#ffd98a" noLine />)}
          <pointLight color="#ffd9a0" intensity={9 + 5 * pulse} distance={8} />
        </group>
      ))}
      {/* dezente Spots im Takt (Gold / Weiß / tiefes Rot) */}
      {[0, 1].map((i) => (
        <pointLight key={`pl${i}`} position={[Math.sin(t * 0.6 + i * 3.1) * 3, 3.4, -2.5 + Math.cos(t * 0.5 + i * 3.1) * 2]} color={["#ffcf7a", "#ffffff", "#b3122e"][(i + beat) % 3]} intensity={8 * (0.4 + pulse)} distance={8} />
      ))}
      {/* Gäste in Abendgarderobe */}
      {spots.map(([x, z], i) => <Person key={`g${i}`} p={[x, 0.03, z]} ry={(i * 1.7) % 6.28} seed={i + 40} t={t} dance={bps} shirtC={SUITS[i % SUITS.length]} />)}
    </group>
  );
};

const ClubDoor: React.FC<{ t: number; sc: Scene3D }> = ({ t, sc }) => {
  const q = Math.min(sc.queue ?? 0, 14);
  const flick = Math.sin(t * 23) > -0.9 ? 1 : 0.3;
  return (
    <group>
      <TBox p={[0, -0.05, 2]} s={[30, 0.1, 20]} c="#23252b" noLine />
      <TBox p={[0, 0.01, 1.2]} s={[30, 0.02, 0.15]} c="#f1c40f" noLine />
      {/* Fassade */}
      <TBox p={[0, 4, -3.2]} s={[18, 8, 0.4]} c="#141418" />
      {Array.from({ length: 8 }, (_, i) => <TBox key={`br${i}`} p={[-7.8 + i * 2.2, 5.6, -2.98]} s={[1.4, 1.2, 0.05]} c="#15122a" e={i % 3 === 1 ? "#3a2a10" : undefined} />)}
      {/* Tür + Neon-Schild */}
      <TBox p={[0, 1.3, -2.98]} s={[1.7, 2.6, 0.08]} c="#0a0a0c" e="#2a1e06" />
      <TBox p={[0, 2.75, -2.95]} s={[2.1, 0.12, 0.1]} c={GOLD} e="#c9962a" noLine />
      <TBox p={[-1.02, 1.35, -2.95]} s={[0.12, 2.8, 0.1]} c={GOLD} e="#c9962a" noLine />
      <TBox p={[1.02, 1.35, -2.95]} s={[0.12, 2.8, 0.1]} c={GOLD} e="#c9962a" noLine />
      <TBox p={[0, 3.7, -2.9]} s={[5.2, 1.1, 0.15]} c="#0c0c10" />
      <TBox p={[0, 3.7, -2.8]} s={[4.8, 0.12, 0.05]} c="#ffe9b8" e={flick > 0.5 ? "#ffcf7a" : "#5a4010"} noLine />
      <pointLight position={[0, 2.4, -1.6]} color="#ffcf7a" intensity={22 * flick} distance={9} />
      {/* roter Teppich, Absperrband, Laterne */}
      <TBox p={[0, 0.02, -0.6]} s={[1.8, 0.03, 4.6]} c="#8e1b2e" noLine />
      {[-1.2, 1.2].map((x) => [0.2, -1.6].map((z) => (
        <group key={`${x}${z}`}>
          <TBox p={[x, 0.5, z]} s={[0.08, 1.0, 0.08]} c="#d4af37" line={0.012} />
          <TSphere p={[x, 1.03, z]} r={0.07} c="#d4af37" />
        </group>
      )))}
      {[-1.2, 1.2].map((x) => <TBox key={`rp${x}`} p={[x, 0.88, -0.7]} s={[0.05, 0.05, 1.8]} c="#b0122a" line={0.01} />)}
      <TBox p={[4.5, 2.2, -1]} s={[0.12, 4.4, 0.12]} c="#333" />
      <TBox p={[4.5, 4.4, -1]} s={[0.5, 0.2, 0.5]} c="#ffe9a8" e="#ffe9a8" />
      <pointLight position={[4.5, 4, -1]} color="#ffd9a0" intensity={10} distance={10} />
      {/* Türsteher (groß, schwarz) + Schlange */}
      <Person p={[1.55, 0, -2.2]} ry={-0.5} seed={3} t={t} sc={1.28} shirtC="#0e0e10" look={Math.sin(t * 0.8) * 0.3} />
      {Array.from({ length: q }, (_, i) => <Person key={`q${i}`} p={[-1.75 + Math.sin(i) * 0.12, 0, -1.4 + i * 0.85]} ry={Math.PI} seed={i + 40} t={t} look={Math.sin(t + i) * 0.4} shirtC={SUITS[i % SUITS.length]} />)}
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
      <color attach="background" args={[sc.room === "yard" ? "#9ec9ea" : sc.room === "club" ? "#08070a" : sc.room === "clubdoor" ? "#0a0c14" : sc.dark ? "#1a1c22" : "#dfe6ee"]} />
      <fog attach="fog" args={[sc.room.startsWith("club") ? "#0c0a0c" : sc.dark ? "#22252c" : "#b9bcc2", 2 + (1 - smokeAmt) * 30, 9 + (1 - smokeAmt) * 60]} />
      <ambientLight intensity={sc.room.startsWith("club") ? 0.5 : sc.dark ? 0.22 : 0.75} />
      <directionalLight position={[-6, 5, 2]} intensity={sc.dark ? 0.3 : 1.9} />
      {sc.alarm && <pointLight position={[0, 2.6, pos[2] - 2]} color="#ff2020" intensity={alarmPulse * 7} distance={9} />}
      <HeadCam pos={pos} yaw={yaw} pitch={sc.cam.pitch ?? -0.12} t={t} walk={sc.cam.walk ?? 0} shake={shake} fov={sc.fov ?? 98} />
      {sc.room === "classroom" && <Classroom t={t} sc={sc} k={k} />}
      {sc.room === "hallway" && <Hallway t={t} sc={sc} k={k} />}
      {sc.room === "bathroom" && <Bathroom t={t} sc={sc} k={k} />}
      {sc.room === "yard" && <Yard t={t} sc={sc} k={k} />}
      {sc.room === "club" && <Club t={t} sc={sc} />}
      {sc.room === "clubdoor" && <ClubDoor t={t} sc={sc} />}
      {sc.torch && <pointLight position={[pos[0], pos[1] + 0.5, pos[2] - 2.8]} color="#fff4d8" intensity={3} distance={7} decay={2} />}
    </ThreeCanvas>
  );
};

const easeInOut = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
