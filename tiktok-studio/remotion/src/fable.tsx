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
