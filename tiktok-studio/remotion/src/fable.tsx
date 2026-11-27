// „Fabel“-Stil (seit 24.11.2026): ruhige, flache Vektor-Animation, die genau zeigt, was gesagt wird.
// Eine Szene pro Satz, langsamer Kamerazoom, Ein-Wort-Untertitel. Erste Geschichte: die Ratten von Hanoi (1902).
import React from "react";
import { clamp, easeOut, rng } from "./lib";

const W = 1080, H = 1920;
export type Fab = { kind: string; label?: string };

const lerp = (a: number, b: number, k: number) => a + (b - a) * clamp(k);
const ease = (k: number) => { const c = clamp(k); return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2; };

// ---------- Bausteine ----------
const Night: React.FC<{ t: number; moon?: [number, number]; warm?: boolean }> = ({ t, moon = [820, 330], warm }) => {
  const r = rng(11);
  return (
    <g>
      <defs>
        <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={warm ? "#1a1420" : "#0a0f1f"} />
          <stop offset="0.6" stopColor={warm ? "#3a2a2e" : "#18233f"} />
          <stop offset="1" stopColor={warm ? "#5a3b2e" : "#243357"} />
        </linearGradient>
        <radialGradient id="fmoon"><stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#fsky)" />
      {Array.from({ length: 60 }, (_, i) => {
        const x = r() * W, y = r() * 1000, s = 1 + r() * 2.2;
        return <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={0.25 + 0.45 * Math.abs(Math.sin(t * (0.6 + r()) + i))} />;
      })}
      <circle cx={moon[0]} cy={moon[1]} r={210} fill="url(#fmoon)" />
      <circle cx={moon[0]} cy={moon[1]} r={78} fill="#f6f3e6" />
    </g>
  );
};

// Stadt: französische Villen + ein geschwungenes Dach, alles als Silhouette mit warmen Fenstern
const City: React.FC<{ y: number; t: number; dim?: number }> = ({ y, t, dim = 1 }) => (
  <g transform={`translate(0 ${y})`}>
    {[[40, 250, 300], [330, 210, 380], [540, 280, 330], [820, 240, 420]].map(([x, w, h], i) => (
      <g key={i}>
        <rect x={x} y={-h} width={w} height={h} fill="#101726" />
        <path d={`M${x - 14} ${-h} L${x + w / 2} ${-h - 70} L${x + w + 14} ${-h} Z`} fill="#0c1220" />
        {Array.from({ length: 6 }, (_, k) => {
          const on = (i + k) % 3 !== 0;
          return <rect key={k} x={x + 30 + (k % 3) * ((w - 90) / 2)} y={-h + 50 + Math.floor(k / 3) * 110} width={34} height={58} rx={17} fill={on ? "#ffcf7a" : "#1b2438"} opacity={on ? dim * (0.75 + 0.2 * Math.sin(t * 2 + k + i)) : 1} />;
        })}
      </g>
    ))}
    <path d="M250 -120 Q330 -190 410 -120 L395 -110 L265 -110 Z" fill="#0c1220" />
    <rect x={285} y={-112} width={90} height={112} fill="#0c1220" />
    <rect x={0} y={0} width={W} height={30} fill="#0b101c" />
  </g>
);

const Ground: React.FC<{ y: number; c?: string }> = ({ y, c = "#2a3146" }) => (
  <g>
    <rect x={0} y={y} width={W} height={H - y} fill={c} />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-60 + i * 150 + ((i % 2) * 40)} y={y + 60 + (i % 3) * 110} width={110} height={10} rx={5} fill="#ffffff" opacity={0.06} />)}
  </g>
);

// Ratte von der Seite; tail=false → Stummel. run = Laufzyklus
const Rat: React.FC<{ x: number; y: number; s?: number; t: number; tail?: boolean; flip?: boolean; run?: number; c?: string; baby?: boolean; sniff?: boolean }> = ({ x, y, s = 1, t, tail = true, flip, run = 0, c = "#8d8f98", baby, sniff }) => {
  const leg = run ? Math.sin(t * 16) * 14 : 0;
  const bob = run ? Math.abs(Math.sin(t * 16)) * 5 : Math.sin(t * 2.2) * 2;
  const nose = sniff ? Math.sin(t * 9) * 4 : 0;
  const dark = "#6c6e78";
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={18} rx={150} ry={12} fill="#000" opacity={0.25} />
      {tail ? (
        <path d={`M-118 -40 C-200 -60 -230 ${-20 + Math.sin(t * 3) * 14} -300 ${-34 + Math.sin(t * 3 + 1) * 18}`} stroke="#d9a39a" strokeWidth={baby ? 9 : 12} fill="none" strokeLinecap="round" />
      ) : (
        <g>
          <path d="M-118 -40 L-142 -44" stroke="#d9a39a" strokeWidth={13} strokeLinecap="round" />
          <circle cx={-146} cy={-45} r={7} fill="#b3122e" />
        </g>
      )}
      {[-70, -30, 40, 78].map((lx, i) => <rect key={i} x={lx} y={-14} width={14} height={30} rx={6} fill={dark} transform={`rotate(${(i % 2 ? -leg : leg)} ${lx + 7} -14)`} />)}
      <ellipse cx={-20} cy={-52} rx={110} ry={62} fill={c} />
      <ellipse cx={86 + nose} cy={-58} rx={62} ry={44} fill={c} />
      <path d={`M132 ${-66} L${176 + nose} ${-50} L132 ${-34} Z`} fill={c} />
      <circle cx={178 + nose} cy={-50} r={9} fill="#d9a39a" />
      <circle cx={72} cy={-104} r={30} fill={dark} /><circle cx={72} cy={-104} r={17} fill="#d9a39a" />
      <circle cx={112} cy={-70} r={9} fill="#111" /><circle cx={115} cy={-73} r={3} fill="#fff" />
      {[0, 1, 2].map((k) => <line key={k} x1={160 + nose} y1={-46} x2={205 + nose} y2={-58 + k * 12} stroke="#fff" strokeWidth={2} opacity={0.6} />)}
    </g>
  );
};

