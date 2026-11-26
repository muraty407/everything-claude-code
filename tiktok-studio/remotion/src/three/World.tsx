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
    <mesh material={toon(c)}><sphereGeometry args={[r, 12, 9]} /></mesh>
    <mesh material={outlineMat}><sphereGeometry args={[r * 1.07, 12, 9]} /></mesh>
  </group>
);

const SKIN = ["#f1c7a5", "#d9a37e", "#a86f4c", "#7a4a2e", "#f5d3b8"];
const HAIR = ["#2b1d14", "#5b3a1e", "#d9b26a", "#111111", "#8a3b1c", "#3d2b1f"];
const SHIRT = ["#e8b33a", "#c0392b", "#3a7bd5", "#6aa84f", "#8e44ad", "#e67e22", "#2c3e50", "#d35480", "#1abc9c"];

// Figur (sitzend oder stehend). look = Kopfdrehung zur Seite (rad), t = Zeit für Atmen/Zappeln
export const Person: React.FC<{ p: V3; ry?: number; seed: number; seated?: boolean; look?: number; t: number; scared?: number; run?: number; dance?: number; sc?: number; shirtC?: string; fancy?: boolean; gesture?: number; nod?: number }> = ({ p, ry = 0, seed, seated, look = 0, t, scared = 0, run = 0, dance = 0, sc = 1, shirtC, fancy, gesture = 0, nod = 0 }) => {
  const skin = SKIN[seed % SKIN.length], hair = HAIR[(seed * 7) % HAIR.length], shirt = shirtC ?? SHIRT[(seed * 5) % SHIRT.length];
  const dress = !!fancy && seed % 3 === 0; // Abendkleid statt Anzug
  const pants = fancy ? (dress ? skin : "#101014") : seed % 2 ? "#2f3b52" : "#3b3b3b";
  const light = shirt === "#f2f2f2" || shirt === "#e8e2d4";
  const TIES = ["#7a1027", "#d4af37", "#101014", "#1b2a4a"];
  const breathe = Math.sin(t * 2 + seed) * 0.01;
  const fidget = Math.sin(t * (1.3 + (seed % 5) * 0.2) + seed) * 0.08 * (1 + scared * 2);
  const stride = run ? Math.sin(t * 9 + seed) * 0.6 : 0;
  const y0 = seated ? 0.45 : 0.8;
  // Tanzen: im Takt (dance = Schläge pro Sekunde) wippen, Arme hoch, leicht drehen
  const beatPh = dance ? t * dance * Math.PI * 2 + (seed % 2) * Math.PI : 0;
  const hop = dance ? Math.abs(Math.sin(beatPh / 2)) * 0.09 : 0;
  const armUp = dance ? -2.2 + 0.5 * Math.sin(beatPh + seed) : 0;
  const style = dance ? seed % 5 : -1; // 0 hüpfen, 1 wiegen, 2 springen, 3 drehen, 4 Faust
  const twist = dance ? (style === 3 ? t * 2.2 + seed : Math.sin(beatPh / 2 + seed) * 0.35) : 0;
  const swayX = style === 1 ? Math.sin(beatPh / 2) * 0.12 : 0;
  const jump = style === 2 ? Math.pow(Math.abs(Math.sin(beatPh / 2)), 0.6) * 0.22 : 0;
  const lean = style === 4 ? Math.sin(beatPh) * 0.12 : 0;
  return (
    <group position={[p[0] + swayX, p[1] + hop + jump, p[2]]} rotation={[lean, ry + twist, 0]} scale={[sc, sc, sc]}>
      {fancy && (
        <>
          <mesh position={[0, 0.012 - (hop + jump) / sc, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.34, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.38} depthWrite={false} /></mesh>
          <TBox p={[-0.1, 0.04, -0.05]} s={[0.17, 0.08, 0.28]} c={dress ? "#d4af37" : "#060606"} noLine />
          <TBox p={[0.1, 0.04, -0.05]} s={[0.17, 0.08, 0.28]} c={dress ? "#d4af37" : "#060606"} noLine />
        </>
      )}
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
        {fancy && !dress && (
          <>
            <TBox p={[0, 0.06, -0.123]} s={[0.13, 0.46, 0.012]} c={light ? "#15151a" : "#f4f1ea"} noLine />
            <TBox p={[0, 0.03, -0.131]} s={[0.05, 0.36, 0.012]} c={TIES[seed % TIES.length]} noLine />
            <TBox p={[0, 0.27, -0.128]} s={[0.2, 0.06, 0.02]} c={light ? "#15151a" : "#f4f1ea"} noLine />
          </>
        )}
        {fancy && dress && (
          <>
            <TBox p={[0, -0.5, 0]} s={[0.5, 0.52, 0.34]} c={shirt} />
            <TBox p={[0, 0.2, -0.123]} s={[0.26, 0.03, 0.012]} c="#f0d98a" noLine />
          </>
        )}
        {fancy && <TBox p={[0, 0.33, 0]} s={[0.12, 0.08, 0.12]} c={skin} noLine />}
        {([-1, 1] as const).map((sd) => {
          const up = !!dance && (style === 2 || (style === 4 ? sd > 0 : sd < 0 ? seed % 3 !== 0 : seed % 2 !== 0));
          const pump = style === 4 ? -2.6 + 0.9 * Math.abs(Math.sin(beatPh)) : style === 2 ? -2.9 + 0.25 * Math.sin(beatPh) : armUp;
          const rot = seated ? 0.6 + sd * -fidget : up ? pump : dance ? Math.sin(beatPh / 2 + sd) * 0.5 : sd * -stride * 0.8;
          return (
            <group key={sd} position={[sd * (0.27 + (sd > 0 ? 0.2 * gesture : 0)), (up ? 0.3 : -0.02) + (sd > 0 ? 0.2 * gesture : 0), seated ? -0.12 : 0]} rotation={[sd > 0 && gesture ? -0.55 * gesture : rot, 0, sd > 0 && gesture ? 1.25 * gesture + Math.sin(t * 5) * 0.06 * gesture : sd * -0.05]}>
              <TBox p={[0, 0, 0]} s={[0.11, 0.52, 0.12]} c={dress ? skin : shirt} />
              {fancy && <mesh position={[0, -0.3, 0]} material={toon(skin)}><sphereGeometry args={[0.065, 10, 8]} /></mesh>}
              {fancy && up && sd > 0 && seed % 4 === 1 && <TBox p={[0, -0.4, 0]} s={[0.09, 0.16, 0.02]} c="#eaf4ff" e="#bfe0ff" noLine />}
              {fancy && !dress && <TBox p={[0, -0.235, 0]} s={[0.12, 0.04, 0.13]} c={light ? "#15151a" : "#f4f1ea"} noLine />}
            </group>
          );
        })}
        {/* Kopf */}
        <group position={[0, 0.48, 0]} rotation={[-0.32 * nod, look + fidget * 0.5, 0]}>
          <TSphere p={[0, 0, 0]} r={0.19} c={skin} sc={[1, 1.12, 1]} />
          <TSphere p={[0, 0.07, 0.02]} r={0.195} c={hair} sc={[1.04, 0.85, 1.05]} />
          {fancy && dress && <TBox p={[0, -0.12, 0.13]} s={[0.34, 0.42, 0.12]} c={hair} />}
          {fancy && seed % 5 === 1 && <TSphere p={[0, 0.2, 0.08]} r={0.1} c={hair} />}
          {fancy && (
            <>
              <mesh position={[-0.065, 0.0, -0.172]} material={toon("#fff")}><sphereGeometry args={[0.034, 8, 8]} /></mesh>
              <mesh position={[0.065, 0.0, -0.172]} material={toon("#fff")}><sphereGeometry args={[0.034, 8, 8]} /></mesh>
              <TBox p={[0, -0.085, -0.178]} s={[0.075, 0.018, 0.012]} c={dress ? "#b3122e" : "#5a2a22"} noLine />
              <TBox p={[-0.065, 0.055, -0.182]} s={[0.07, 0.014, 0.012]} c={hair} noLine />
              <TBox p={[0.065, 0.055, -0.182]} s={[0.07, 0.014, 0.012]} c={hair} noLine />
              {seed % 6 === 2 && <TBox p={[0, 0.0, -0.195]} s={[0.26, 0.05, 0.012]} c="#0a0a0a" noLine />}
            </>
          )}
          <mesh position={[-0.065, 0.0, -0.195]} material={toon("#111")}><sphereGeometry args={[0.022 + scared * 0.01, 8, 8]} /></mesh>
          <mesh position={[0.065, 0.0, -0.195]} material={toon("#111")}><sphereGeometry args={[0.022 + scared * 0.01, 8, 8]} /></mesh>
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
  gold?: boolean; // Club: Dresscode „Gold Only“
  fame?: number; // Club: Hall of Fame – Zahl der goldenen Namensschilder (von 100)
  tower?: boolean; // Club: Champagner-Turm an der Bar
  loungeBar?: boolean; // Club: kleine Bar mit Barkeeper in der VIP-Lounge (ab Night 15)
  stage?: boolean; // Club: Bühne mit Band links hinten (ab Night 15)
  lounge?: boolean; // Club: erhöhte VIP-Lounge rechts hinten (ab Night 14)
  kitchen?: number; // Club: offene Küche rechts vorn; Wert = Zahl der Köche (ab Night 12)
  bouncers?: number; // Club-Eingang: Zahl der Türsteher (1 oder 2)
  enter?: boolean; // Club-Eingang: Tür schwingt auf, während die Kamera hineingeht
  sign?: string; // Club-Eingang: Leuchtschrift über der Tür
  laser?: boolean; // Club: Lasershow (ab 100 Followern)
  fx3d?: string[]; // Club-Effekte: confetti, money, co2, sparks, strobe, wave
  bpm?: number;
  torch?: boolean; // Handy-Taschenlampe
  ladder?: boolean; // Drehleiter am Fenster + Blaulicht
  door?: string; // Schild an der Tür am Flurende
  count?: number; // Schulhof: Anzahl Schüler in der Reihe
  smoke?: [number, number]; // Rauchmenge von → bis (0..1)
  alarm?: boolean;
  dark?: boolean;
  cam: { pos: V3; yaw: [number, number]; pitch?: number | [number, number]; walk?: number; move?: V3; orbit?: [number, number, number, number, number] }; // orbit: [Mitte x, Mitte z, Radius, Startwinkel, Endwinkel]
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
const GOLDS = ["#d4af37", "#c9a227", "#e6c65a", "#b8901f", "#f0d98a"];
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
        const ring = Math.round(Math.hypot(i - 2.5, j - 2));
        const on = (ring + beat) % 3 === 0 || (i + j + beat) % 5 === 0;
        const pal = [["#ffd98a", "#c9962a"], ["#ff5c8a", "#b3123f"], ["#fff6dc", "#b9a36a"], ["#ffb347", "#b86a10"]][(ring + Math.floor(beat / 4)) % 4];
        return <TBox key={`f${i}-${j}`} p={[-2.5 + i, 0.01, -4.5 + j]} s={[0.94, 0.04, 0.94]} c={on ? pal[0] : "#1d1c22"} e={on ? pal[1] : undefined} noLine />;
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
          {x === 0 && <pointLight position={[x, 3.0, -8.4]} color="#ffcf7a" intensity={12} distance={9} />}
        </group>
      ))}
      {/* Marmor-Bar mit Goldkante, Barkeeper im schwarzen Hemd, beleuchtetes Flaschenregal */}
      <TBox p={[-6.2, 0.6, -3]} s={[1.0, 1.2, 5]} c="#101014" />
      <TBox p={[-6.2, 1.23, -3]} s={[1.25, 0.08, 5.2]} c={GOLD} e={GOLD_E} />
      <TBox p={[-7.6, 2.3, -3]} s={[0.3, 1.9, 4.6]} c="#0c0c10" />
      <TBox p={[-7.42, 2.3, -3]} s={[0.04, 1.7, 4.4]} c="#ffe2a8" e="#b8842a" noLine />
      {Array.from({ length: 12 }, (_, i) => <TBox key={`b${i}`} p={[-7.36, 1.8 + (i % 3) * 0.5, -4.9 + i * 0.35]} s={[0.09, 0.34, 0.09]} c={["#2d5a3a", "#6b3b1a", "#e8e2d4", "#7a1027"][i % 4]} line={0.01} />)}
      <Person p={[-7.0, 0, -3]} ry={-Math.PI / 2} seed={17} t={t} shirtC="#0e0e12" fancy />
      {(sc.guests ?? 0) >= 10 && <Person p={[-7.0, 0, -4.6]} ry={-Math.PI / 2} seed={22} t={t} shirtC="#f2f2f2" fancy />}
      {/* Flaschenhälse, Gläser auf der Bar, Barlampen */}
      {Array.from({ length: 12 }, (_, i) => <TBox key={`bn${i}`} p={[-7.36, 2.03 + (i % 3) * 0.5, -4.9 + i * 0.35]} s={[0.04, 0.12, 0.04]} c="#e8e2d4" noLine />)}
      {Array.from({ length: 9 }, (_, i) => (
        <group key={`gl${i}`} position={[-6.0 + (i % 2) * 0.22, 1.27, -5.1 + i * 0.5]}>
          <mesh position={[0, 0.02, 0]} material={toon("#e8e2d4")}><cylinderGeometry args={[0.035, 0.035, 0.012, 10]} /></mesh>
          <mesh position={[0, 0.08, 0]} material={toon("#e8e2d4")}><cylinderGeometry args={[0.008, 0.008, 0.11, 6]} /></mesh>
          <mesh position={[0, 0.18, 0]} material={toon(i % 3 === 0 ? "#f3d57a" : "#fff6dc", i % 3 === 0 ? "#b98a1e" : "#6d6652")}><cylinderGeometry args={[0.05, 0.02, 0.1, 10]} /></mesh>
        </group>
      ))}
      {[-4.6, -3, -1.4].map((z) => (
        <group key={`bl${z}`}>
          <TBox p={[-6.2, 3.6, z]} s={[0.02, 2.0, 0.02]} c={GOLD} noLine />
          <mesh position={[-6.2, 2.55, z]} material={toon("#fff3d0", "#ffd98a")}><coneGeometry args={[0.2, 0.26, 14]} /></mesh>
        </group>
      ))}
      {/* Champagner-Turm (Night 4 gekauft) */}
      {sc.tower && (
        <group position={[-5.95, 1.27, -0.9]}>
          {[4, 3, 2, 1].map((n, lvl) => Array.from({ length: n * n }, (_, k) => (
            <mesh key={`tw${lvl}-${k}`} position={[((k % n) - (n - 1) / 2) * 0.11, 0.06 + lvl * 0.12, (Math.floor(k / n) - (n - 1) / 2) * 0.11]} material={toon("#fbe7a6", "#c79a2a")}><cylinderGeometry args={[0.05, 0.025, 0.11, 8]} /></mesh>
          )))}
        </group>
      )}
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
      {/* Plattenteller, Mixer, Laptop */}
      {[-0.95, 0.95].map((x) => (
        <group key={`deck${x}`} position={[x, 1.52, -8.3]} rotation={[0, t * 3.4, 0]}>
          <mesh material={toon("#0a0a0c")}><cylinderGeometry args={[0.3, 0.3, 0.05, 24]} /></mesh>
          <TBox p={[0.14, 0.03, 0]} s={[0.26, 0.012, 0.03]} c="#f4f1ea" noLine />
          <mesh position={[0, 0.03, 0]} material={toon(GOLD, GOLD_E)}><cylinderGeometry args={[0.07, 0.07, 0.02, 12]} /></mesh>
        </group>
      ))}
      <TBox p={[0, 1.53, -8.3]} s={[0.5, 0.08, 0.6]} c="#1c1c22" line={0.012} />
      {Array.from({ length: 6 }, (_, i) => <TBox key={`kn${i}`} p={[-0.15 + (i % 3) * 0.15, 1.58, -8.42 + Math.floor(i / 3) * 0.22]} s={[0.05, 0.03, 0.05]} c={(i + beat) % 3 === 0 ? "#ff3b5c" : "#ffd98a"} e={(i + beat) % 3 === 0 ? "#ff3b5c" : "#c9962a"} noLine />)}
      {sc.dj && <TBox p={[0, 1.75, -8.72]} s={[0.5, 0.34, 0.03]} c="#cfe6ff" e="#7fb2ff" r={[0.25, 0, 0]} line={0.012} />}
      {/* LED-Wand hinter dem DJ: Equalizer im Takt */}
      <TBox p={[0, 2.75, -9.16]} s={[5.4, 2.3, 0.06]} c="#07070a" />
      {Array.from({ length: 18 }, (_, i) => {
        const h = 0.25 + 1.7 * Math.abs(Math.sin(t * (2.2 + (i % 5) * 0.55) + i * 1.3)) * (0.45 + 0.55 * pulse);
        const hot = h > 1.25;
        return <TBox key={`eq${i}`} p={[-2.47 + i * 0.29, 1.72 + h / 2, -9.11]} s={[0.2, h, 0.04]} c={hot ? "#ff3b5c" : "#ffd98a"} e={hot ? "#ff3b5c" : "#d9a23a"} noLine />;
      })}
      {sc.dj && <Person p={[0, 0, -8.9]} ry={0} seed={5} t={t} dance={bps} shirtC="#f2f2f2" fancy />}
      {/* Kronleuchter */}
      {[[-3, -2.5], [3, -2.5], [0, -6]].map(([x, z], i) => (
        <group key={`ch${i}`} position={[x, 3.7, z]} rotation={[0, t * 0.15 + i, 0]}>
          <TBox p={[0, 0.55, 0]} s={[0.04, 0.7, 0.04]} c={GOLD} noLine />
          <mesh rotation={[Math.PI / 2, 0, 0]} material={toon(GOLD, GOLD_E)}><torusGeometry args={[0.55, 0.04, 8, 24]} /></mesh>
          {Array.from({ length: 8 }, (_, k) => <TBox key={k} p={[Math.cos(k * 0.785) * 0.55, -0.12, Math.sin(k * 0.785) * 0.55]} s={[0.07, 0.2, 0.07]} c="#fff3d0" e="#ffd98a" noLine />)}
          <pointLight color="#ffd9a0" intensity={9 + 5 * pulse} distance={8} />
        </group>
      ))}
      {/* Discokugel mit Lichtpunkten, Traverse mit Scheinwerfern und Lichtkegeln */}
      <group position={[0, 3.75, -3.2]}>
        <TBox p={[0, 0.6, 0]} s={[0.03, 0.6, 0.03]} c="#888" noLine />
        <mesh rotation={[0, t * 0.9, 0]}><icosahedronGeometry args={[0.42, 2]} /><meshStandardMaterial color="#e9eef5" metalness={0.85} roughness={0.2} flatShading emissive="#6f7684" emissiveIntensity={0.55 + 0.3 * pulse} /></mesh>
        <pointLight color="#ffffff" intensity={5 + 5 * pulse} distance={7} />
      </group>
      {Array.from({ length: 26 }, (_, i) => {
        const a = t * 0.9 + i * 0.6283, rr = 1.6 + (i % 5) * 0.75;
        return <mesh key={`dot${i}`} position={[Math.cos(a) * rr, 0.045, -3.2 + Math.sin(a) * rr * 0.9]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.07 + (i % 3) * 0.02, 8]} /><meshBasicMaterial color="#fff6dc" transparent opacity={0.75} depthWrite={false} /></mesh>;
      })}
      <TBox p={[0, 4.3, -5.2]} s={[9, 0.1, 0.1]} c="#2a2a30" line={0.012} />
      <TBox p={[0, 4.3, -1.0]} s={[9, 0.1, 0.1]} c="#2a2a30" line={0.012} />
      {[-3.6, -1.2, 1.2, 3.6].map((x, i) => {
        const sw = Math.sin(t * 0.9 + i * 1.7) * 0.45, tl = Math.cos(t * 0.7 + i) * 0.3;
        const col = ["#ffd98a", "#ff4d6d", "#ffffff", "#ffb347"][(i + beat) % 4];
        return (
          <group key={`mh${i}`} position={[x, 4.2, i % 2 ? -1.0 : -5.2]} rotation={[tl, 0, sw]}>
            <TBox p={[0, -0.1, 0]} s={[0.24, 0.3, 0.24]} c="#15151a" line={0.012} />
            <mesh position={[0, -2.35, 0]}><coneGeometry args={[1.05, 4.2, 20, 1, true]} /><meshBasicMaterial color={col} transparent opacity={0.05 + 0.07 * pulse} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
          </group>
        );
      })}
      {sc.laser && Array.from({ length: 10 }, (_, i) => (
        <mesh key={`lz${i}`} position={[0, 2.6, -8.6]} rotation={[0.25 + 0.1 * Math.sin(t * 2 + i), 0, -0.9 + i * 0.2 + 0.25 * Math.sin(t * 1.7 + i)]}>
          <boxGeometry args={[0.05, 14, 0.05]} /><meshBasicMaterial color={i % 2 ? "#39ff88" : "#ff2bd6"} transparent opacity={0.9} fog={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      {/* Samtkordel vor dem VIP-Bereich, Flaschenkühler, Gäste auf den Sofas, Pflanzen, Wandspiegel */}
      {[-7.1, -4.6, -2.1].map((z) => <group key={`vp${z}`}><TBox p={[5.2, 0.5, z]} s={[0.07, 1.0, 0.07]} c={GOLD} line={0.012} /><TSphere p={[5.2, 1.04, z]} r={0.07} c={GOLD} /></group>)}
      {[-5.85, -3.35].map((z) => <TBox key={`vr${z}`} p={[5.2, 0.86, z]} s={[0.05, 0.05, 2.4]} c="#b0122a" line={0.01} />)}
      {[-6, -3.2].map((z, i) => (
        <group key={`vt${z}`}>
          <mesh position={[5.9, 0.53, z]} material={toon("#c9ced6")}><cylinderGeometry args={[0.12, 0.09, 0.2, 12]} /></mesh>
          <TBox p={[5.9, 0.72, z]} s={[0.06, 0.3, 0.06]} c="#2d5a3a" r={[0.2, 0, 0.2]} line={0.01} />
          <Person p={[6.85, 0.18, z - 0.45]} ry={Math.PI / 2} seed={60 + i} t={t} seated shirtC={SUITS[(i + 2) % SUITS.length]} fancy />
          <Person p={[6.85, 0.18, z + 0.5]} ry={Math.PI / 2} seed={63 + i * 3} t={t} seated shirtC={GOLDS[i]} fancy />
        </group>
      ))}
      {[[-7.2, 0.6], [7.2, 0.6], [7.2, -8.6]].map(([x, z], i) => (
        <group key={`plant${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]} material={toon(GOLD, GOLD_E)}><cylinderGeometry args={[0.26, 0.2, 0.6, 12]} /></mesh>
          <TSphere p={[0, 1.0, 0]} r={0.42} c="#1f5b34" sc={[1, 1.3, 1]} />
          <TSphere p={[0.2, 1.45, 0.1]} r={0.26} c="#2a7a45" />
        </group>
      ))}
      {[-6.5, -4.2].map((z) => (
        <group key={`mir${z}`}>
          <TBox p={[7.76, 2.6, z]} s={[0.05, 1.5, 1.1]} c={GOLD} e={GOLD_E} />
          <TBox p={[7.72, 2.6, z]} s={[0.04, 1.3, 0.9]} c="#2a2f3a" e="#1a2030" noLine />
        </group>
      ))}
      {/* dezente Spots im Takt (Gold / Weiß / tiefes Rot) */}
      {[0, 1].map((i) => (
        <pointLight key={`pl${i}`} position={[Math.sin(t * 0.6 + i * 3.1) * 3, 3.4, -2.5 + Math.cos(t * 0.5 + i * 3.1) * 2]} color={["#ffcf7a", "#ffffff", "#b3122e"][(i + beat) % 3]} intensity={8 * (0.4 + pulse)} distance={8} />
      ))}
      {/* Gäste in Abendgarderobe */}
      {spots.map(([x, z], i) => <Person key={`g${i}`} p={[x, 0.03, z]} ry={(i * 1.7) % 6.28} seed={i + 40} t={t} dance={bps} shirtC={sc.gold ? GOLDS[i % GOLDS.length] : SUITS[i % SUITS.length]} fancy />)}
      {sc.smoke && <Smoke t={t} amount={sc.smoke[1]} area={[-3.5, 3.5, -5.5, 0]} y={0.7} seed={21} />}
      <ClubFx t={t} fx={sc.fx3d ?? []} beat={beat} pulse={pulse} bps={bps} />
      {sc.lounge && (
        <group position={[5.6, 0, -4.6]}>
          {/* VIP-Lounge: goldenes Podest, Samtsofa, Tisch mit Champagner, Kordel, Leuchtschild */}
          <TBox p={[0, 0.2, 0]} s={[4.2, 0.4, 5.4]} c="#1a1014" />
          <TBox p={[-2.12, 0.42, 0]} s={[0.08, 0.08, 5.4]} c={GOLD} e={GOLD_E} noLine />
          <TBox p={[0, 0.42, 2.72]} s={[4.2, 0.08, 0.08]} c={GOLD} e={GOLD_E} noLine />
          <TBox p={[1.3, 0.75, 0]} s={[1.0, 0.6, 4.4]} c="#5a0f1e" />
          <TBox p={[1.8, 1.3, 0]} s={[0.3, 1.1, 4.4]} c="#5a0f1e" />
          <TBox p={[-0.2, 0.75, 0]} s={[1.0, 0.08, 1.6]} c={GOLD} e={GOLD_E} />
          <TBox p={[-0.2, 0.55, 0]} s={[0.12, 0.34, 0.12]} c="#101014" line={0.01} />
          {[-0.4, 0, 0.4].map((z, i) => <TBox key={`vb${i}`} p={[-0.2, 1.0, z]} s={[0.1, 0.42, 0.1]} c={i === 1 ? "#f3d57a" : "#2d5a3a"} e={i === 1 ? "#b98a1e" : undefined} line={0.01} />)}
          {[-1.6, -0.5, 0.6, 1.7].map((z, i) => <Person key={`vg${i}`} p={[1.15, 0.5, z]} ry={-Math.PI / 2} seed={80 + i * 3} t={t} seated shirtC={GOLDS[i % GOLDS.length]} fancy />)}
          {[-2.4, 0, 2.4].map((z) => <group key={`lp${z}`}><TBox p={[-2.0, 0.9, z]} s={[0.07, 1.0, 0.07]} c={GOLD} line={0.012} /><TSphere p={[-2.0, 1.44, z]} r={0.07} c={GOLD} /></group>)}
          {[-1.2, 1.2].map((z) => <TBox key={`lr${z}`} p={[-2.0, 1.26, z]} s={[0.05, 0.05, 2.3]} c="#b0122a" line={0.01} />)}
          <TBox p={[1.9, 3.1, 0]} s={[0.08, 0.7, 2.6]} c="#0c0c10" />
          <mesh position={[1.84, 3.1, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[2.4, 0.56]} /><meshBasicMaterial map={signTexture("VIP", "#ffcf5a")} transparent depthWrite={false} fog={false} /></mesh>
          <pointLight position={[-0.4, 2.6, 0]} color="#ffcf7a" intensity={10} distance={6} />
          {sc.loungeBar && (
            <group position={[-0.9, 0.4, -2.0]}>
              <TBox p={[0, 0.5, 0]} s={[1.6, 1.0, 0.5]} c="#101014" />
              <TBox p={[0, 1.03, 0]} s={[1.75, 0.07, 0.62]} c={GOLD} e={GOLD_E} />
              {[-0.5, -0.15, 0.2, 0.55].map((x, i) => <TBox key={`lb${i}`} p={[x, 1.26, -0.05]} s={[0.09, 0.36, 0.09]} c={["#2d5a3a", "#f3d57a", "#7a1027", "#e8e2d4"][i]} line={0.01} />)}
              <Person p={[0, 0, -0.55]} ry={0} seed={29} t={t} shirtC="#f2f2f2" fancy />
            </group>
          )}
        </group>
      )}
      {sc.stage && (
        <group position={[-4.4, 0, -7.4]}>
          {/* Bühne mit Band: Podest, Schlagzeug, zwei Musiker, Scheinwerfer */}
          <TBox p={[0, 0.3, 0]} s={[4.0, 0.6, 2.4]} c="#1a1014" />
          <TBox p={[0, 0.62, 1.2]} s={[4.0, 0.06, 0.08]} c={GOLD} e={GOLD_E} noLine />
          <mesh position={[0.9, 1.05, -0.4]} material={toon("#b3122e")}><cylinderGeometry args={[0.42, 0.42, 0.5, 16]} /></mesh>
          <mesh position={[0.3, 1.2, -0.1]} material={toon("#e8e2d4")}><cylinderGeometry args={[0.24, 0.24, 0.3, 14]} /></mesh>
          <mesh position={[1.5, 1.55, -0.2]} rotation={[0.2, 0, Math.sin(t * 8) * 0.08]} material={toon(GOLD, GOLD_E)}><cylinderGeometry args={[0.3, 0.3, 0.03, 16]} /></mesh>
          <Person p={[0.9, 0.6, -1.0]} ry={0} seed={91} t={t} dance={bps} shirtC="#0e0e12" fancy />
          <Person p={[-0.9, 0.6, 0.2]} ry={0.3} seed={94} t={t} dance={bps} shirtC="#7a1027" fancy />
          <TBox p={[-0.6, 1.5, 0.45]} s={[0.12, 0.9, 0.08]} c="#d9a35a" r={[0, 0, 0.9]} line={0.012} />
          <TBox p={[-1.7, 1.1, 0.6]} s={[0.05, 1.5, 0.05]} c="#888" noLine /><TSphere p={[-1.7, 1.9, 0.6]} r={0.08} c="#333" />
          <pointLight position={[0, 2.6, 1.0]} color="#ff9d6a" intensity={12} distance={6} />
        </group>
      )}
      {sc.kitchen !== undefined && (
        <group position={[6.6, 0, 0.2]}>
          {/* offene Küche: Tresen, Grillplatte mit Flammen, Abzugshaube, Burger auf dem Pass, Köche mit Mütze */}
          <TBox p={[0, 0.55, 0]} s={[1.1, 1.1, 3.4]} c="#c9ced6" />
          <TBox p={[0, 1.13, 0]} s={[1.25, 0.07, 3.6]} c={GOLD} e={GOLD_E} />
          <TBox p={[0.1, 1.2, -0.7]} s={[0.8, 0.06, 1.1]} c="#1c1c22" line={0.012} />
          {Array.from({ length: 5 }, (_, i) => {
            const h = 0.18 + 0.22 * Math.abs(Math.sin(t * 9 + i * 1.7));
            return <TBox key={`fl${i}`} p={[-0.15 + (i % 2) * 0.3, 1.25 + h / 2, -1.1 + i * 0.2]} s={[0.12, h, 0.12]} c={i % 2 ? "#ffb347" : "#ff5c2a"} e={i % 2 ? "#ff9d1e" : "#ff3b12"} noLine />;
          })}
          <TBox p={[0.2, 3.0, -0.7]} s={[1.2, 0.5, 1.6]} c="#8d949e" />
          <TBox p={[0.2, 3.9, -0.7]} s={[0.4, 1.4, 0.4]} c="#6f7680" />
          {[0.5, 0.9, 1.3].map((z) => (
            <group key={`bg${z}`} position={[-0.25, 1.2, z]}>
              <mesh material={toon("#d9a35a")}><cylinderGeometry args={[0.11, 0.11, 0.05, 12]} /></mesh>
              <mesh position={[0, 0.045, 0]} material={toon("#5a2e16")}><cylinderGeometry args={[0.115, 0.115, 0.04, 12]} /></mesh>
              <mesh position={[0, 0.1, 0]} material={toon("#e0b06a")}><sphereGeometry args={[0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            </group>
          ))}
          {Array.from({ length: sc.kitchen }, (_, i) => (
            <group key={`ck${i}`} position={[0.75, 0, -0.9 + i * 1.3]}>
              <Person p={[0, 0, 0]} ry={Math.PI / 2} seed={71 + i * 4} t={t} shirtC="#f2f2f2" fancy />
              <TBox p={[0, 1.95, 0]} s={[0.26, 0.26, 0.26]} c="#ffffff" />
            </group>
          ))}
          <pointLight position={[-0.6, 2.2, -0.4]} color="#ffb060" intensity={9} distance={5} />
        </group>
      )}
      {sc.fame !== undefined && (
        <group position={[3.6, 2.1, -6.4]} rotation={[0, -0.5, 0]}>
          <TBox p={[0, 0, 0]} s={[3.3, 2.5, 0.08]} c="#121116" />
          <TBox p={[0, 1.32, 0]} s={[3.5, 0.14, 0.12]} c={GOLD} e={GOLD_E} />
          <TBox p={[0, -1.32, 0]} s={[3.5, 0.14, 0.12]} c={GOLD} e={GOLD_E} />
          {Array.from({ length: 100 }, (_, i) => {
            const on = i < (sc.fame ?? 0);
            return <TBox key={`hf${i}`} p={[-1.35 + (i % 10) * 0.3, 0.95 - Math.floor(i / 10) * 0.21, 0.06]} s={[0.24, 0.13, 0.03]} c={on ? "#e6c65a" : "#2a2830"} e={on ? GOLD_E : undefined} noLine />;
          })}
        </group>
      )}
    </group>
  );
};

// Wow-Effekte: Konfetti, Geldregen, CO2-Säulen, Funkenfontänen, Stroboskop
const ClubFx: React.FC<{ t: number; fx: string[]; beat: number; pulse: number; bps: number }> = ({ t, fx, beat, pulse, bps }) => {
  const parts = useMemo(() => { const r = mulberry(911); return Array.from({ length: 150 }, () => [r(), r(), r(), r(), r()]); }, []);
  const has = (k: string) => fx.includes(k);
  const bar = (t * bps) % 4; // Position im 4er-Takt
  const jet = Math.max(0, 1 - bar / 1.2); // CO2-Stoß auf der Eins, klingt ab
  return (
    <group>
      {(has("confetti") || has("money")) && parts.map(([a, b, c, d, e], i) => {
        const money = has("money") && (!has("confetti") || i % 2 === 0);
        const fall = 0.9 + c * 1.1, y = 4.4 - ((t * fall + a * 5) % 4.5);
        const x = -5 + b * 10 + Math.sin(t * 1.3 + i) * 0.35, z = -7.5 + d * 8.5 + Math.cos(t * 1.1 + i) * 0.3;
        const col = money ? "#3fbf6b" : ["#f3d57a", "#ffffff", "#d4af37", "#ff4d6d", "#ffe9a8"][i % 5];
        return (
          <mesh key={`cf${i}`} position={[x, y, z]} rotation={[t * (2 + e * 4) + i, t * (1.5 + a * 3), i]}>
            <boxGeometry args={money ? [0.2, 0.1, 0.006] : [0.09, 0.05, 0.006]} />
            <meshBasicMaterial color={col} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {has("co2") && [-3.3, -1.7, 1.7, 3.3].map((x, i) => (
        <group key={`co${i}`} position={[x, 0.1, -7.4]}>
          <TBox p={[0, 0.12, 0]} s={[0.26, 0.24, 0.26]} c="#1c1c22" line={0.012} />
          {Array.from({ length: 7 }, (_, k) => (
            <mesh key={k} position={[Math.sin(k * 2.1 + t * 3) * 0.08 * k, 0.4 + k * 0.5 * jet, 0]}>
              <sphereGeometry args={[(0.16 + k * 0.07) * (0.3 + jet), 10, 8]} />
              <meshBasicMaterial color="#f4f8ff" transparent opacity={0.55 * jet} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
      {has("sparks") && [-2.3, 2.3].map((x, i) => (
        <group key={`sp${i}`} position={[x, 1.5, -8.0]}>
          {Array.from({ length: 34 }, (_, k) => {
            const ph = (t * 1.6 + k / 34) % 1, a = k * 2.399, sp = 0.25 + (k % 5) * 0.09;
            return (
              <mesh key={k} position={[Math.cos(a) * sp * ph, ph * 2.6 - ph * ph * 1.5, Math.sin(a) * sp * ph]}>
                <boxGeometry args={[0.03, 0.09, 0.03]} />
                <meshBasicMaterial color={k % 3 ? "#ffd98a" : "#ffffff"} transparent opacity={1 - ph} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            );
          })}
        </group>
      ))}
      {has("strobe") && <pointLight position={[0, 4.2, -3]} color="#ffffff" intensity={beat % 2 === 0 ? 60 * pulse : 0} distance={18} />}
    </group>
  );
};

// Leuchtschrift: Text wird einmal auf eine Canvas gezeichnet und als Textur verwendet
const signCache = new Map<string, THREE.CanvasTexture>();
const signTexture = (text: string, color: string) => {
  const key = text + color;
  if (!signCache.has(key)) {
    const c = document.createElement("canvas");
    c.width = 2048; c.height = 384;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    g.font = "900 250px Anton, Impact, 'Arial Black', 'DejaVu Sans', sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    const w = g.measureText(text).width, sx = Math.min(1, 1900 / w);
    g.save(); g.translate(c.width / 2, c.height / 2 + 10); g.scale(sx, 1);
    g.shadowColor = color; g.shadowBlur = 60; g.fillStyle = color; g.fillText(text, 0, 0);
    g.shadowBlur = 22; g.fillStyle = "#fff8e6"; g.fillText(text, 0, 0);
    g.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4; tex.needsUpdate = true;
    signCache.set(key, tex);
  }
  return signCache.get(key)!;
};

const ClubDoor: React.FC<{ t: number; sc: Scene3D; k?: number }> = ({ t, sc, k = 0 }) => {
  const open = sc.enter ? easeInOut((k - 0.25) / 0.45) : 0; // Tür schwingt auf, wenn die Kamera näher kommt
  const glow = 0.6 + 0.4 * Math.pow(1 - ((t * 122) / 60) % 1, 3);
  const welcome = sc.enter ? easeInOut((k - 0.12) / 0.22) : 0; // Türsteher bittet herein, bevor die Tür aufgeht
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
      <mesh position={[0, 1.3, -2.97]}><planeGeometry args={[1.7, 2.6]} /><meshBasicMaterial color={open > 0.02 ? "#ffbe5c" : "#1a0f04"} fog={false} /></mesh>
      {open > 0.02 && [0, 1, 2, 3, 4].map((i) => <TBox key={`in${i}`} p={[-0.7 + i * 0.35, 0.75 + 0.45 * Math.abs(Math.sin(t * 6 + i)), -2.958]} s={[0.22, 1.3, 0.01]} c={i % 2 ? "#ff5c8a" : "#fff1c8"} e={i % 2 ? "#ff3b6a" : "#ffd27a"} noLine />)}
      {open > 0.02 && <pointLight position={[0, 1.5, -2.2]} color="#ffb060" intensity={30 * open * glow} distance={9} />}
      {([-1, 1] as const).map((sd) => (
        <group key={`leaf${sd}`} position={[sd * 0.85, 1.3, -2.98]} rotation={[0, sd * open * 1.45, 0]}>
          <TBox p={[-sd * 0.425, 0, 0]} s={[0.85, 2.6, 0.08]} c="#0a0a0c" e="#2a1e06" />
          <TBox p={[-sd * 0.425, 0, 0.05]} s={[0.6, 2.2, 0.02]} c="#15151a" noLine />
          <TBox p={[-sd * 0.74, 0, 0.07]} s={[0.05, 0.6, 0.05]} c={GOLD} e={GOLD_E} noLine />
        </group>
      ))}
      <TBox p={[0, 2.75, -2.95]} s={[2.1, 0.12, 0.1]} c={GOLD} e="#c9962a" noLine />
      <TBox p={[-1.02, 1.35, -2.95]} s={[0.12, 2.8, 0.1]} c={GOLD} e="#c9962a" noLine />
      <TBox p={[1.02, 1.35, -2.95]} s={[0.12, 2.8, 0.1]} c={GOLD} e="#c9962a" noLine />
      <TBox p={[0, 3.72, -2.9]} s={[5.5, 1.3, 0.15]} c="#0c0c10" />
      {sc.sign ? (
        <>
          <mesh position={[0, 3.72, -2.7]}><planeGeometry args={[5.2, 0.975]} /><meshBasicMaterial map={signTexture(sc.sign, "#ffcf5a")} transparent opacity={flick > 0.5 ? 1 : 0.6} depthWrite={false} fog={false} /></mesh>
          <TBox p={[0, 4.3, -2.82]} s={[5.3, 0.06, 0.06]} c="#ffe9b8" e="#ffcf7a" noLine />
          <TBox p={[0, 3.14, -2.82]} s={[5.3, 0.06, 0.06]} c="#ffe9b8" e="#ffcf7a" noLine />
          <pointLight position={[0, 3.7, -1.9]} color="#ffcf7a" intensity={10 * flick} distance={6} />
        </>
      ) : (
        <TBox p={[0, 3.7, -2.8]} s={[4.8, 0.12, 0.05]} c="#ffe9b8" e={flick > 0.5 ? "#ffcf7a" : "#5a4010"} noLine />
      )}
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
      <pointLight position={[4.5, 4, -1]} color="#ffd9a0" intensity={16} distance={12} />
      <pointLight position={[-2.6, 2.6, 0.6]} color="#ffe2b0" intensity={14} distance={9} />
      <pointLight position={[0, 1.2, 2.5]} color="#fff0d0" intensity={8} distance={8} />
      {/* Türsteher (groß, schwarz) + Schlange */}
      <Person p={[1.55, 0, -2.2]} ry={Math.PI + 0.45 - 0.35 * welcome} seed={3} t={t} sc={1.28} shirtC="#23232b" look={sc.enter ? 0.25 * welcome : Math.sin(t * 0.8) * 0.3} fancy gesture={welcome} nod={sc.enter ? Math.max(0, Math.sin((k - 0.2) * 14)) * (k > 0.2 && k < 0.65 ? 1 : 0) : 0} />
      {(sc.bouncers ?? 1) >= 2 && <Person p={[-2.75, 0, -2.3]} ry={Math.PI - 0.45} seed={11} t={t} sc={1.22} shirtC="#23232b" look={sc.enter ? 0 : Math.sin(t * 0.6 + 2) * 0.3} fancy nod={sc.enter ? Math.max(0, Math.sin((k - 0.3) * 12)) * (k > 0.3 && k < 0.56 ? 1 : 0) : 0} />}
      {/* Vordach, Pflanzen, Wandlampen, Pfützen-Spiegelung */}
      <TBox p={[0, 3.05, -2.2]} s={[3.2, 0.14, 1.6]} c="#5a0f1e" />
      <TBox p={[0, 2.96, -1.42]} s={[3.2, 0.2, 0.06]} c={GOLD} e="#c9962a" noLine />
      {[-1.7, 1.7].map((x) => (
        <group key={`dp${x}`} position={[x * 1.35, 0, -2.6]}>
          <mesh position={[0, 0.3, 0]} material={toon(GOLD, GOLD_E)}><cylinderGeometry args={[0.24, 0.18, 0.6, 12]} /></mesh>
          <TSphere p={[0, 0.95, 0]} r={0.36} c="#1f5b34" sc={[1, 1.5, 1]} />
        </group>
      ))}
      {[-3.4, 3.4].map((x) => <group key={`wl${x}`}><TBox p={[x, 2.4, -2.95]} s={[0.22, 0.5, 0.12]} c="#ffe9b8" e="#ffcf7a" /><pointLight position={[x, 2.4, -2.3]} color="#ffcf7a" intensity={6} distance={5} /></group>)}
      {Array.from({ length: 8 }, (_, i) => <TBox key={`wn${i}`} p={[-7.8 + i * 2.2, 5.6, -2.94]} s={[0.06, 1.2, 0.03]} c="#0c0c10" noLine />)}
      <mesh position={[0.3, 0.012, 1.0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.5, 24]} /><meshBasicMaterial color="#ffcf7a" transparent opacity={0.1} depthWrite={false} /></mesh>
      {Array.from({ length: q }, (_, i) => <Person key={`q${i}`} p={[-1.75 + Math.sin(i) * 0.12, 0, -1.4 + i * 0.85]} ry={Math.PI} seed={i + 40} t={t} look={Math.sin(t + i) * 0.4} shirtC={SUITS[i % SUITS.length]} fancy />)}
    </group>
  );
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));

export const World3D: React.FC<{ sc: Scene3D; t: number; dur: number; width: number; height: number; shake?: number }> = ({ sc, t, dur, width, height, shake = 0 }) => {
  const k = dur > 0 ? t / dur : 0;
  const yaw = lerp(sc.cam.yaw[0], sc.cam.yaw[1], easeInOut(k));
  const move = sc.cam.move ?? [0, 0, 0];
  const ke = easeInOut(k);
  let pos: V3 = [sc.cam.pos[0] + move[0] * ke, sc.cam.pos[1] + move[1] * ke, sc.cam.pos[2] + move[2] * ke];
  let yawNow = yaw;
  if (sc.cam.orbit) {
    const [cx, cz, rad, a0, a1] = sc.cam.orbit;
    const a = a0 + (a1 - a0) * ke;
    pos = [cx + Math.sin(a) * rad, pos[1], cz + Math.cos(a) * rad];
    yawNow = a; // Kamera schaut immer zur Mitte
  }
  const pitchNow = Array.isArray(sc.cam.pitch) ? lerp(sc.cam.pitch[0], sc.cam.pitch[1], ke) : sc.cam.pitch ?? -0.12;
  const clubBeat = sc.room === "club" ? Math.pow(1 - ((t * (sc.bpm ?? 122)) / 60) % 1, 3) : 0;
  const smokeAmt = lerp(sc.smoke?.[0] ?? 0, sc.smoke?.[1] ?? 0, k);
  const rs = sc.room === "club" ? Number(process.env.REMOTION_CLUB_SCALE ?? 0.75) : 1;
  const alarmPulse = sc.alarm ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0;
  return (
    // Club: Software-Rendering ist bei vielen Gästen langsam → 3D mit 75 % Auflösung rechnen und auf volle Größe skalieren
    <div style={{ position: "absolute", left: 0, top: 0, width: Math.round(width * rs), height: Math.round(height * rs), transform: `scale(${1 / rs})`, transformOrigin: "0 0" }}>
    <ThreeCanvas width={Math.round(width * rs)} height={Math.round(height * rs)} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }}>
      <color attach="background" args={[sc.room === "yard" ? "#9ec9ea" : sc.room === "club" ? "#08070a" : sc.room === "clubdoor" ? "#0a0c14" : sc.dark ? "#1a1c22" : "#dfe6ee"]} />
      <fog attach="fog" args={[sc.room.startsWith("club") ? "#0c0a0c" : sc.dark ? "#22252c" : "#b9bcc2", 2 + (1 - smokeAmt) * 30, 9 + (1 - smokeAmt) * 60]} />
      <ambientLight intensity={sc.room.startsWith("club") ? 0.62 : sc.dark ? 0.22 : 0.75} />
      <directionalLight position={[-6, 5, 2]} intensity={sc.dark ? 0.3 : 1.9} />
      {sc.alarm && <pointLight position={[0, 2.6, pos[2] - 2]} color="#ff2020" intensity={alarmPulse * 7} distance={9} />}
      <HeadCam pos={pos} yaw={yawNow} pitch={pitchNow} t={t} walk={sc.cam.walk ?? 0} shake={shake + clubBeat * 0.05} fov={(sc.fov ?? 98) - clubBeat * 2.5} />
      {sc.room === "classroom" && <Classroom t={t} sc={sc} k={k} />}
      {sc.room === "hallway" && <Hallway t={t} sc={sc} k={k} />}
      {sc.room === "bathroom" && <Bathroom t={t} sc={sc} k={k} />}
      {sc.room === "yard" && <Yard t={t} sc={sc} k={k} />}
      {sc.room === "club" && <Club t={t} sc={sc} />}
      {sc.room === "clubdoor" && <ClubDoor t={t} sc={sc} k={k} />}
      {sc.torch && <pointLight position={[pos[0], pos[1] + 0.5, pos[2] - 2.8]} color="#fff4d8" intensity={3} distance={7} decay={2} />}
    </ThreeCanvas>
    </div>
  );
};

const easeInOut = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