// Kolonialbeamter: weißer Anzug, Tropenhelm, Schnurrbart
const Officer: React.FC<{ x: number; y: number; s?: number; t: number; arm?: number; flip?: boolean; shock?: number }> = ({ x, y, s = 1, t, arm = 0, flip, shock = 0 }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.6) * 3}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={6} rx={110} ry={14} fill="#000" opacity={0.25} />
    <rect x={-52} y={-190} width={44} height={190} rx={14} fill="#d8d3c4" /><rect x={8} y={-190} width={44} height={190} rx={14} fill="#d8d3c4" />
    <rect x={-58} y={-12} width={56} height={22} rx={8} fill="#2a2018" /><rect x={4} y={-12} width={56} height={22} rx={8} fill="#2a2018" />
    <rect x={-80} y={-470} width={160} height={300} rx={36} fill="#efeadb" />
    {[0, 1, 2, 3].map((k) => <circle key={k} cx={0} cy={-430 + k * 58} r={8} fill="#c9a227" />)}
    <rect x={-112} y={-450} width={40} height={210} rx={18} fill="#efeadb" transform={`rotate(${6} -92 -450)`} />
    <g transform={`rotate(${-arm} 92 -450)`}>
      <rect x={72} y={-450} width={40} height={210} rx={18} fill="#efeadb" />
      <circle cx={92} cy={-232} r={24} fill="#e6b89a" />
    </g>
    <circle cx={0} cy={-540} r={70} fill="#e6b89a" />
    <path d="M-82 -560 Q0 -690 82 -560 Z" fill="#efeadb" /><rect x={-104} y={-566} width={208} height={18} rx={9} fill="#d8d3c4" />
    <circle cx={-24} cy={-540} r={7 + shock * 6} fill="#111" /><circle cx={26} cy={-540} r={7 + shock * 6} fill="#111" />
    <path d="M-34 -506 Q0 -486 34 -506 Q0 -520 -34 -506 Z" fill="#5a3b22" />
    {shock > 0 && <ellipse cx={0} cy={-486} rx={12} ry={12 * shock} fill="#3a1410" />}
  </g>
);

// Einheimischer Rattenjäger: Kegelhut, einfache Kleidung
const Hunter: React.FC<{ x: number; y: number; s?: number; t: number; arm?: number; flip?: boolean; kneel?: boolean }> = ({ x, y, s = 1, t, arm = 0, flip, kneel }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.8 + 1) * 3}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={6} rx={100} ry={13} fill="#000" opacity={0.25} />
    <g transform={kneel ? "translate(0 70)" : undefined}>
      {!kneel && <><rect x={-46} y={-170} width={40} height={170} rx={14} fill="#3b3a46" /><rect x={6} y={-170} width={40} height={170} rx={14} fill="#3b3a46" /></>}
      {kneel && <rect x={-70} y={-70} width={150} height={48} rx={20} fill="#3b3a46" />}
      <rect x={-72} y={-420} width={144} height={270} rx={34} fill="#7a5a3a" />
      <rect x={-104} y={-404} width={38} height={190} rx={17} fill="#7a5a3a" transform="rotate(8 -85 -404)" />
      <g transform={`rotate(${-arm} 85 -404)`}>
        <rect x={66} y={-404} width={38} height={190} rx={17} fill="#7a5a3a" />
        <circle cx={85} cy={-200} r={22} fill="#c99873" />
      </g>
      <circle cx={0} cy={-482} r={62} fill="#c99873" />
      <path d="M-120 -500 L0 -600 L120 -500 Z" fill="#d9c08a" /><path d="M-120 -500 L120 -500 L96 -488 L-96 -488 Z" fill="#b89a5a" />
      <circle cx={-20} cy={-474} r={6} fill="#111" /><circle cx={22} cy={-474} r={6} fill="#111" />
    </g>
  </g>
);

const Coin: React.FC<{ x: number; y: number; r?: number; t: number; spin?: boolean }> = ({ x, y, r = 44, t, spin }) => (
  <g transform={`translate(${x} ${y}) scale(${spin ? Math.abs(Math.cos(t * 4)) * 0.85 + 0.15 : 1} 1)`}>
    <circle r={r} fill="#d4af37" stroke="#8a6d12" strokeWidth={6} />
    <text x={0} y={r * 0.34} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={r} fill="#8a6d12">1</text>
  </g>
);

const CutTail: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-70 0 C-30 -22 20 20 70 -6" stroke="#d9a39a" strokeWidth={13} fill="none" strokeLinecap="round" />
    <circle cx={-72} cy={1} r={7} fill="#b3122e" />
  </g>
);

const Grate: React.FC<{ x: number; y: number; t: number; eyes?: number }> = ({ x, y, t, eyes = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={0} rx={170} ry={46} fill="#07090f" />
    {[-110, -55, 0, 55, 110].map((gx) => <rect key={gx} x={gx - 7} y={-40} width={14} height={80} rx={6} fill="#394055" />)}
    {Array.from({ length: eyes }, (_, i) => {
      const ex = -120 + i * (240 / Math.max(1, eyes - 1)), blink = Math.sin(t * 2 + i * 1.7) > -0.85 ? 1 : 0.1;
      return <g key={i} opacity={blink}><circle cx={ex - 9} cy={-4 + (i % 2) * 10} r={5} fill="#ffd23f" /><circle cx={ex + 9} cy={-4 + (i % 2) * 10} r={5} fill="#ffd23f" /></g>;
    })}
  </g>
);

const Label: React.FC<{ text: string; t: number; y?: number }> = ({ text, t, y = 420 }) => (
  <text x={W / 2} y={y} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={800} fontSize={74} letterSpacing={6} fill="#dfe6f5" opacity={easeOut(t / 0.5) * 0.9}>{text}</text>
);


// ---------- Bausteine für „Die Löcher im Flugzeug“ (Abraham Wald, 1943) ----------
const HOLES: [number, number][] = [[-250, 30], [-205, 44], [-170, 12], [-268, 48], [-140, 30], [230, 22], [262, 46], [186, 40], [150, 10], [215, 52], [-12, 60], [14, 96], [-8, 130], [10, 20], [-16, -70], [12, -100], [-60, 186], [58, 190], [-90, 198], [0, 176], [96, 196], [-228, 14], [244, 34], [8, 150]];
const ENGINES: [number, number][] = [[-210, -24], [-110, -30], [110, -30], [210, -24]];

// Bomber von oben (Nase zeigt nach oben). holes = wie viele Treffer sichtbar sind, ghost = nur Umriss (nicht zurückgekehrt)
const Plane: React.FC<{ x: number; y: number; s?: number; rot?: number; t: number; holes?: number; ghost?: boolean; armor?: "body" | "engines"; engineHits?: boolean; c?: string }> = ({ x, y, s = 1, rot = 0, t, holes = 0, ghost, armor, engineHits, c = "#8a9a6a" }) => {
  const fill = ghost ? "none" : c, dark = ghost ? "none" : "#6b7a50";
  const st = ghost ? { stroke: "#dfe6f5", strokeWidth: 5, strokeDasharray: "18 14", opacity: 0.75 } : {};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {!ghost && <ellipse cx={26} cy={40} rx={300} ry={90} fill="#000" opacity={0.18} />}
      <path d="M-310 20 L-40 -40 L40 -40 L310 20 L310 62 L40 42 L-40 42 L-310 62 Z" fill={fill} {...st} />
      <path d="M-112 180 L0 150 L112 180 L112 206 L-112 206 Z" fill={fill} {...st} />
      {ENGINES.map(([ex, ey], i) => (
        <g key={i}>
          <ellipse cx={ex} cy={ey} rx={22} ry={50} fill={dark} {...st} />
          {!ghost && <ellipse cx={ex} cy={ey - 50} rx={46} ry={7} fill="#dfe6f5" opacity={0.35 + 0.25 * Math.sin(t * 40 + i)} />}
        </g>
      ))}
      <ellipse cx={0} cy={0} rx={36} ry={214} fill={fill} {...st} />
      {!ghost && <ellipse cx={0} cy={-150} rx={18} ry={30} fill="#bfe0ff" opacity={0.85} />}
      {!ghost && <g><circle cx={-190} cy={36} r={22} fill="#fff" opacity={0.9} /><path d="M-190 18 L-185 32 L-170 32 L-182 41 L-178 55 L-190 46 L-202 55 L-198 41 L-210 32 L-195 32 Z" fill="#2a3a6a" /></g>}
      {armor === "body" && <g opacity={0.92}>{[[-225, 34, 150, 50], [150, 34, 150, 50], [-30, 20, 60, 150], [-90, 172, 180, 34]].map(([ax, ay, aw, ah], i) => <rect key={i} x={ax} y={ay - 14} width={aw} height={ah} rx={8} fill="#c9ced6" stroke="#5a6170" strokeWidth={5} />)}</g>}
      {armor === "engines" && ENGINES.map(([ex, ey], i) => <rect key={`a${i}`} x={ex - 30} y={ey - 58} width={60} height={112} rx={12} fill="#d4af37" stroke="#8a6d12" strokeWidth={5} opacity={0.95} />)}
      {HOLES.slice(0, holes).map(([hx, hy], i) => <g key={`h${i}`}><circle cx={hx} cy={hy} r={13} fill="#1a0b0b" /><circle cx={hx} cy={hy} r={13} fill="none" stroke="#e23b2e" strokeWidth={5} /></g>)}
      {engineHits && ENGINES.map(([ex, ey], i) => <g key={`e${i}`} opacity={0.6 + 0.4 * Math.sin(t * 6 + i)}><circle cx={ex} cy={ey} r={20} fill="#e23b2e" /><circle cx={ex} cy={ey} r={34} fill="none" stroke="#e23b2e" strokeWidth={5} /></g>)}
    </g>
  );
};

const DaySky: React.FC<{ t: number; dusk?: boolean; speed?: number }> = ({ t, dusk, speed = 1 }) => (
  <g>
    <defs><linearGradient id="fday" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={dusk ? "#2a2f4a" : "#3f6f9f"} /><stop offset="1" stopColor={dusk ? "#8a5a4a" : "#9fc4e0"} /></linearGradient></defs>
    <rect width={W} height={H} fill="url(#fday)" />
    {Array.from({ length: 7 }, (_, i) => {
      const cy = ((i * 330 + t * 420 * speed) % (H + 400)) - 200, cx = 120 + ((i * 397) % 900);
      return <g key={i} opacity={0.55}><ellipse cx={cx} cy={cy} rx={170} ry={46} fill="#fff" /><ellipse cx={cx + 90} cy={cy - 26} rx={110} ry={40} fill="#fff" /></g>;
    })}
  </g>
);

const Hangar: React.FC = () => (
  <g>
    <rect width={W} height={H} fill="#2b2f3a" />
    {Array.from({ length: 8 }, (_, i) => <line key={i} x1={0} y1={420 + i * 190} x2={W} y2={420 + i * 190} stroke="#ffffff" strokeWidth={3} opacity={0.05} />)}
    {Array.from({ length: 5 }, (_, i) => <line key={`v${i}`} x1={120 + i * 210} y1={0} x2={120 + i * 210} y2={H} stroke="#ffffff" strokeWidth={3} opacity={0.05} />)}
    <rect x={0} y={0} width={W} height={150} fill="#1b1e27" />
    {[220, 540, 860].map((lx) => <g key={lx}><rect x={lx - 60} y={150} width={120} height={22} rx={8} fill="#ffe9b8" /><path d={`M${lx - 60} 172 L${lx - 330} 1500 L${lx + 330} 1500 L${lx + 60} 172 Z`} fill="#ffe9b8" opacity={0.045} /></g>)}
  </g>
);

// einfache stehende Figur: Offizier (Uniform, Mütze) oder Mathematiker (dunkler Anzug, Brille)
const Man: React.FC<{ x: number; y: number; s?: number; t: number; coat: string; cap?: boolean; glasses?: boolean; arm?: number; shake?: boolean; flip?: boolean }> = ({ x, y, s = 1, t, coat, cap, glasses, arm = 0, shake, flip }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.7) * 3}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={6} rx={100} ry={13} fill="#000" opacity={0.3} />
    <rect x={-48} y={-180} width={42} height={180} rx={14} fill="#2a2d38" /><rect x={6} y={-180} width={42} height={180} rx={14} fill="#2a2d38" />
    <rect x={-76} y={-450} width={152} height={290} rx={34} fill={coat} />
    <path d="M-20 -450 L0 -400 L20 -450 Z" fill="#f4f1ea" /><rect x={-5} y={-420} width={10} height={70} fill={cap ? "#3a3f2a" : "#7a1027"} />
    <rect x={-108} y={-432} width={38} height={200} rx={17} fill={coat} transform="rotate(7 -89 -432)" />
    <g transform={`rotate(${-arm} 89 -432)`}><rect x={70} y={-432} width={38} height={200} rx={17} fill={coat} /><circle cx={89} cy={-224} r={22} fill="#e6b89a" /></g>
    <g transform={`rotate(${shake ? Math.sin(t * 7) * 9 : 0} 0 -470)`}>
      <circle cx={0} cy={-516} r={66} fill="#e6b89a" />
      {cap ? <g><path d="M-74 -540 Q0 -640 74 -540 Z" fill={coat} /><rect x={-80} y={-548} width={170} height={18} rx={9} fill="#2a2d38" /></g> : <path d="M-66 -530 Q-60 -600 0 -596 Q60 -600 66 -530 Q30 -566 -66 -530 Z" fill="#3a3028" />}
      <circle cx={-22} cy={-516} r={6} fill="#111" /><circle cx={24} cy={-516} r={6} fill="#111" />
      {glasses && <g fill="none" stroke="#111" strokeWidth={5}><circle cx={-22} cy={-516} r={18} /><circle cx={24} cy={-516} r={18} /><line x1={-4} y1={-516} x2={6} y2={-516} /></g>}
      <path d="M-18 -480 Q2 -472 22 -480" stroke="#7a3a2a" strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  </g>
);


// ---------- Bausteine für „Fünf Raketen“ (Stanislaw Petrow, 1983) ----------
const Missile: React.FC<{ x: number; y: number; s?: number; rot?: number; c?: string }> = ({ x, y, s = 1, rot = 0, c = "#e23b2e" }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0 -46 Q16 -20 14 24 L-14 24 Q-16 -20 0 -46 Z" fill={c} />
    <path d="M-14 10 L-28 30 L-14 26 Z M14 10 L28 30 L14 26 Z" fill={c} />
    <path d="M-8 26 L0 50 L8 26 Z" fill="#ffd23f" />
  </g>
);

// Kontrollraum: großer Bildschirm, Pulte, roter Alarm
const ControlRoom: React.FC<{ t: number; alarm?: boolean; n?: number; clear?: boolean; children?: React.ReactNode }> = ({ t, alarm, n = 0, clear, children }) => {
  const blink = alarm ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
  return (
    <g>
      <rect width={W} height={H} fill="#0c1018" />
      <rect x={90} y={420} width={900} height={600} rx={22} fill="#06090f" stroke={alarm ? "#e23b2e" : "#2f4a3a"} strokeWidth={10} />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={90} y1={480 + i * 60} x2={990} y2={480 + i * 60} stroke="#39ff8f" strokeWidth={2} opacity={0.08} />)}
      <path d="M150 900 Q330 620 540 700 Q760 780 930 560" fill="none" stroke="#39ff8f" strokeWidth={4} opacity={0.35} strokeDasharray="14 12" />
      {clear && <text x={540} y={760} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={110} fill="#39ff8f" opacity={0.85}>— — —</text>}
      {Array.from({ length: n }, (_, i) => <g key={i} opacity={0.7 + 0.3 * Math.sin(t * 8 + i)}><Missile x={250 + i * 145} y={lerp(900, 640, ((t * 0.25 + i * 0.13) % 1))} s={1.5} rot={25} /></g>)}
      {alarm && <rect x={300} y={440} width={480} height={86} rx={12} fill="#e23b2e" opacity={0.35 + 0.65 * blink} />}
      {alarm && <text x={540} y={504} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={64} fill="#fff" opacity={0.6 + 0.4 * blink}>START</text>}
      <rect x={0} y={1420} width={W} height={H} fill="#141a26" />
      <rect x={60} y={1340} width={960} height={110} rx={16} fill="#1d2636" />
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={120 + i * 65} cy={1395} r={12} fill={alarm && i % 3 === 0 ? "#e23b2e" : i % 4 === 1 ? "#ffd23f" : "#39ff8f"} opacity={0.4 + 0.5 * Math.abs(Math.sin(t * 3 + i))} />)}
      {children}
      {alarm && <rect width={W} height={H} fill="#e23b2e" opacity={0.1 * blink} />}
    </g>
  );
};

// ---------- Szenen ----------
export const FableScene: React.FC<{ fab: Fab; t: number; dur: number }> = ({ fab, t, dur }) => {
  const k = dur > 0 ? clamp(t / dur) : 0;
  const zoom = 1.0 + 0.07 * k;
  let body: React.ReactNode = null;
  const G = 1380; // Bodenlinie

  switch (fab.kind) {
    case "rat-notail": // Hook: eine Ratte ohne Schwanz, nah, schnuppert – dann dreht sie sich um und läuft los
      body = (
        <g>
          <Night t={t} moon={[800, 360]} />
          <City y={G - 40} t={t} dim={0.5} />
          <Ground y={G - 10} />
          <Rat x={lerp(520, 600, ease(k))} y={G + 240} s={1.9} t={t} tail={false} sniff />
          <Grate x={250} y={G + 430} t={t} eyes={3} />
        </g>
      );
      break;
    case "city": // Hanoi 1902: Villen oben, darunter der Kanal mit vielen Augen
      body = (
        <g>
          <Night t={t} moon={[240, 300]} />
          <City y={G - 200} t={t} />
          <Ground y={G - 170} c="#232a3d" />
          <rect x={0} y={G + 120} width={W} height={H} fill="#0b0e17" />
          <rect x={0} y={G + 100} width={W} height={34} fill="#394055" />
          {Array.from({ length: 14 }, (_, i) => {
            const ex = 70 + (i % 7) * 150 + (Math.floor(i / 7) * 60), ey = G + 220 + Math.floor(i / 7) * 150 + (i % 3) * 22;
            const on = clamp((t - 1.2 - i * 0.12) / 0.2), blink = Math.sin(t * 2.4 + i) > -0.8 ? 1 : 0.1;
            return <g key={i} opacity={on * blink}><circle cx={ex - 11} cy={ey} r={6} fill="#ffd23f" /><circle cx={ex + 11} cy={ey} r={6} fill="#ffd23f" /></g>;
          })}
          {fab.label && <Label text={fab.label} t={t - 0.2} y={470} />}
        </g>
      );
      break;
    case "bounty": { // Beamter hält eine Münze hoch, daneben ein Schwanz = 1 Cent
      const up = ease((t - 0.6) / 0.6);
      body = (
        <g>
          <Night t={t} moon={[860, 300]} warm />
          <City y={G - 60} t={t} dim={0.6} />
          <Ground y={G - 30} c="#3a2f33" />
          <Officer x={360} y={G + 330} s={1.15} t={t} arm={lerp(0, 150, up)} />
          <g opacity={clamp((t - 1.3) / 0.4)}>
            <CutTail x={640} y={G - 150} rot={-8} s={1.5} />
            <text x={790} y={G - 128} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={110} fill="#fff">=</text>
            <Coin x={920} y={G - 160} r={70} t={t} spin />
          </g>
        </g>
      );
      break;
    }
    case "pile": { // Schwänze stapeln sich, Münzen auch
      const n = Math.floor(lerp(0, 46, ease(k * 1.15)));
      const r = rng(5);
      body = (
        <g>
          <Night t={t} moon={[200, 320]} warm />
          <Ground y={G - 30} c="#3a2f33" />
          <rect x={90} y={G + 120} width={900} height={40} rx={10} fill="#5a4030" /><rect x={130} y={G + 160} width={30} height={260} fill="#4a3426" /><rect x={920} y={G + 160} width={30} height={260} fill="#4a3426" />
          {Array.from({ length: 46 }, (_, i) => {
            const px = 220 + r() * 330, py = G + 110 - Math.floor(i / 5) * 26 - r() * 10, rot = (r() - 0.5) * 70;
            return i < n ? <CutTail key={i} x={px} y={py} rot={rot} s={0.9} /> : null;
          })}
          {Array.from({ length: Math.floor(n / 3) }, (_, i) => <g key={`c${i}`} transform={`translate(${760 + (i % 3) * 78} ${G + 104 - Math.floor(i / 3) * 16})`}><ellipse rx={36} ry={12} fill="#d4af37" stroke="#8a6d12" strokeWidth={4} /></g>)}
          <Officer x={900} y={G + 110} s={0.62} t={t} arm={20} flip />
          <Hunter x={150} y={G + 110} s={0.62} t={t} arm={lerp(20, 90, Math.abs(Math.sin(t * 2.5)))} />
        </g>
      );
      break;
    }
    case "spot": { // Beamter starrt: eine lebende Ratte ohne Schwanz läuft über die Straße
      const rx = lerp(1250, -200, ease((t - 0.8) / Math.max(1.5, dur - 1.2)));
      body = (
        <g>
          <Night t={t} moon={[780, 300]} />
          <City y={G - 60} t={t} dim={0.5} />
          <Ground y={G - 30} />
          <Officer x={260} y={G + 250} s={1.0} t={t} shock={clamp((t - 1.4) / 0.3)} />
          <Rat x={rx} y={G + 420} s={1.25} t={t} tail={false} run={1} flip />
        </g>
      );
      break;
    }
    case "release": { // Jäger kniet am Kanal und lässt die Ratte ohne Schwanz frei; unten warten Junge mit Schwänzen
      const go = ease((t - 1.0) / 1.4);
      body = (
        <g>
          <Night t={t} moon={[230, 320]} />
          <Ground y={G - 30} />
          <Hunter x={250} y={G + 150} s={1.05} t={t} arm={lerp(60, 20, go)} kneel />
          <CutTail x={420} y={G + 40} rot={lerp(-20, 10, go)} s={1.1} />
          <Grate x={760} y={G + 330} t={t} eyes={4} />
          <g opacity={1 - clamp((go - 0.85) / 0.15)}><Rat x={lerp(430, 760, go)} y={lerp(G + 190, G + 330, go)} s={lerp(0.95, 0.55, go)} t={t} tail={false} run={go > 0 && go < 1 ? 1 : 0} /></g>
          {[0, 1, 2].map((i) => <g key={i} opacity={clamp((t - 2.6 - i * 0.35) / 0.4)}><Rat x={620 + i * 150} y={G + 500 + (i % 2) * 34} s={0.42} t={t + i} baby c="#a3a5ad" /></g>)}
        </g>
      );
      break;
    }
    case "farm": { // Rattenfarm: Käfige, es werden immer mehr
      const n = Math.floor(lerp(2, 12, ease(k * 1.2)));
      body = (
        <g>
          <Night t={t} moon={[840, 280]} warm />
          <path d={`M0 ${G - 120} L260 ${G - 300} L560 ${G - 150} L820 ${G - 330} L${W} ${G - 180} L${W} ${G} L0 ${G} Z`} fill="#141a2a" />
          <Ground y={G - 30} c="#33302c" />
          {Array.from({ length: 12 }, (_, i) => {
            const cx = 150 + (i % 4) * 260, cy = G + 150 + Math.floor(i / 4) * 170;
            return i < n ? (
              <g key={i} opacity={easeOut((k * 12 * 1.2 - i + 2) / 1.5)}>
                <Rat x={cx - 6} y={cy + 30} s={0.34} t={t + i} flip={i % 2 === 0} />
                <rect x={cx - 100} y={cy - 70} width={200} height={110} rx={10} fill="none" stroke="#b89a5a" strokeWidth={8} />
                {[-60, -20, 20, 60].map((b) => <line key={b} x1={cx + b} y1={cy - 70} x2={cx + b} y2={cy + 40} stroke="#b89a5a" strokeWidth={5} />)}
              </g>
            ) : null;
          })}
        </g>
      );
      break;
    }
    case "plane-fly": { // Hook: Bomber im Flug, Leuchtspur zischt vorbei, ein Treffer nach dem anderen
      const n = Math.floor(lerp(3, 24, clamp(t / Math.max(1.5, dur - 0.4))));
      body = (
        <g>
          <DaySky t={t} dusk />
          {Array.from({ length: 9 }, (_, i) => {
            const ph = ((t * 2.6 + i * 0.37) % 1), tx = 140 + ((i * 271) % 800);
            return <line key={i} x1={tx} y1={lerp(-100, H + 200, ph)} x2={tx + 26} y2={lerp(-100, H + 200, ph) + 150} stroke="#ffd98a" strokeWidth={7} strokeLinecap="round" opacity={0.85} />;
          })}
          <Plane x={540 + Math.sin(t * 1.3) * 26} y={1240 + Math.sin(t * 2.1) * 14} s={1.5} rot={Math.sin(t * 1.3) * 3} t={t} holes={n} />
          {n < 24 && <circle cx={540 + HOLES[Math.min(23, n)][0] * 1.5} cy={1240 + HOLES[Math.min(23, n)][1] * 1.5} r={50 * (1 - ((t * 7) % 1))} fill="#fff" opacity={0.8} />}
        </g>
      );
      break;
    }
    case "return": // 1943: drei zerschossene Bomber auf dem Heimweg
      body = (
        <g>
          <DaySky t={t} speed={0.6} />
          <Plane x={540} y={lerp(1560, 1380, k)} s={1.05} t={t} holes={24} />
          <Plane x={250} y={lerp(1150, 980, k)} s={0.6} t={t + 1} holes={15} />
          <Plane x={840} y={lerp(1060, 880, k)} s={0.6} t={t + 2} holes={19} />
          {fab.label && <Label text={fab.label} t={t - 0.2} y={470} />}
        </g>
      );
      break;
    case "count": { // im Hangar: Offizier zeigt auf die Treffer, Kreise markieren Flügel und Rumpf
      const m = clamp((t - 1.2) / 0.5);
      body = (
        <g>
          <Hangar />
          <Plane x={540} y={1250} s={1.45} t={0} holes={Math.floor(lerp(0, 24, clamp(t / 1.6)))} />
          {[[205, 1300, 190], [875, 1300, 190], [540, 1400, 150]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r * easeOut((t - 1.6 - i * 0.5) / 0.4)} fill="none" stroke="#ffd23f" strokeWidth={9} strokeDasharray="26 16" opacity={clamp((t - 1.6 - i * 0.5) / 0.2)} />)}
          <Man x={190} y={1880} s={0.8} t={t} coat="#5a6a3a" cap arm={lerp(10, 120, m)} />
        </g>
      );
      break;
    }
    case "armor": // der Plan: Panzerplatten genau dort, wo die Löcher sind
      body = (
        <g>
          <Hangar />
          <Plane x={540} y={1250} s={1.45} t={0} holes={24} armor={t > 1.0 ? "body" : undefined} />
          {t > 1.0 && t < 1.25 && <rect width={W} height={H} fill="#fff" opacity={0.5 * (1 - (t - 1.0) / 0.25)} />}
          <Man x={190} y={1880} s={0.8} t={t} coat="#5a6a3a" cap arm={120} />
        </g>
      );
      break;
    case "wald": { // der Mathematiker schüttelt den Kopf; ein rotes X über dem Plan
      const xk = easeOut((t - 1.0) / 0.35);
      body = (
        <g>
          <Hangar />
          <Plane x={640} y={1180} s={1.1} t={0} holes={24} armor="body" />
          <g opacity={clamp((t - 1.0) / 0.15)} stroke="#e23b2e" strokeWidth={34} strokeLinecap="round"><line x1={640 - 300 * xk} y1={1180 - 300 * xk} x2={640 + 300 * xk} y2={1180 + 300 * xk} /><line x1={640 + 300 * xk} y1={1180 - 300 * xk} x2={640 - 300 * xk} y2={1180 + 300 * xk} /></g>
          <Man x={230} y={1890} s={1.0} t={t} coat="#2f3340" glasses shake={t > 0.5 && t < 2.2} />
        </g>
      );
      break;
    }
    case "lost": // die Flugzeuge, die fehlen: nur Umrisse, getroffen am Motor
      body = (
        <g>
          <Night t={t} moon={[860, 300]} />
          <rect x={0} y={1500} width={W} height={H} fill="#0b101c" />
          <g opacity={clamp(1.6 - t)}><Plane x={540} y={1180} s={1.25} t={t} holes={24} /></g>
          <g opacity={clamp((t - 1.2) / 0.6)}>
            <Plane x={540} y={1180} s={1.25} t={t} ghost engineHits={t > 3.2} />
            <Plane x={210} y={720} s={0.5} t={t} ghost engineHits={t > 3.6} />
            <Plane x={860} y={760} s={0.5} t={t} ghost engineHits={t > 3.9} />
          </g>
        </g>
      );
      break;
    case "fix": // die Lösung: Panzerung an den Motoren – der Bomber fliegt weiter
      body = (
        <g>
          <DaySky t={t} speed={0.8} />
          <Plane x={540} y={lerp(1420, 1180, ease(k))} s={1.45} t={t} holes={10} armor="engines" />
        </g>
      );
      break;
    case "missing": { // Lehre: eine Reihe zurückgekehrter Flugzeuge – dazwischen die, die fehlen
      body = (
        <g>
          <Night t={t} moon={[540, 330]} />
          <rect x={0} y={1560} width={W} height={H} fill="#0b101c" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const gx = 200 + (i % 3) * 340, gy = 880 + Math.floor(i / 3) * 420, gh = i === 1 || i === 3 || i === 5;
            return <g key={i} opacity={gh ? clamp((t - 1.4 - i * 0.2) / 0.6) : 1}><Plane x={gx} y={gy} s={0.48} t={t + i} holes={gh ? 0 : 20} ghost={gh} /></g>;
          })}
        </g>
      );
      break;
    }
    case "alarm": // Hook: fünf Raketen auf dem Schirm, der Offizier sitzt davor und rührt sich nicht
      body = <ControlRoom t={t} alarm n={5}><Man x={540} y={1900} s={1.15} t={t} coat="#4a5a3a" cap /></ControlRoom>;
      break;
    case "bunker": // 1983: Bunker bei Nacht im Schnee, Radarschüssel dreht sich
      body = (
        <g>
          <Night t={t} moon={[820, 320]} />
          <path d={`M0 1260 L220 1120 L460 1230 L720 1090 L${W} 1220 L${W} ${H} L0 ${H} Z`} fill="#121a2c" />
          <rect x={0} y={1420} width={W} height={H} fill="#dfe6f2" />
          <path d="M260 1430 Q540 1200 820 1430 Z" fill="#2a3246" /><rect x={470} y={1340} width={140} height={90} fill="#0c1018" /><rect x={500} y={1360} width={80} height={70} fill="#ffcf7a" opacity={0.8} />
          <rect x={690} y={1150} width={14} height={190} fill="#6b7386" />
          <g transform={`translate(697 1150) scale(${Math.cos(t * 1.2)} 1)`}><path d="M-90 -40 Q0 40 90 -40 Z" fill="#aab3c6" /><line x1={0} y1={-10} x2={0} y2={-70} stroke="#aab3c6" strokeWidth={6} /></g>
          {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 137 + t * 30) % W} cy={(i * 211 + t * (90 + (i % 5) * 20)) % H} r={3 + (i % 3)} fill="#fff" opacity={0.7} />)}
          {fab.label && <Label text={fab.label} t={t - 0.2} y={520} />}
        </g>
      );
      break;
    case "five": // die Sirene heult: erst eine Rakete, dann fünf
      body = <ControlRoom t={t} alarm={t > 0.8} n={t < 0.8 ? 0 : t < 3.6 ? 1 : Math.min(5, 1 + Math.floor((t - 3.6) / 0.35))}><Man x={300} y={1900} s={0.95} t={t} coat="#4a5a3a" cap shake={t > 1 && t < 2} /></ControlRoom>;
      break;
    case "phone": { // seine Aufgabe: melden – der Hörer liegt bereit, die Uhr läuft
      const sec = Math.floor(t * 4);
      body = (
        <ControlRoom t={t} alarm n={5}>
          <Man x={300} y={1900} s={0.95} t={t} coat="#4a5a3a" cap arm={lerp(0, 70, ease((t - 0.6) / 0.8))} />
          <g transform="translate(760 1560)"><rect x={-150} y={-60} width={300} height={170} rx={24} fill="#b3122e" /><rect x={-170} y={-110} width={340} height={56} rx={28} fill="#7a0c1e" transform={`rotate(${Math.sin(t * 14) * 3})`} /><circle cx={0} cy={30} r={46} fill="#1a0b0b" /><circle cx={0} cy={30} r={12} fill="#b3122e" /></g>
          <text x={760} y={1300} textAnchor="middle" fontFamily="'DejaVu Sans Mono', monospace" fontWeight={700} fontSize={90} fill="#ffd23f">00:{String(sec % 60).padStart(2, "0")}</text>
        </ControlRoom>
      );
      break;
    }
    case "logic": { // fünf Raketen? Wer angreift, schickt Hunderte
      const m = Math.floor(lerp(0, 120, ease((t - 2.2) / 1.6)));
      body = (
        <g>
          <rect width={W} height={H} fill="#0c1018" />
          {[0, 1, 2, 3, 4].map((i) => <Missile key={i} x={260 + i * 140} y={620} s={1.8} c="#e23b2e" />)}
          <text x={540} y={800} textAnchor="middle" fontFamily="Anton, sans-serif" fontSize={120} fill="#fff">5</text>
          <line x1={120} y1={900} x2={960} y2={900} stroke="#ffffff" strokeWidth={4} opacity={0.2} />
          {Array.from({ length: m }, (_, i) => <Missile key={`h${i}`} x={110 + (i % 15) * 61} y={1010 + Math.floor(i / 15) * 86} s={0.75} c="#8a93a6" />)}
          <Man x={540} y={1960} s={0.6} t={t} coat="#4a5a3a" cap />
        </g>
      );
      break;
    }
    case "wait": // er meldet Fehlalarm – und wartet. Der Schirm bleibt leer, draußen bleibt es still
      body = (
        <ControlRoom t={t} clear={t > 1.2} alarm={t < 1.2} n={t < 1.2 ? 5 : 0}>
          <Man x={300} y={1900} s={0.95} t={t} coat="#4a5a3a" cap />
          <g transform="translate(780 1250)"><circle r={120} fill="#0c1018" stroke="#dfe6f5" strokeWidth={10} /><line x1={0} y1={0} x2={0} y2={-84} stroke="#dfe6f5" strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 60})`} /><line x1={0} y1={0} x2={50} y2={0} stroke="#ffd23f" strokeWidth={8} strokeLinecap="round" /></g>
        </ControlRoom>
      );
      break;
    case "sun": // der Grund: Sonnenlicht auf Wolken, vom Satelliten für Raketen gehalten
      body = (
        <g>
          <Night t={t} moon={[-300, -300]} />
          <circle cx={900} cy={380} r={140} fill="#ffe9a8" /><circle cx={900} cy={380} r={260} fill="#ffe9a8" opacity={0.15} />
          <g transform={`translate(${lerp(200, 300, k)} 620) rotate(-18)`}><rect x={-50} y={-34} width={100} height={68} rx={10} fill="#aab3c6" /><rect x={-190} y={-22} width={130} height={44} fill="#3a5a9a" /><rect x={60} y={-22} width={130} height={44} fill="#3a5a9a" /><circle cx={0} cy={44} r={16} fill="#dfe6f5" /></g>
          <path d={`M900 380 L${lerp(420, 520, k)} 1150 L${lerp(280, 380, k)} 660`} fill="none" stroke="#ffe9a8" strokeWidth={10} opacity={0.5 + 0.4 * Math.sin(t * 6)} strokeDasharray="30 18" />
          {[[240, 1180, 1.3], [620, 1260, 1.6], [900, 1160, 1.1]].map(([cx, cy, sc], i) => <g key={i} transform={`translate(${cx} ${cy}) scale(${sc})`}><ellipse rx={170} ry={50} fill="#dfe6f2" /><ellipse cx={80} cy={-34} rx={110} ry={44} fill="#fff" /><ellipse cx={-70} cy={-22} rx={90} ry={36} fill="#f4f7fb" /></g>)}
          <circle cx={lerp(420, 520, k)} cy={1150} r={30 + 16 * Math.sin(t * 6)} fill="#fff" opacity={0.9} />
          <path d={`M0 1500 Q540 1380 ${W} 1500 L${W} ${H} L0 ${H} Z`} fill="#18305a" />
        </g>
      );
      break;
    case "saved": // Lehre: die Stadt steht noch, der Mann geht nach Hause
      body = (
        <g>
          <Night t={t} moon={[540, 420]} />
          <City y={1420} t={t} />
          <rect x={0} y={1420} width={W} height={H} fill="#0b101c" />
          <Man x={lerp(700, 560, k)} y={1900} s={0.9} t={t} coat="#101622" cap flip />
        </g>
      );
      break;
    default: { // "moral": eine Ratte als Silhouette vor dem Mond, die Stadt klein darunter
      body = (
        <g>
          <Night t={t} moon={[540, 1040]} />
          <circle cx={540} cy={1040} r={lerp(190, 215, k)} fill="#f6f3e6" />
          <City y={G + 120} t={t} dim={0.7} />
          <rect x={0} y={G + 120} width={W} height={H} fill="#0b101c" />
          <path d={`M0 ${G - 40} Q540 ${G - 190} ${W} ${G - 40} L${W} ${G + 130} L0 ${G + 130} Z`} fill="#0b101c" />
          <g opacity={0.96}><Rat x={540} y={G - 108} s={1.15} t={t} tail={false} c="#0b101c" sniff /></g>
        </g>
      );
    }
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g transform={`translate(${W / 2} ${H * 0.62}) scale(${zoom}) translate(${-W / 2} ${-H * 0.62})`}>{body}</g>
    </svg>
  );
};

// Ein-Wort-Untertitel wie in der Referenz: klein, ruhig, weiß; Schlüsselwörter in warmem Gold
export const OneWord: React.FC<{ words: { w: string; s: number; e: number }[]; time: number; y?: number }> = ({ words, time, y = 800 }) => {
  let idx = -1;
  for (let i = 0; i < words.length; i++) if (time >= words[i].s - 0.03) idx = i;
  if (idx < 0) return null;
  const w = words[idx];
  if (time > w.e + 0.7) return null;
  const txt = w.w.replace(/^[„"]|[“"]$/g, "");
  const key = /\d/.test(txt) || /[.!?]$/.test(txt);
  const pop = 0.9 + 0.1 * easeOut((time - w.s) / 0.1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", transform: `scale(${pop})` }}>
      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 68, color: key ? "#ffd98a" : "#fff", textShadow: "0 3px 0 #000, 0 0 18px #000, 0 6px 24px #000c" }}>{txt}</span>
    </div>
  );
};
