import React from "react";
import { H, W, SKY, Tod, rng, shade, todFrom, clamp, lerp, easeOut } from "./lib";

export type SceneProps = { flags: string[]; t: number; g: number; accent: string; seed: number };

/* ------------------------------------------------------------------ Bausteine */

const Grad: React.FC<{ id: string; stops: string[]; x2?: number; y2?: number }> = ({ id, stops, x2 = 0, y2 = 1 }) => (
  <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
    {stops.map((c, i) => (
      <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
    ))}
  </linearGradient>
);

const Glow: React.FC<{ id: string; color: string; o?: number }> = ({ id, color, o = 1 }) => (
  <radialGradient id={id}>
    <stop offset="0" stopColor={color} stopOpacity={o} />
    <stop offset="1" stopColor={color} stopOpacity={0} />
  </radialGradient>
);

export const Stars: React.FC<{ seed: number; n?: number; g: number; h?: number; o?: number }> = ({ seed, n = 140, g, h = H, o = 1 }) => {
  const r = rng(seed);
  return (
    <g opacity={o}>
      {Array.from({ length: n }).map((_, i) => {
        const x = r() * W, y = r() * h, s = r() * 2.2 + 0.4, ph = r() * 6.28;
        const tw = 0.55 + 0.45 * Math.sin(g * (1 + r() * 2) + ph);
        return <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={tw} />;
      })}
    </g>
  );
};

export const Sky: React.FC<{ tod: Tod; seed: number; g: number; moon?: boolean; sun?: boolean; horizon?: number }> = ({ tod, seed, g, moon = true, sun = true, horizon = 1300 }) => {
  const c = SKY[tod];
  const id = `sky${seed}`;
  return (
    <g>
      <defs>
        <Grad id={id} stops={c} />
        <Glow id={id + "s"} color={tod === "day" ? "#fff6c9" : "#ffd29a"} o={0.9} />
      </defs>
      <rect width={W} height={horizon + 40} fill={`url(#${id})`} />
      {(tod === "night" || tod === "dawn") && <Stars seed={seed} g={g} h={horizon} o={tod === "night" ? 1 : 0.35} />}
      {tod === "night" && moon && (
        <g transform="translate(820 330)">
          <circle r="120" fill="#ffffff" opacity="0.06" />
          <circle r="62" fill="#f1f1e6" />
          <circle cx="-18" cy="-12" r="12" fill="#d8d8cc" />
          <circle cx="20" cy="18" r="8" fill="#d8d8cc" />
        </g>
      )}
      {(tod === "day" || tod === "sunset" || tod === "dusk") && sun && (
        <g transform={`translate(${tod === "day" ? 800 : 540} ${tod === "day" ? 300 : horizon - 120})`}>
          <circle r={tod === "day" ? 260 : 360} fill={`url(#${id}s)`} />
          <circle r={tod === "day" ? 70 : 110} fill={tod === "day" ? "#fff8dc" : "#ffcf8a"} />
        </g>
      )}
    </g>
  );
};

export const Clouds: React.FC<{ seed: number; g: number; n?: number; color?: string; y0?: number; y1?: number; o?: number }> = ({ seed, g, n = 5, color = "#ffffff", y0 = 200, y1 = 800, o = 0.8 }) => {
  const r = rng(seed + 7);
  return (
    <g opacity={o}>
      {Array.from({ length: n }).map((_, i) => {
        const y = lerp(y0, y1, r()), sp = 6 + r() * 14, w = 200 + r() * 260;
        const x = ((r() * (W + 600) + g * sp) % (W + 600)) - 300;
        return (
          <g key={i} transform={`translate(${x} ${y})`} fill={color}>
            <ellipse cx={0} cy={0} rx={w * 0.5} ry={w * 0.14} />
            <ellipse cx={-w * 0.18} cy={-w * 0.08} rx={w * 0.2} ry={w * 0.13} />
            <ellipse cx={w * 0.12} cy={-w * 0.1} rx={w * 0.24} ry={w * 0.16} />
          </g>
        );
      })}
    </g>
  );
};

/* Kleine Spielfigur "DU" – flacher Look, von hinten/seitlich */
export const You: React.FC<{ x?: number; y?: number; s?: number; g: number; accent: string; tone?: string; shock?: boolean }> = ({ x = 540, y = 1560, s = 1, g, accent, tone = "#f2c7a5", shock = false }) => {
  const breathe = Math.sin(g * 2.2) * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="6" rx="70" ry="14" fill="#000" opacity="0.25" />
      <rect x="-30" y="-120" width="24" height="122" rx="10" fill="#2c3e57" />
      <rect x="6" y="-120" width="24" height="122" rx="10" fill="#26364c" />
      <rect x="-34" y="-2" width="30" height="12" rx="6" fill="#eee" />
      <rect x="4" y="-2" width="30" height="12" rx="6" fill="#eee" />
      <g transform={`translate(0 ${breathe})`}>
        <rect x="-52" y="-260" width="104" height="160" rx="40" fill={accent} />
        <rect x="-66" y="-250" width="30" height="120" rx="14" fill={shade(accent, -0.15)} transform="rotate(8 -51 -250)" />
        <rect x="36" y="-250" width="30" height="120" rx="14" fill={shade(accent, -0.15)} transform="rotate(-8 51 -250)" />
        <circle cx="0" cy="-310" r="56" fill={tone} />
        <path d="M-58 -318 Q-50 -380 0 -378 Q52 -380 58 -318 Q40 -340 0 -342 Q-36 -340 -58 -318 Z" fill="#3b2a20" />
        {shock ? (
          <>
            <circle cx="-18" cy="-308" r="11" fill="#fff" /><circle cx="18" cy="-308" r="11" fill="#fff" />
            <circle cx="-18" cy="-306" r="5" fill="#1b1b1b" /><circle cx="18" cy="-306" r="5" fill="#1b1b1b" />
            <path d="M-32 -332 L -8 -326 M 32 -332 L 8 -326" stroke="#3b2a20" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="0" cy="-278" rx="11" ry="15" fill="#5a2020" />
          </>
        ) : (
          <>
            <ellipse cx="-17" cy="-308" rx="6" ry="8" fill="#1b1b1b" />
            <ellipse cx="17" cy="-308" rx="6" ry="8" fill="#1b1b1b" />
            <path d="M-12 -282 Q0 -276 12 -282" stroke="#7a4a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </g>
  );
};

function Fire({ x, y, s = 1, g, seed }: { x: number; y: number; s?: number; g: number; seed: number }) {
  const r = rng(seed);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2].map((k) => {
        const f = 1 + 0.12 * Math.sin(g * (9 + k * 3) + r() * 6);
        const col = ["#ff3d00", "#ff9100", "#ffd54f"][k];
        const sc = [1, 0.7, 0.42][k];
        return (
          <path key={k} transform={`scale(${sc} ${sc * f})`} d="M0 0 C-60 -20 -50 -90 -20 -130 C-15 -90 10 -100 0 -170 C50 -120 70 -40 0 0 Z" fill={col} />
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ CITY */

export const City: React.FC<SceneProps> = ({ flags, g, seed, accent }) => {
  const tod = todFrom(flags, "day");
  const blackout = flags.includes("blackout");
  const flood = flags.includes("flood");
  const ghost = flags.includes("ghost");
  const forest = flags.includes("forest");
  const blocks = flags.includes("blocks");
  const ruins = flags.includes("ruins");
  const night = tod === "night";
  const r = rng(seed);
  const horizon = 1340;
  const far = Array.from({ length: 14 }).map((_, i) => ({ x: i * 82 - 20, w: 70 + r() * 40, h: 220 + r() * 320 }));
  const nearN = blocks ? 5 : 9;
  const near = Array.from({ length: nearN }).map((_, i) => {
    const w = blocks ? 240 : 110 + r() * 70;
    return { x: (i * W) / nearN - 30 + r() * 20, w, h: blocks ? 360 + r() * 120 : 300 + r() * 420 };
  });
  const wallC = night ? "#141c2e" : tod === "dusk" ? "#3a2c45" : tod === "dawn" ? "#4a4a66" : "#7f93a8";
  const farC = night ? "#0d1322" : tod === "dusk" ? "#2c2038" : "#9fb3c6";
  const lit = night || tod === "dusk";
  return (
    <g>
      <Sky tod={tod} seed={seed} g={g} moon={!flags.includes("nomoon")} horizon={horizon} />
      {flags.includes("aurora") && (
        <g opacity={0.55}>
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M-50 ${380 + k * 70} C 250 ${250 + 60 * Math.sin(g + k)}, 700 ${520 - 50 * Math.cos(g * 0.8 + k)}, 1130 ${300 + k * 50}`} stroke={k === 1 ? "#a0ffb0" : "#3cffa0"} strokeWidth={70 - k * 15} fill="none" opacity={0.5} strokeLinecap="round" />
          ))}
        </g>
      )}
      {tod !== "night" && <Clouds seed={seed} g={g} color={tod === "day" ? "#fff" : "#f6b8a0"} o={tod === "day" ? 0.85 : 0.35} />}
      {flags.includes("fire") && (
        <g>
          <defs><Glow id={"cf" + seed} color="#ff5a1f" o={0.8} /></defs>
          <ellipse cx="540" cy={horizon - 80} rx="900" ry="500" fill={`url(#cf${seed})`} />
        </g>
      )}
      {flags.includes("ash") && <rect width={W} height={horizon} fill="#6b6259" opacity="0.55" />}
      {/* ferne Silhouette */}
      {far.map((b, i) => (
        <rect key={i} x={b.x} y={horizon - b.h} width={b.w} height={b.h} fill={farC} />
      ))}
      {flags.includes("wheel") && (
        <g transform={`translate(800 ${horizon - 330})`} stroke={night ? "#222b3d" : "#4a3a4a"} strokeWidth="8" fill="none">
          <circle r="230" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="0" y1="0" x2={230 * Math.cos((i * Math.PI) / 6)} y2={230 * Math.sin((i * Math.PI) / 6)} />
          ))}
          <line x1="-120" y1="330" x2="0" y2="0" />
          <line x1="120" y1="330" x2="0" y2="0" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={230 * Math.cos((i * Math.PI) / 6) - 18} y={230 * Math.sin((i * Math.PI) / 6)} width="36" height="30" fill={night ? "#222b3d" : "#d4a017"} stroke="none" />
          ))}
        </g>
      )}
      {/* nahe Gebäude */}
      {near.map((b, i) => {
        const top = horizon + 40 - b.h;
        const cols = Math.floor(b.w / 34), rows = Math.floor((b.h - 40) / 46);
        const rr = rng(seed + i * 13);
        const jag = ruins ? `M${b.x} ${top + 40} l${b.w * 0.2} -30 l${b.w * 0.15} 50 l${b.w * 0.25} -40 l${b.w * 0.2} 60 l${b.w * 0.2} -20 V${horizon + 40} H${b.x} Z` : null;
        return (
          <g key={i}>
            {jag ? <path d={jag} fill={wallC} /> : <rect x={b.x} y={top} width={b.w} height={b.h} fill={wallC} />}
            {!ruins && <rect x={b.x} y={top} width={b.w} height="14" fill={shade(wallC.startsWith("#") ? wallC : "#555555", -0.25)} />}
            {Array.from({ length: rows }).map((_, ry) =>
              Array.from({ length: cols }).map((_, cx) => {
                const on = lit && !blackout && !ghost && rr() > 0.35;
                const broken = ghost && rr() > 0.6;
                return (
                  <rect key={`${ry}-${cx}`} x={b.x + 12 + cx * 34} y={top + 30 + ry * 46} width="20" height="28" rx="2"
                    fill={broken ? "#0a0a0a" : on ? (rr() > 0.5 ? "#ffd27a" : "#ffe9b0") : night || blackout ? "#0b1020" : shade("#9fc4e0", tod === "day" ? 0 : -0.5)}
                    opacity={on ? 0.95 : 0.8} />
                );
              })
            )}
          </g>
        );
      })}
      {forest && (
        <g>
          {Array.from({ length: 22 }).map((_, i) => {
            const x = (i * 53 + r() * 40) % W, h = 120 + r() * 240;
            return (
              <g key={i} transform={`translate(${x} ${horizon + 40})`}>
                <rect x="-6" y={-h * 0.4} width="12" height={h * 0.4} fill="#3b2a1a" />
                <ellipse cx="0" cy={-h * 0.6} rx={h * 0.28} ry={h * 0.35} fill={i % 2 ? "#2f6b3a" : "#3f8a48"} />
              </g>
            );
          })}
          {near.map((b, i) => (
            <path key={i} d={`M${b.x + 10} ${horizon + 40} C ${b.x + 40} ${horizon - 100}, ${b.x - 10} ${horizon - 200}, ${b.x + 30} ${horizon + 40 - b.h * 0.8}`} stroke="#3f8a48" strokeWidth="14" fill="none" />
          ))}
        </g>
      )}
      {/* Straße */}
      <rect x="0" y={horizon + 40} width={W} height={H - horizon} fill={night ? "#0b0f18" : tod === "dusk" ? "#251b2c" : "#545e6a"} />
      <rect x="0" y={horizon + 40} width={W} height="16" fill={night ? "#1a2233" : "#7c8794"} />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={i * 200 + 40} y={horizon + 230} width="110" height="12" fill={night ? "#2a3244" : "#c9cdd2"} opacity="0.6" />
      ))}
      {flags.includes("snow") && (
        <g>
          <rect x="0" y={horizon + 30} width={W} height={H - horizon} fill="#e8f0ff" opacity="0.9" />
          {near.map((b, i) => <rect key={i} x={b.x - 4} y={horizon + 30 - b.h} width={b.w + 8} height="16" rx="8" fill="#f4f8ff" />)}
        </g>
      )}
      {flags.includes("buses") && (
        <g>
          {Array.from({ length: 5 }).map((_, i) => {
            const x = ((i * 260 + g * 60) % (W + 400)) - 300;
            return (
              <g key={i} transform={`translate(${x} ${horizon + 150})`}>
                <rect width="230" height="96" rx="14" fill="#e3b505" />
                {[0, 1, 2, 3].map((k) => <rect key={k} x={18 + k * 52} y="14" width="40" height="32" rx="4" fill="#3a4a5c" />)}
                <circle cx="46" cy="98" r="16" fill="#222" />
                <circle cx="186" cy="98" r="16" fill="#222" />
              </g>
            );
          })}
        </g>
      )}
      {flood && (
        <g>
          <defs><Grad id={"fl" + seed} stops={night ? ["#1b3550", "#0a1828"] : ["#5c86a8", "#2c4c66"]} /></defs>
          <path d={`M0 ${horizon - 60 + 8 * Math.sin(g * 2)} ${Array.from({ length: 12 }).map((_, i) => `Q ${i * 90 + 45} ${horizon - 75 + 10 * Math.sin(g * 2 + i)} ${(i + 1) * 90} ${horizon - 60 + 8 * Math.sin(g * 2 + i + 1)}`).join(" ")} V ${H} H 0 Z`} fill={`url(#fl${seed})`} opacity="0.96" />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={(i * 150 + g * 30) % W} y={horizon + 40 + i * 60} width="90" height="5" rx="3" fill="#cfe6ff" opacity="0.35" />
          ))}
        </g>
      )}
      {flags.includes("heli") && (
        <g transform={`translate(${200 + ((g * 50) % 700)} ${520 + 20 * Math.sin(g)})`}>
          <ellipse rx="80" ry="38" fill="#2f3b2f" />
          <rect x="60" y="-10" width="120" height="16" fill="#2f3b2f" />
          <rect x={-130 + (g * 3000) % 20} y="-52" width="260" height="6" fill="#111" />
          <rect x="-50" y="38" width="100" height="6" fill="#111" />
          <path d="M-20 -10 L -60 400" stroke="#fff4b0" strokeWidth="2" opacity="0.6" />
        </g>
      )}
      {night && blackout && <rect width={W} height={H} fill="#000" opacity="0.35" />}
      {accent && null}
    </g>
  );
};

/* ------------------------------------------------------------------ OLDTOWN (Altstadt, Pompeji, London, Lissabon) */

export const OldTown: React.FC<SceneProps> = ({ flags, g, seed }) => {
  const tod = flags.includes("ash") ? "storm" : todFrom(flags, "day");
  const fire = flags.includes("fire");
  const quake = flags.includes("quake");
  const ruins = flags.includes("ruins");
  const snow = flags.includes("snow");
  const r = rng(seed + 3);
  const horizon = 1360;
  const palette = ["#d9a066", "#c97c5d", "#e8c39e", "#b36a5e", "#d4b483", "#a3785b"];
  const houses = Array.from({ length: 6 }).map((_, i) => ({ x: i * 185 - 20, w: 190 + r() * 30, h: 420 + r() * 260, c: palette[Math.floor(r() * palette.length)] }));
  const night = tod === "night";
  return (
    <g>
      <Sky tod={tod} seed={seed} g={g} horizon={horizon} />
      {tod === "day" && <Clouds seed={seed} g={g} />}
      {fire && (
        <g>
          <defs><Glow id={"of" + seed} color="#ff6a00" o={0.9} /></defs>
          <ellipse cx="540" cy={horizon - 200} rx="1000" ry="700" fill={`url(#of${seed})`} />
          <Clouds seed={seed + 1} g={g * 2} color="#2b211d" o={0.7} y0={200} y1={700} n={7} />
        </g>
      )}
      {flags.includes("ash") && <rect width={W} height={horizon} fill="#5e5650" opacity="0.6" />}
      {/* Kirche/Turm im Hintergrund */}
      <g fill={night ? "#121725" : fire ? "#3a1e14" : "#8d7f73"} opacity={0.85}>
        <rect x="660" y={horizon - 760} width="120" height="760" />
        <path d={`M640 ${horizon - 760} L720 ${horizon - 960} L800 ${horizon - 760} Z`} />
        <rect x="250" y={horizon - 520} width="260" height="520" />
        <path d={`M240 ${horizon - 520} L380 ${horizon - 640} L520 ${horizon - 520} Z`} />
      </g>
      {houses.map((h, i) => {
        const top = horizon + 40 - h.h;
        const tilt = quake ? Math.sin(g * 30 + i) * 2.5 : ruins ? (i % 2 ? 4 : -3) : 0;
        const c = night ? shade(h.c, -0.7) : fire ? shade(h.c, -0.35) : h.c;
        const roof = night ? "#1a1416" : "#7b3b2b";
        return (
          <g key={i} transform={`rotate(${tilt} ${h.x + h.w / 2} ${horizon + 40})`}>
            {ruins ? (
              <path d={`M${h.x} ${horizon + 40} V${top + 120} l${h.w * 0.3} -60 l${h.w * 0.2} 90 l${h.w * 0.3} -40 l${h.w * 0.2} 70 V${horizon + 40} Z`} fill={shade(h.c, -0.45)} />
            ) : (
              <>
                <rect x={h.x} y={top} width={h.w} height={h.h} fill={c} stroke={shade(h.c, -0.5)} strokeWidth="3" />
                <path d={`M${h.x - 14} ${top} L${h.x + h.w / 2} ${top - 150} L${h.x + h.w + 14} ${top} Z`} fill={roof} />
                {snow && <path d={`M${h.x - 14} ${top} L${h.x + h.w / 2} ${top - 150} L${h.x + h.w + 14} ${top} L${h.x + h.w} ${top - 18} L${h.x + h.w / 2} ${top - 128} L${h.x} ${top - 18} Z`} fill="#f4f8ff" />}
                {/* Fachwerk */}
                <line x1={h.x} y1={top + h.h * 0.33} x2={h.x + h.w} y2={top + h.h * 0.33} stroke={shade(h.c, -0.5)} strokeWidth="6" />
                <line x1={h.x} y1={top + h.h * 0.66} x2={h.x + h.w} y2={top + h.h * 0.66} stroke={shade(h.c, -0.5)} strokeWidth="6" />
                {[0, 1].map((row) =>
                  [0, 1].map((col) => {
                    const on = (night || tod === "dusk") && r() > 0.3;
                    return <rect key={`${row}${col}`} x={h.x + 30 + col * (h.w - 100)} y={top + 40 + row * h.h * 0.33} width="40" height="60" fill={on ? "#ffcf6e" : "#2b2b33"} stroke={shade(h.c, -0.5)} strokeWidth="4" />;
                  })
                )}
                <rect x={h.x + h.w / 2 - 28} y={horizon + 40 - 110} width="56" height="110" rx="26" fill="#3b2418" />
              </>
            )}
            {fire && i % 2 === 0 && <Fire x={h.x + h.w / 2} y={top - (ruins ? -100 : 60)} s={1.6} g={g} seed={seed + i} />}
            {quake && i % 3 === 1 && <path d={`M${h.x + 40} ${top + 60} l30 60 l-20 40 l40 70 l-15 50`} stroke="#1a1a1a" strokeWidth="5" fill="none" />}
          </g>
        );
      })}
      {/* Pflaster */}
      <rect x="0" y={horizon + 40} width={W} height={H - horizon} fill={night ? "#15131a" : snow ? "#e9eef7" : "#8a7a6a"} />
      {!snow && Array.from({ length: 60 }).map((_, i) => (
        <rect key={i} x={(i % 10) * 110 + ((Math.floor(i / 10) % 2) * 55)} y={horizon + 60 + Math.floor(i / 10) * 90} width="96" height="70" rx="14" fill={night ? "#1d1a22" : "#9a8a78"} />
      ))}
      {ruins && <rect width={W} height={H} fill="#4a3f38" opacity="0.25" />}
    </g>
  );
};

/* ------------------------------------------------------------------ VOLCANO */

export const Volcano: React.FC<SceneProps> = ({ flags, g, t, seed }) => {
  const plume = flags.includes("plume") || flags.includes("super") || flags.includes("collapse");
  const sup = flags.includes("super");
  const collapse = flags.includes("collapse");
  const calm = flags.includes("calm");
  const tod: Tod = collapse || sup ? "storm" : calm ? "day" : "dusk";
  const horizon = 1380;
  const r = rng(seed);
  const grow = easeOut(t / 6);
  return (
    <g>
      <Sky tod={tod} seed={seed} g={g} horizon={horizon} sun={calm} />
      {calm && <Clouds seed={seed} g={g} />}
      {(sup || collapse) && (
        <g>
          <defs><Glow id={"vg" + seed} color="#ff3b00" o={0.7} /></defs>
          <ellipse cx="540" cy={horizon - 300} rx="900" ry="600" fill={`url(#vg${seed})`} />
        </g>
      )}
      {/* Rauchsäule */}
      {plume && (
        <g>
          {Array.from({ length: sup ? 26 : 18 }).map((_, i) => {
            const k = i / (sup ? 26 : 18);
            const y = horizon - 520 - k * 900 * (0.5 + 0.5 * grow);
            const spread = k > 0.75 ? (sup ? 520 : 380) * (k - 0.6) * 2.2 : 70 + k * 120;
            const x = 540 + (r() - 0.5) * spread + 20 * Math.sin(g * 0.6 + i);
            const rad = 90 + k * (sup ? 200 : 140) + r() * 40;
            return <circle key={i} cx={x} cy={y} r={rad} fill={i % 2 ? "#4a403b" : "#5b524b"} opacity="0.95" />;
          })}
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={"t" + i} cx={540 + (i - 5) * 70 * (sup ? 1.6 : 1)} cy={horizon - 520 - 900 * (0.5 + 0.5 * grow) - 40 + (i % 3) * 30} r={150 + (i % 4) * 30} fill="#6a605a" />
          ))}
        </g>
      )}
      {calm && (
        <g opacity="0.7">
          {[0, 1, 2].map((i) => <circle key={i} cx={540 + i * 20} cy={horizon - 560 - i * 60 - ((g * 20) % 60)} r={30 + i * 14} fill="#f5f5f5" />)}
        </g>
      )}
      {/* Berg */}
      <path d={`M-100 ${horizon + 40} L 430 ${horizon - 520} Q 540 ${horizon - 560} 650 ${horizon - 520} L 1180 ${horizon + 40} Z`} fill={calm ? "#6d5a4b" : "#3a2c25"} />
      <path d={`M 430 ${horizon - 520} Q 540 ${horizon - 560} 650 ${horizon - 520} L 610 ${horizon - 470} Q 540 ${horizon - 500} 470 ${horizon - 470} Z`} fill={calm ? "#e8e4dc" : "#ff5a1f"} opacity={calm ? 1 : 0.9} />
      {!calm && (
        <g opacity={0.85}>
          <path d={`M520 ${horizon - 500} C 500 ${horizon - 380}, 560 ${horizon - 260}, 470 ${horizon - 120}`} stroke="#ff7b1c" strokeWidth="14" fill="none" />
          <path d={`M580 ${horizon - 500} C 620 ${horizon - 360}, 660 ${horizon - 220}, 760 ${horizon - 60}`} stroke="#ff9b2c" strokeWidth="10" fill="none" />
        </g>
      )}
      {/* Glutwolke rollt den Hang hinab */}
      {collapse && (
        <g>
          {Array.from({ length: 14 }).map((_, i) => {
            const p = clamp(t / 5);
            const x = lerp(560, -200, p) + i * 60;
            const y = lerp(horizon - 480, horizon - 40, p) + Math.sin(i) * 40;
            return <circle key={i} cx={x} cy={y} r={120 + i * 8} fill={i % 2 ? "#8a7466" : "#a08878"} opacity="0.95" />;
          })}
        </g>
      )}
      {/* Vordergrund */}
      <path d={`M0 ${horizon + 20} Q 300 ${horizon - 30} 600 ${horizon + 10} T 1080 ${horizon} V ${H} H 0 Z`} fill={calm ? "#4f6b3a" : "#241a16"} />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={60 + i * 115} y={horizon + 30 - (40 + (i % 3) * 20)} width="70" height={40 + (i % 3) * 20} fill={calm ? "#c9b79c" : "#1a1310"} />
      ))}
      <path d={`M0 ${H} L 0 ${horizon + 260} Q 540 ${horizon + 180} ${W} ${horizon + 250} L ${W} ${H} Z`} fill={calm ? "#3e5a2c" : "#1a1210"} />
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 40 + i * 160, h = 150 + (i % 3) * 50, y = horizon + 250 - (i % 2) * 20;
        return (
          <g key={"h" + i}>
            <rect x={x} y={y - h} width="120" height={h} fill={calm ? "#d8c4a4" : "#3a2a22"} />
            <path d={`M${x - 10} ${y - h} L ${x + 60} ${y - h - 70} L ${x + 130} ${y - h} Z`} fill={calm ? "#9b4a32" : "#2a1d18"} />
            <rect x={x + 20} y={y - h + 30} width="30" height="40" fill={calm ? "#5a4a3a" : "#ffb347"} opacity={calm ? 1 : 0.85} />
            <rect x={x + 70} y={y - h + 30} width="30" height="40" fill={calm ? "#5a4a3a" : "#ffb347"} opacity={calm ? 1 : 0.6} />
          </g>
        );
      })}
      {Array.from({ length: 5 }).map((_, i) => (
        <g key={"c" + i} transform={`translate(${100 + i * 220} ${horizon + 330})`}>
          <rect x="-8" y="-120" width="16" height="120" fill={calm ? "#5a3f2a" : "#140d0a"} />
          <ellipse cx="0" cy="-150" rx="70" ry="40" fill={calm ? "#3f7a3a" : "#120c0a"} />
        </g>
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ OCEAN */

const Liner: React.FC<{ x: number; y: number; tilt?: number; night?: boolean }> = ({ x, y, tilt = 0, night }) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
    <path d="M-420 0 L 400 0 L 360 90 L -380 90 Z" fill="#141414" />
    <rect x="-400" y="-60" width="780" height="60" fill="#f3f0e6" />
    <rect x="-360" y="-110" width="660" height="50" fill="#e8e3d4" />
    {[-250, -110, 30, 170].map((fx, i) => (
      <g key={i}>
        <rect x={fx} y="-260" width="56" height="150" fill="#d98c2b" />
        <rect x={fx} y="-260" width="56" height="34" fill="#151515" />
      </g>
    ))}
    {Array.from({ length: 30 }).map((_, i) => (
      <circle key={i} cx={-380 + i * 25} cy="-30" r="5" fill={night ? "#ffd27a" : "#3a3a3a"} />
    ))}
    <rect x="-400" y="40" width="760" height="6" fill="#8b1d1d" />
  </g>
);

export const Ocean: React.FC<SceneProps> = ({ flags, g, t, seed }) => {
  const storm = flags.includes("storm");
  const tod: Tod = storm ? "storm" : todFrom(flags, "day");
  const night = tod === "night";
  const retreat = flags.includes("retreat");
  const horizon = retreat ? 1180 : 1080;
  const sea = night ? ["#0a1a2c", "#030a14"] : storm ? ["#2c3e4c", "#141f28"] : tod === "sunset" ? ["#b0563f", "#2c1d33"] : tod === "dawn" ? ["#5d6f8f", "#1f2b44"] : ["#2f86c4", "#0d3b66"];
  const ice = flags.includes("ice");
  return (
    <g>
      <Sky tod={tod} seed={seed} g={g} horizon={horizon} />
      {!night && !storm && <Clouds seed={seed} g={g} y1={horizon - 300} o={tod === "day" ? 0.85 : 0.4} color={tod === "day" ? "#fff" : "#f2a07b"} />}
      {storm && <Clouds seed={seed} g={g * 3} color="#1b232c" o={0.9} n={8} y0={100} y1={700} />}
      {flags.includes("island") && (
        <g>
          <path d={`M180 ${horizon + 4} L 470 ${horizon - 230} L 620 ${horizon - 250} L 900 ${horizon + 4} Z`} fill="#2e3b2c" />
          {flags.includes("erupt") ? (
            <g>
              {Array.from({ length: 16 }).map((_, i) => {
                const k = i / 16, grow = easeOut(t / 2.5);
                return <circle key={i} cx={545 + Math.sin(i * 2.1) * (60 + k * 260)} cy={horizon - 250 - k * 900 * grow} r={80 + k * 180} fill={i % 2 ? "#4b413c" : "#5d534c"} />;
              })}
              <defs><Glow id={"oe" + seed} color="#ff4b00" /></defs>
              <circle cx="545" cy={horizon - 250} r="260" fill={`url(#oe${seed})`} />
            </g>
          ) : (
            <circle cx="545" cy={horizon - 300 - ((g * 15) % 50)} r="34" fill="#ddd" opacity="0.6" />
          )}
        </g>
      )}
      {flags.includes("harbor") && (
        <g fill="#3e2f25">
          <rect x="0" y={horizon - 30} width={W} height="40" fill="#6b5a48" />
          {[120, 520, 860].map((x, i) => (
            <g key={i} transform={`translate(${x} ${horizon - 30})`}>
              <path d="M-90 0 L 90 0 L 70 40 L -70 40 Z" />
              <rect x="-4" y="-260" width="8" height="260" />
              <path d="M4 -250 L 80 -60 L 4 -60 Z" fill="#e8dcc0" />
            </g>
          ))}
        </g>
      )}
      <defs><Grad id={"sea" + seed} stops={sea} /></defs>
      {retreat ? (
        <g>
          <rect x="0" y={horizon} width={W} height={H - horizon} fill="#8c7a5c" />
          <rect x="0" y={horizon} width={W} height="80" fill={`url(#sea${seed})`} />
          {Array.from({ length: 12 }).map((_, i) => <ellipse key={i} cx={(i * 97) % W} cy={horizon + 200 + (i % 5) * 120} rx="40" ry="12" fill="#6e5e46" />)}
          <path d={`M200 ${horizon + 500} l120 -40 l140 30 l-20 60 l-220 0 Z`} fill="#4a3a2a" />
        </g>
      ) : (
        <rect x="0" y={horizon} width={W} height={H - horizon} fill={`url(#sea${seed})`} />
      )}
      {!retreat && Array.from({ length: 18 }).map((_, i) => {
        const y = horizon + 30 + i * 46 + i * i * 1.6;
        const amp = (storm ? 18 : 6) + i * (storm ? 1.6 : 0.6);
        const ph = g * (storm ? 2.6 : 1.2) + i * 0.7;
        return (
          <path key={i} d={`M -20 ${y} ${Array.from({ length: 8 }).map((_, k) => `Q ${k * 160 + 80} ${y + amp * Math.sin(ph + k)} ${(k + 1) * 160} ${y}`).join(" ")}`} stroke={night ? "#2a4766" : storm ? "#5b6f80" : "#8fc7ef"} strokeWidth={2 + i * 0.25} fill="none" opacity={0.5} />
        );
      })}
      {ice && <path d={`M0 ${horizon + 60} L 300 ${horizon + 40} L 620 ${horizon + 80} L 1080 ${horizon + 50} V ${H} H 0 Z`} fill="#dce9f5" opacity="0.92" />}
      {flags.includes("iceberg") && (
        <g transform={`translate(${880 - t * 20} ${horizon + 40})`}>
          <path d="M-160 0 L -90 -260 L -30 -200 L 20 -320 L 110 -120 L 170 0 Z" fill="#e6f2fb" />
          <path d="M20 -320 L 110 -120 L 170 0 L 40 0 Z" fill="#b8d3e8" />
        </g>
      )}
      {flags.includes("liner") && <Liner x={480} y={horizon + 150} night={night} />}
      {flags.includes("sinking") && (
        <g>
          <Liner x={540} y={horizon + 200 + t * 30} tilt={-18 - t * 3} night />
          <rect x="0" y={horizon + 140} width={W} height={H - horizon} fill={`url(#sea${seed})`} opacity="0.85" />
        </g>
      )}
      {flags.includes("boats") && Array.from({ length: 4 }).map((_, i) => (
        <g key={i} transform={`translate(${150 + i * 230 + Math.sin(g + i) * 10} ${horizon + 420 + (i % 2) * 120 + Math.sin(g * 1.5 + i) * 6})`}>
          <path d="M-70 0 L 70 0 L 50 30 L -50 30 Z" fill="#f0eadc" />
          {[-40, -10, 20, 45].map((px, k) => <circle key={k} cx={px} cy="-12" r="11" fill="#2a2a2a" />)}
        </g>
      ))}
      {flags.includes("capsule") && (
        <g transform={`translate(540 ${horizon + 120 + Math.sin(g * 1.4) * 8})`}>
          <path d="M-70 40 L -40 -60 L 40 -60 L 70 40 Z" fill="#c9c9c9" />
          <rect x="-90" y="36" width="180" height="20" rx="10" fill="#ff8c00" />
          {[-1, 0, 1].map((k) => (
            <g key={k} transform={`translate(${k * 240} ${-560 + 120 * (1 - easeOut(t / 4))})`}>
              <path d="M-110 0 Q 0 -120 110 0 Z" fill={k === 0 ? "#f2f2f2" : "#e86a2a"} />
              <line x1="-110" y1="0" x2={-k * 240} y2="500" stroke="#ccc" strokeWidth="2" />
              <line x1="110" y1="0" x2={-k * 240} y2="500" stroke="#ccc" strokeWidth="2" />
            </g>
          ))}
        </g>
      )}
      {flags.includes("wave") && (
        <g transform={`translate(${lerp(500, -60, easeOut(t / 4))} 0)`}>
          <path d={`M 300 ${H} L 300 ${horizon + 40} Q 500 ${horizon - 700} 1000 ${horizon - 820} Q 1300 ${horizon - 860} 1500 ${horizon - 600} L 1500 ${H} Z`} fill="#1d4a68" />
          <path d={`M 300 ${horizon + 40} Q 500 ${horizon - 700} 1000 ${horizon - 820} Q 900 ${horizon - 640} 760 ${horizon - 600}`} stroke="#e6f3ff" strokeWidth="26" fill="none" opacity="0.8" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ SPACE */

export const Planet: React.FC<{ x: number; y: number; r: number; kind: string; g: number; seed: number }> = ({ x, y, r, kind, g, seed }) => {
  const id = `pl${seed}${kind}`;
  if (kind === "sun") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <defs>
          <Glow id={id} color="#ffb703" o={0.85} />
          <radialGradient id={id + "c"}>
            <stop offset="0" stopColor="#fff6c2" />
            <stop offset="0.7" stopColor="#ffc93c" />
            <stop offset="1" stopColor="#ff8c00" />
          </radialGradient>
        </defs>
        <circle r={r * 2.4} fill={`url(#${id})`} />
        <circle r={r} fill={`url(#${id}c)`} />
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx={Math.cos(i + g * 0.1) * r * 0.55} cy={Math.sin(i * 1.7) * r * 0.55} r={r * 0.08} fill="#ff9f1c" opacity="0.4" />
        ))}
      </g>
    );
  }
  if (kind === "moon") {
    const rr = rng(seed);
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={r * 1.3} fill="#fff" opacity="0.05" />
        <circle r={r} fill="#d9d9d2" />
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={i} cx={(rr() - 0.5) * r * 1.3} cy={(rr() - 0.5) * r * 1.3} r={r * (0.06 + rr() * 0.14)} fill="#bdbdb4" />
        ))}
        <path d={`M ${r * 0.2} ${-r} A ${r} ${r} 0 0 1 ${r * 0.2} ${r} A ${r * 0.8} ${r} 0 0 0 ${r * 0.2} ${-r}`} fill="#000" opacity="0.25" />
      </g>
    );
  }
  // earth
  const rr = rng(seed + 5);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={id + "clip"}><circle r={r} /></clipPath>
        <Glow id={id + "atm"} color="#6ec6ff" o={0.5} />
      </defs>
      <circle r={r * 1.18} fill={`url(#${id}atm)`} />
      <circle r={r} fill="#1f6fb2" />
      <g clipPath={`url(#${id}clip)`}>
        <g transform={`translate(${((g * 12) % (r * 2)) - r} 0)`}>
          {Array.from({ length: 2 }).map((_, k) =>
            Array.from({ length: 6 }).map((_, i) => (
              <ellipse key={`${k}${i}`} cx={(rr() - 0.5) * r * 2 + k * r * 2} cy={(rr() - 0.5) * r * 1.6} rx={r * (0.2 + rr() * 0.3)} ry={r * (0.12 + rr() * 0.2)} fill={rr() > 0.3 ? "#3f9b4f" : "#c8a96a"} />
            ))
          )}
        </g>
        <ellipse cx="0" cy={-r * 0.95} rx={r * 0.7} ry={r * 0.18} fill="#f4f8ff" />
        <ellipse cx="0" cy={r * 0.97} rx={r * 0.8} ry={r * 0.16} fill="#f4f8ff" />
        <circle cx={r * 0.55} cy="0" r={r * 1.05} fill="#000" opacity="0.35" />
      </g>
    </g>
  );
};

const Capsule: React.FC<{ x: number; y: number; s?: number; g: number }> = ({ x, y, s = 1, g }) => (
  <g transform={`translate(${x} ${y + Math.sin(g) * 6}) scale(${s}) rotate(-12)`}>
    <rect x="-40" y="-60" width="200" height="120" fill="#d9d9d9" />
    <path d="M-40 -60 L -150 -20 L -150 20 L -40 60 Z" fill="#bdbdbd" />
    <path d="M160 -50 L 220 -80 L 220 80 L 160 50 Z" fill="#9e9e9e" />
    <rect x="20" y="-60" width="10" height="120" fill="#888" />
    <rect x="80" y="-60" width="10" height="120" fill="#888" />
  </g>
);

const Lander: React.FC<{ x: number; y: number; s?: number; flame?: boolean; g: number }> = ({ x, y, s = 1, flame, g }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {flame && <path d={`M-30 70 L 0 ${140 + 20 * Math.sin(g * 20)} L 30 70 Z`} fill="#ffd27a" opacity="0.8" />}
    <rect x="-80" y="-10" width="160" height="80" fill="#d4a017" />
    <path d="M-60 -10 L -70 -110 L 70 -110 L 60 -10 Z" fill="#cfcfcf" />
    <rect x="-24" y="-90" width="48" height="36" fill="#333" />
    <line x1="-80" y1="60" x2="-140" y2="150" stroke="#bbb" strokeWidth="8" />
    <line x1="80" y1="60" x2="140" y2="150" stroke="#bbb" strokeWidth="8" />
    <rect x="-160" y="146" width="40" height="8" fill="#bbb" />
    <rect x="120" y="146" width="40" height="8" fill="#bbb" />
  </g>
);

export const Space: React.FC<SceneProps> = ({ flags, g, t, seed, accent }) => {
  const surface = flags.includes("moonsurface");
  return (
    <g>
      <rect width={W} height={H} fill="#02030a" />
      <defs><Glow id={"neb" + seed} color={accent} o={0.25} /></defs>
      <ellipse cx="300" cy="500" rx="700" ry="500" fill={`url(#neb${seed})`} />
      <Stars seed={seed} g={g} n={260} />
      {flags.includes("sun") && <Planet x={540} y={760} r={flags.includes("flare") ? 260 : 300} kind="sun" g={g} seed={seed} />}
      {flags.includes("flare") && (
        <g>
          <path d={`M 700 640 C 900 ${380 - 60 * Math.sin(g)}, 1050 600, 860 860`} stroke="#ffd166" strokeWidth="26" fill="none" opacity="0.8" />
          {Array.from({ length: 30 }).map((_, i) => {
            const p = ((g * 0.25 + i / 30) % 1);
            return <circle key={i} cx={lerp(760, 1200, p) + Math.sin(i) * 60} cy={lerp(760, 1500, p) + Math.cos(i * 2) * 80} r={6 + (i % 4) * 3} fill="#ffb703" opacity={1 - p} />;
          })}
        </g>
      )}
      {flags.includes("probe") && (
        <g transform={`translate(${780 + Math.sin(g * 0.5) * 20} 1380) rotate(${g * 4})`}>
          <rect x="-40" y="-40" width="80" height="80" fill="#d4a017" />
          <rect x="-220" y="-26" width="170" height="52" fill="#1d3b72" stroke="#8aa" strokeWidth="3" />
          <rect x="50" y="-26" width="170" height="52" fill="#1d3b72" stroke="#8aa" strokeWidth="3" />
        </g>
      )}
      {flags.includes("moon") && !surface && <Planet x={540} y={780} r={260} kind="moon" g={g} seed={seed} />}
      {flags.includes("earth") && <Planet x={720} y={1250} r={flags.includes("sats") ? 300 : 170} kind="earth" g={g} seed={seed} />}
      {flags.includes("sats") && Array.from({ length: 5 }).map((_, i) => {
        const a = g * 0.3 + (i * Math.PI * 2) / 5;
        return (
          <g key={i} transform={`translate(${720 + Math.cos(a) * 420} ${1250 + Math.sin(a) * 160})`} opacity={Math.sin(g * 6 + i) > 0.2 ? 1 : 0.35}>
            <rect x="-14" y="-14" width="28" height="28" fill="#ccc" />
            <rect x="-70" y="-8" width="50" height="16" fill="#1d3b72" />
            <rect x="20" y="-8" width="50" height="16" fill="#1d3b72" />
          </g>
        );
      })}
      {flags.includes("capsule") && <Capsule x={360} y={620} g={g} s={1.2} />}
      {flags.includes("blackhole") && (
        <g transform={`translate(540 820) scale(${flags.includes("big") ? 1.5 : 1})`}>
          <defs>
            <Glow id={"bh" + seed} color="#ff9e40" o={0.9} />
            <linearGradient id={"bhd" + seed} x1="0" x2="1">
              <stop offset="0" stopColor="#ff6a00" />
              <stop offset="0.5" stopColor="#ffe0a0" />
              <stop offset="1" stopColor="#ff6a00" />
            </linearGradient>
          </defs>
          <circle r="420" fill={`url(#bh${seed})`} opacity="0.5" />
          <ellipse rx="430" ry="90" fill="none" stroke={`url(#bhd${seed})`} strokeWidth="46" transform={`rotate(-12)`} opacity="0.9" />
          <circle r="190" fill="none" stroke="#ffcf80" strokeWidth="18" opacity="0.8" />
          <circle r="180" fill="#000" />
          <path d="M -430 10 A 430 90 0 0 0 430 -10" transform="rotate(-12)" stroke={`url(#bhd${seed})`} strokeWidth="46" fill="none" />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = g * (0.6 + (i % 5) * 0.15) + i;
            return <circle key={i} cx={Math.cos(a) * (240 + (i % 6) * 30)} cy={Math.sin(a) * (50 + (i % 6) * 6)} r="4" fill="#fff" transform="rotate(-12)" />;
          })}
        </g>
      )}
      {flags.includes("asteroid") && (
        <g transform={`translate(${lerp(820, 600, clamp(t / 8))} ${lerp(520, 760, clamp(t / 8))}) rotate(${g * 8})`}>
          <path d="M0 -150 L 120 -90 L 150 30 L 70 140 L -80 130 L -150 20 L -110 -110 Z" fill="#6b5e55" />
          <circle cx="-30" cy="-30" r="30" fill="#56493f" />
          <circle cx="60" cy="40" r="22" fill="#56493f" />
          <circle cx="-60" cy="70" r="16" fill="#56493f" />
        </g>
      )}
      {flags.includes("asteroid") && <Planet x={380} y={1500} r={420} kind="earth" g={g} seed={seed} />}
      {flags.includes("grb") && (
        <g>
          <defs>
            <Glow id={"grb" + seed} color="#e0aaff" o={1} />
            <linearGradient id={"grbb" + seed} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#f3d9ff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="540" cy="900" r={300 + 30 * Math.sin(g * 4)} fill={`url(#grb${seed})`} />
          <rect x={540 - 50 - 10 * Math.sin(g * 6)} y="0" width={100 + 20 * Math.sin(g * 6)} height={H} fill={`url(#grbb${seed})`} />
          <circle cx="540" cy="900" r="40" fill="#fff" />
        </g>
      )}
      {surface && (
        <g>
          <Planet x={820} y={420} r={90} kind="earth" g={g} seed={seed} />
          <path d={`M0 1240 Q 300 1200 600 1250 T 1080 1230 V ${H} H 0 Z`} fill="#8e8e88" />
          <path d={`M0 1380 Q 400 1330 700 1390 T 1080 1360 V ${H} H 0 Z`} fill="#a7a7a0" />
          {Array.from({ length: 14 }).map((_, i) => {
            const rr = rng(seed + i);
            return <ellipse key={i} cx={rr() * W} cy={1420 + rr() * 460} rx={30 + rr() * 90} ry={10 + rr() * 22} fill="#8a8a84" />;
          })}
          {flags.includes("rocks") && Array.from({ length: 16 }).map((_, i) => {
            const rr = rng(seed + 40 + i);
            return <path key={i} transform={`translate(${rr() * W} ${1300 + rr() * 500})`} d="M-40 0 L -25 -40 L 20 -48 L 44 0 Z" fill="#6e6e68" />;
          })}
          {!flags.includes("landed") && <Lander x={540} y={lerp(700, 1000, clamp(t / 6))} s={1.2} flame g={g} />}
          {flags.includes("landed") && (
            <g>
              <Lander x={540} y={1180} s={1.2} g={g} />
              <line x1="800" y1="1380" x2="800" y2="1180" stroke="#ddd" strokeWidth="6" />
              <rect x="800" y="1180" width="110" height="70" fill="#f2f2f2" />
              <rect x="800" y="1180" width="44" height="36" fill="#1d3b72" />
              {[0, 1, 2, 3].map((k) => <rect key={k} x="844" y={1188 + k * 16} width="66" height="7" fill="#c0392b" />)}
            </g>
          )}
        </g>
      )}
      {flags.includes("lander") && !surface && (
        <g>
          <Planet x={540} y={1650} r={700} kind="moon" g={g} seed={seed} />
          <Lander x={540} y={720} s={1.3} flame g={g} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ EARTH (Globus) */

export const Earth: React.FC<SceneProps> = ({ flags, g, t, seed }) => {
  return (
    <g>
      <rect width={W} height={H} fill="#02030a" />
      <Stars seed={seed} g={g} n={220} />
      <Planet x={540} y={900} r={380} kind="earth" g={flags.includes("half") || flags.includes("cold") ? 0 : g} seed={seed} />
      {flags.includes("cold") && <circle cx="540" cy="900" r="380" fill="#cfe2ff" opacity="0.55" />}
      {flags.includes("cold") && <circle cx="540" cy="900" r="380" fill="#000" opacity="0.4" />}
      {flags.includes("haze") && <circle cx="540" cy="900" r="395" fill="#9a8f80" opacity="0.6" />}
      {flags.includes("half") && <path d="M540 520 A 380 380 0 0 1 540 1280 Z" fill="#000" opacity="0.75" />}
      {flags.includes("poles") && (
        <g>
          <ellipse cx="540" cy="560" rx="300" ry="90" fill="#1f6fb2" />
          <ellipse cx="540" cy="1240" rx="300" ry="90" fill="#1f6fb2" />
          <rect x="160" y="820" width="760" height="160" fill="#c8a96a" opacity="0.9" />
        </g>
      )}
      {flags.includes("tilt") && (
        <g transform={`rotate(${23.4 + 14 * Math.sin(g * 0.8)} 540 900)`}>
          <line x1="540" y1="380" x2="540" y2="1420" stroke="#ff4d6d" strokeWidth="8" strokeDasharray="30 18" />
          <circle cx="540" cy="380" r="14" fill="#ff4d6d" />
        </g>
      )}
      {flags.includes("wave") && [0, 1, 2, 3].map((k) => {
        const p = ((t * 0.35 + k * 0.25) % 1);
        return <circle key={k} cx="540" cy="900" r={380 + p * 500} fill="none" stroke="#ffd166" strokeWidth={10 * (1 - p)} opacity={1 - p} />;
      })}
      {flags.includes("impact") && (
        <g>
          <circle cx="430" cy="820" r={40 + 200 * easeOut(t / 2)} fill="#ff6a00" opacity={0.9 - 0.4 * clamp(t / 4)} />
          <circle cx="430" cy="820" r={60 + 520 * easeOut(t / 4)} fill="none" stroke="#ffd166" strokeWidth="14" opacity={1 - clamp(t / 4)} />
        </g>
      )}
      {flags.includes("aurora") && (
        <g opacity={0.8}>
          <ellipse cx="540" cy="560" rx={240 + 20 * Math.sin(g * 2)} ry="60" fill="none" stroke="#3cffa0" strokeWidth="26" />
          <ellipse cx="540" cy="540" rx={200 + 20 * Math.cos(g * 2)} ry="44" fill="none" stroke="#c0ff9a" strokeWidth="10" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ ROOM */

export const Room: React.FC<SceneProps> = ({ flags, g, seed }) => {
  const storm = flags.includes("storm");
  const night = flags.includes("night") || flags.includes("dark") || flags.includes("candle") || storm || flags.includes("tv");
  const outside: Tod = storm ? "storm" : night ? "night" : "day";
  const wall = night ? "#1d1b26" : "#d9cbb8";
  return (
    <g>
      <rect width={W} height={H} fill={wall} />
      {/* Fenster */}
      <g transform="translate(140 300)">
        <svg x="0" y="0" width="560" height="640" viewBox={`0 0 ${W} ${H * 0.6}`} preserveAspectRatio="xMidYMid slice">
          <Sky tod={outside} seed={seed} g={g} horizon={H * 0.6} />
          {storm && Array.from({ length: 60 }).map((_, i) => {
            const rr = rng(seed + i);
            const y = (rr() * H * 0.6 + g * 900) % (H * 0.6);
            return <line key={i} x1={rr() * W} y1={y} x2={rr() * W - 40} y2={y + 70} stroke="#9fb6c8" strokeWidth="4" opacity="0.6" />;
          })}
          {storm && Math.sin(g * 1.7) > 0.97 && <rect width={W} height={H} fill="#fff" opacity="0.7" />}
        </svg>
        <rect x="0" y="0" width="560" height="640" fill="none" stroke={night ? "#3a3340" : "#8b6f52"} strokeWidth="26" />
        <line x1="280" y1="0" x2="280" y2="640" stroke={night ? "#3a3340" : "#8b6f52"} strokeWidth="16" />
        <line x1="0" y1="320" x2="560" y2="320" stroke={night ? "#3a3340" : "#8b6f52"} strokeWidth="16" />
      </g>
      {/* Boden & Möbel */}
      <rect x="0" y="1300" width={W} height={H - 1300} fill={night ? "#15121a" : "#a3825f"} />
      {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="0" y1={1340 + i * 80} x2={W} y2={1340 + i * 80} stroke={night ? "#1d1922" : "#8f7151"} strokeWidth="4" />)}
      <rect x="620" y="1080" width="380" height="30" fill={night ? "#2a2230" : "#6b4b32"} />
      <rect x="650" y="1110" width="24" height="200" fill={night ? "#2a2230" : "#6b4b32"} />
      <rect x="950" y="1110" width="24" height="200" fill={night ? "#2a2230" : "#6b4b32"} />
      {flags.includes("tv") && (
        <g transform="translate(700 860)">
          <rect x="0" y="0" width="260" height="210" rx="24" fill="#3b2f2a" />
          <rect x="22" y="22" width="190" height="160" rx="16" fill="#a8c3c8" opacity={0.85 + 0.15 * Math.sin(g * 20)} />
          <rect x="70" y="80" width="90" height="70" fill="#5a6a70" />
          <circle cx="115" cy="62" r="22" fill="#5a6a70" />
          <circle cx="236" cy="60" r="10" fill="#888" />
          <circle cx="236" cy="100" r="10" fill="#888" />
          <defs><Glow id={"tvg" + seed} color="#bfe6ff" o={0.35} /></defs>
          <circle cx="115" cy="100" r="520" fill={`url(#tvg${seed})`} />
        </g>
      )}
      {flags.includes("candle") && (
        <g transform="translate(800 1080)">
          <defs><Glow id={"cg" + seed} color="#ffb347" o={0.55} /></defs>
          <circle cx="0" cy="-90" r={480 + 20 * Math.sin(g * 9)} fill={`url(#cg${seed})`} />
          <rect x="-16" y="-80" width="32" height="80" fill="#f4ecd8" />
          <path d={`M0 -80 C -14 -100 -6 -126 0 ${-140 - 4 * Math.sin(g * 12)} C 8 -122 14 -100 0 -80 Z`} fill="#ffcf5c" />
        </g>
      )}
      {!flags.includes("candle") && !flags.includes("tv") && (
        <g transform="translate(860 1080)">
          <rect x="-10" y="-160" width="20" height="160" fill="#444" />
          <path d="M-70 -160 L 70 -160 L 45 -250 L -45 -250 Z" fill={night ? "#3b3540" : "#f2d49b"} />
          {!night && <path d="M-70 -160 L 70 -160 L 200 300 L -200 300 Z" fill="#fff3c4" opacity="0.18" />}
        </g>
      )}
      {flags.includes("dark") && <rect width={W} height={H} fill="#000" opacity="0.45" />}
    </g>
  );
};

/* ------------------------------------------------------------------ PLANT (Kraftwerk) */

export const Plant: React.FC<SceneProps> = ({ flags, g, t, seed }) => {
  const horizon = 1340;
  return (
    <g>
      <Sky tod="night" seed={seed} g={g} horizon={horizon} moon={false} />
      {flags.includes("glow") && (
        <g>
          <defs>
            <linearGradient id={"pg" + seed} x1="0" x2="0" y1="1" y2="0">
              <stop offset="0" stopColor="#9fe7ff" stopOpacity="0.8" />
              <stop offset="1" stopColor="#9fe7ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M470 ${horizon - 380} L 380 0 L 700 0 L 610 ${horizon - 380} Z`} fill={`url(#pg${seed})`} opacity={0.6 + 0.2 * Math.sin(g * 3)} />
        </g>
      )}
      <g fill="#1a1f2b">
        <rect x="120" y={horizon - 300} width="820" height="340" />
        <rect x="380" y={horizon - 420} width="320" height="140" />
        <rect x="760" y={horizon - 900} width="70" height="600" />
        {Array.from({ length: 8 }).map((_, i) => <rect key={i} x="760" y={horizon - 900 + i * 75} width="70" height="30" fill={i % 2 ? "#b33" : "#ddd"} opacity="0.8" />)}
        {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={160 + i * 76} y={horizon - 220} width="40" height="60" fill="#ffd27a" opacity={0.6} />)}
      </g>
      {flags.includes("explode") && (
        <g>
          <defs><Glow id={"px" + seed} color="#ff8c00" o={1} /></defs>
          <circle cx="540" cy={horizon - 420} r={120 + 380 * easeOut(t / 1.5)} fill={`url(#px${seed})`} />
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI - Math.PI;
            const d = 600 * easeOut(t / 2);
            return <rect key={i} x={540 + Math.cos(a) * d} y={horizon - 420 + Math.sin(a) * d * 0.8} width="18" height="10" fill="#ffb347" transform={`rotate(${i * 40 + g * 200} ${540 + Math.cos(a) * d} ${horizon - 420 + Math.sin(a) * d * 0.8})`} />;
          })}
        </g>
      )}
      <rect x="0" y={horizon + 40} width={W} height={H - horizon} fill="#090c13" />
      {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 95} y={horizon + 20} width="6" height="40" fill="#222" />)}
    </g>
  );
};

/* ------------------------------------------------------------------ AIRSHIP */

export const Airship: React.FC<SceneProps> = ({ flags, g, t, seed }) => {
  const horizon = 1420;
  const fire = flags.includes("fire");
  const wreck = flags.includes("wreck");
  const tilt = fire ? -6 - t * 1.5 : 0;
  return (
    <g>
      <Sky tod="dusk" seed={seed} g={g} horizon={horizon} />
      <Clouds seed={seed} g={g} color="#f6b8a0" o={0.35} />
      <rect x="0" y={horizon} width={W} height={H - horizon} fill="#2c3324" />
      {/* Ankermast */}
      <g fill="#1a1a1a">
        <rect x="880" y={horizon - 520} width="30" height="520" />
        <path d={`M840 ${horizon} L 895 ${horizon - 520} L 950 ${horizon} Z`} fill="none" stroke="#1a1a1a" strokeWidth="8" />
      </g>
      {!wreck && (
        <g transform={`translate(${470 + (fire ? 0 : Math.sin(g * 0.3) * 20)} ${720 + (fire ? t * 60 : 0)}) rotate(${tilt})`}>
          <ellipse rx="420" ry="110" fill="#c9c9c4" />
          <ellipse rx="420" ry="110" fill="none" stroke="#9a9a94" strokeWidth="4" />
          {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={-360 + i * 90} y1="-100" x2={-360 + i * 90} y2="100" stroke="#a8a8a2" strokeWidth="3" />)}
          <path d="M330 -40 L 470 -120 L 460 -20 Z" fill="#b5b5b0" />
          <path d="M330 40 L 470 120 L 460 20 Z" fill="#b5b5b0" />
          <rect x="-120" y="100" width="160" height="34" rx="12" fill="#8a8a86" />
          {fire && (
            <g>
              <defs><Glow id={"af" + seed} color="#ff5a00" o={0.9} /></defs>
              <ellipse cx="300" cy="0" rx={200 + t * 120} ry={200} fill={`url(#af${seed})`} />
              {Array.from({ length: 7 }).map((_, i) => (
                <Fire key={i} x={380 - i * clamp(t / 4) * 110} y={-60} s={1.4} g={g} seed={seed + i} />
              ))}
            </g>
          )}
        </g>
      )}
      {wreck && (
        <g transform={`translate(480 ${horizon - 40})`}>
          <path d="M-420 0 Q 0 -260 420 0" fill="none" stroke="#2a2a2a" strokeWidth="10" />
          {Array.from({ length: 12 }).map((_, i) => {
            const x = -380 + i * 70;
            return <line key={i} x1={x} y1="0" x2={x} y2={-Math.sqrt(Math.max(0, 1 - (x / 420) ** 2)) * 200} stroke="#2a2a2a" strokeWidth="6" />;
          })}
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={i} cx={-300 + i * 120} cy={-200 - ((g * 30 + i * 40) % 300)} r={50 + i * 6} fill="#3a3a3a" opacity="0.5" />
          ))}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ MOUNTAINS */

export const Mountains: React.FC<SceneProps> = ({ flags, g, t, seed }) => {
  const night = flags.includes("night");
  const ice = flags.includes("ice");
  const summit = flags.includes("summit");
  const aval = flags.includes("avalanche");
  const tod: Tod = night ? "night" : summit ? "dawn" : "day";
  const horizon = 1300;
  return (
    <g>
      <Sky tod={tod} seed={seed} g={g} horizon={horizon} />
      {!night && <Clouds seed={seed} g={g} o={0.7} />}
      {ice ? (
        <g>
          <rect x="0" y={horizon - 100} width={W} height={H} fill="#dfeaf5" />
          <rect x="0" y={horizon + 220} width={W} height={H} fill="#1d4a68" />
          <path d={`M0 ${horizon + 220} L 0 ${horizon - 100} L ${W} ${horizon - 80} L ${W} ${horizon + 220} Z`} fill="#eef5fb" />
          <path d={`M0 ${horizon + 220} L ${W} ${horizon + 220} L ${W} ${horizon + 260} L 0 ${horizon + 260} Z`} fill="#a9c8e0" />
          {[150, 520, 860].map((x, i) => (
            <path key={i} transform={`translate(${x + Math.sin(g * 0.4 + i) * 10} ${horizon + 420 + i * 90})`} d="M-90 0 L -60 -90 L 10 -120 L 80 -60 L 100 0 Z" fill="#f2f8fd" />
          ))}
        </g>
      ) : (
        <g>
          <path d={`M-100 ${horizon} L 220 ${horizon - 600} L 470 ${horizon - 250} L 700 ${horizon - 820} L 1180 ${horizon} Z`} fill={night ? "#1b2236" : "#6f7f99"} />
          <path d={`M 160 ${horizon - 500} L 220 ${horizon - 600} L 280 ${horizon - 510} L 240 ${horizon - 530} Z`} fill="#f4f8ff" />
          <path d={`M 610 ${horizon - 680} L 700 ${horizon - 820} L 800 ${horizon - 650} L 740 ${horizon - 690} L 700 ${horizon - 640} Z`} fill="#f4f8ff" />
          <path d={`M-100 ${horizon + 200} L 300 ${horizon - 250} L 640 ${horizon + 60} L 900 ${horizon - 180} L 1180 ${horizon + 200} Z`} fill={night ? "#28314b" : "#93a3bd"} />
          <path d={`M0 ${H} L 0 ${horizon + 180} Q 540 ${horizon + 40} ${W} ${horizon + 140} L ${W} ${H} Z`} fill={night ? "#cdd6e8" : "#f3f7fd"} />
        </g>
      )}
      {summit && (
        <g>
          <path d={`M0 ${H} L 0 1500 L 540 1080 L 1080 1480 L 1080 ${H} Z`} fill="#eef3fa" />
          <path d={`M540 1080 L 1080 1480 L 1080 ${H} L 760 ${H} Z`} fill="#c8d4e6" />
          {flags.includes("flag") && (
            <g transform="translate(540 1080)">
              <line x1="0" y1="0" x2="0" y2="-200" stroke="#555" strokeWidth="6" />
              {["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"].map((c, i) => (
                <rect key={i} x={i * 44} y={-200 + Math.sin(g * 6 + i) * 8} width="40" height="56" fill={c} />
              ))}
            </g>
          )}
        </g>
      )}
      {aval && (
        <g>
          {Array.from({ length: 22 }).map((_, i) => {
            const p = clamp(t / 4 + i * 0.01);
            return <circle key={i} cx={lerp(800, 300, p) + (i % 6) * 70 - 200} cy={lerp(horizon - 600, horizon + 300, p) + Math.floor(i / 6) * 90} r={120 + (i % 5) * 30} fill="#f7fbff" opacity="0.95" />;
          })}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ MARS */

export const Mars: React.FC<SceneProps> = ({ flags, g, seed }) => {
  const dusk = flags.includes("dusk");
  const horizon = 1250;
  return (
    <g>
      <defs><Grad id={"ms" + seed} stops={dusk ? ["#1b1a2e", "#3a4f7a", "#9ab8d8"] : ["#c87a4a", "#e0a070", "#f0c8a0"]} /></defs>
      <rect width={W} height={H} fill={`url(#ms${seed})`} />
      {dusk && (
        <g>
          <defs><Glow id={"msu" + seed} color="#bfe0ff" o={0.9} /></defs>
          <circle cx="540" cy={horizon - 60} r="220" fill={`url(#msu${seed})`} />
          <circle cx="540" cy={horizon - 60} r="34" fill="#eef7ff" />
        </g>
      )}
      <path d={`M-50 ${horizon} L 200 ${horizon - 180} L 380 ${horizon - 90} L 620 ${horizon - 240} L 900 ${horizon - 100} L 1130 ${horizon - 160} L 1130 ${horizon + 40} L -50 ${horizon + 40} Z`} fill={dusk ? "#4a2b26" : "#a5522f"} />
      <path d={`M0 ${H} L 0 ${horizon} Q 300 ${horizon - 40} 600 ${horizon + 20} T 1080 ${horizon} L 1080 ${H} Z`} fill={dusk ? "#5e3226" : "#c0663a"} />
      {Array.from({ length: 20 }).map((_, i) => {
        const r = rng(seed + i);
        return <path key={i} transform={`translate(${r() * W} ${horizon + 80 + r() * 600})`} d={`M-${20 + r() * 40} 0 L -10 -${20 + r() * 30} L 30 -${10 + r() * 30} L ${30 + r() * 30} 0 Z`} fill={dusk ? "#3e2018" : "#8a4022"} />;
      })}
      {Array.from({ length: 30 }).map((_, i) => {
        const r = rng(seed + 100 + i);
        const x = (r() * W + g * 40 * (0.5 + r())) % W;
        return <circle key={"d" + i} cx={x} cy={horizon - 300 + r() * 900} r={1.5 + r() * 2} fill="#f0c8a0" opacity="0.5" />;
      })}
      {flags.includes("base") && (
        <g transform={`translate(760 ${horizon + 40})`}>
          <path d="M-160 0 A 160 140 0 0 1 160 0 Z" fill="#e6e6e6" />
          <path d="M120 0 A 90 80 0 0 1 300 0 Z" fill="#d4d4d4" />
          <rect x="-40" y="-40" width="80" height="40" fill="#4a90c2" />
          <circle cx="-80" cy="-60" r="10" fill={Math.sin(g * 4) > 0 ? "#ff4d4d" : "#550000"} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ UNDERWATER */

export const Underwater: React.FC<SceneProps> = ({ flags, g, seed }) => {
  const depth = flags.includes("abyss") ? 3 : flags.includes("dark") ? 2 : flags.includes("twilight") ? 1 : 0;
  const cols = [["#3fa7d6", "#1d6fa3", "#0b3c5d"], ["#0f4c75", "#0a2f4d", "#06192a"], ["#061a2c", "#030d18", "#01060c"], ["#01050a", "#000204", "#000000"]][depth];
  return (
    <g>
      <defs><Grad id={"uw" + seed} stops={cols} /></defs>
      <rect width={W} height={H} fill={`url(#uw${seed})`} />
      {depth === 0 && Array.from({ length: 6 }).map((_, i) => (
        <path key={i} d={`M${i * 200 + 40 + Math.sin(g + i) * 30} 0 L ${i * 200 + 140} 0 L ${i * 200 - 60} ${H} L ${i * 200 - 180} ${H} Z`} fill="#bfe9ff" opacity="0.08" />
      ))}
      {Array.from({ length: 40 }).map((_, i) => {
        const r = rng(seed + i);
        const y = (r() * H - g * 30 * (0.5 + r())) % H;
        return <circle key={i} cx={r() * W} cy={y < 0 ? y + H : y} r={1 + r() * 3} fill="#cfefff" opacity={depth > 1 ? 0.15 : 0.35} />;
      })}
      {flags.includes("glow") && Array.from({ length: 26 }).map((_, i) => {
        const r = rng(seed + 300 + i);
        const x = r() * W + Math.sin(g * 0.7 + i) * 30, y = 300 + r() * 1400 + Math.cos(g * 0.5 + i) * 30;
        const c = ["#4cf2ff", "#a0ff7a", "#ff7ae6"][i % 3];
        return (
          <g key={i} opacity={0.5 + 0.5 * Math.sin(g * 2 + i)}>
            <circle cx={x} cy={y} r="14" fill={c} opacity="0.25" />
            <circle cx={x} cy={y} r="4" fill={c} />
          </g>
        );
      })}
      {flags.includes("wreck") && (
        <g transform="translate(540 1600) rotate(-8)" opacity="0.8">
          <path d="M-420 0 L 380 0 L 340 110 L -380 110 Z" fill="#2a2420" />
          <rect x="-400" y="-60" width="680" height="60" fill="#3a332c" />
          <rect x="-200" y="-180" width="56" height="120" fill="#3a2a1c" />
          <rect x="-60" y="-160" width="56" height="100" fill="#3a2a1c" transform="rotate(14 -32 -60)" />
        </g>
      )}
      <g transform={`translate(${380 + Math.sin(g * 0.4) * 40} ${820 + Math.sin(g * 0.7) * 24})`}>
        {depth >= 1 && <path d="M120 0 L 760 -260 L 760 260 Z" fill="#fff6c9" opacity={0.10 + 0.04 * depth} />}
        <ellipse cx="0" cy="0" rx="150" ry="80" fill="#f4b400" />
        <rect x="-60" y="-120" width="90" height="60" rx="18" fill="#e0a300" />
        <circle cx="70" cy="0" r="40" fill="#9fd8ff" stroke="#c78f00" strokeWidth="10" />
        <rect x="-190" y="-14" width="50" height="28" rx="8" fill="#c78f00" />
        <circle cx="120" cy="0" r="10" fill="#fff" />
      </g>
      {(depth >= 2) && <path d={`M0 ${H} L 0 1700 Q 300 1640 600 1720 T 1080 1680 L 1080 ${H} Z`} fill="#0b0b0b" />}
      {depth === 3 && (
        <g>
          <path d={`M0 ${H} L 0 900 L 180 1100 L 220 ${H} Z`} fill="#050505" />
          <path d={`M1080 ${H} L 1080 800 L 880 1050 L 840 ${H} Z`} fill="#050505" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ WALL (Berlin) */

export const Wall: React.FC<SceneProps> = ({ flags, g, t, seed }) => {
  const tod: Tod = flags.includes("dawn") ? "dawn" : "night";
  const horizon = 1300;
  const crowd = flags.includes("crowd");
  const open = flags.includes("open");
  return (
    <g>
      <Sky tod={tod} seed={seed} g={g} horizon={horizon} />
      {/* Westlichter dahinter */}
      <defs><Glow id={"wl" + seed} color="#ffcf7a" o={0.4} /></defs>
      <ellipse cx="540" cy={horizon - 200} rx="800" ry="300" fill={`url(#wl${seed})`} />
      {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={i * 110} y={horizon - 420 - (i % 3) * 80} width="90" height={420} fill="#151b2b" />)}
      {/* Wachturm */}
      <g fill="#c8c4b8">
        <rect x="860" y={horizon - 520} width="60" height="400" />
        <rect x="830" y={horizon - 600} width="120" height="90" />
        <rect x="845" y={horizon - 585} width="90" height="34" fill="#20283a" />
      </g>
      {flags.includes("open") && (
        <path d={`M890 ${horizon - 560} L 200 ${horizon + 40} L 520 ${horizon + 40} Z`} fill="#fff6c9" opacity={0.18 + 0.05 * Math.sin(g * 2)} />
      )}
      {/* Mauersegmente */}
      {Array.from({ length: 9 }).map((_, i) => (
        <g key={i}>
          <rect x={i * 124} y={horizon - 300} width="120" height="340" fill="#d7d2c4" />
          <rect x={i * 124} y={horizon - 330} width="120" height="40" rx="20" fill="#e3dfd3" />
          <rect x={i * 124 + 118} y={horizon - 300} width="6" height="340" fill="#b4ae9e" />
        </g>
      ))}
      {open && <rect x="372" y={horizon - 330} width="248" height="370" fill="#1d2738" />}
      {/* Schlagbaum */}
      <g transform={`translate(380 ${horizon - 40}) rotate(${open ? -lerp(0, 70, easeOut(t / 1.2)) : 0})`}>
        <rect x="0" y="-12" width="300" height="24" fill="#fff" />
        {[0, 1, 2].map((k) => <rect key={k} x={40 + k * 90} y="-12" width="44" height="24" fill="#c0392b" />)}
      </g>
      <rect x="0" y={horizon + 40} width={W} height={H - horizon} fill="#1a1d24" />
      {/* Laternen */}
      {[120, 960].map((x, i) => (
        <g key={i}>
          <rect x={x} y={horizon - 520} width="12" height="560" fill="#333" />
          <circle cx={x + 6} cy={horizon - 525} r="18" fill="#ffe9a8" />
          <circle cx={x + 6} cy={horizon - 525} r="120" fill="#ffe9a8" opacity="0.12" />
        </g>
      ))}
      {crowd && Array.from({ length: 34 }).map((_, i) => {
        const r = rng(seed + i);
        const x = r() * W, y = horizon + 150 + r() * 420;
        const bob = Math.sin(g * (3 + r() * 2) + i) * (open ? 14 : 4);
        const c = ["#2b3a55", "#5a2d2d", "#3d5a3a", "#5a4a2d", "#444"][i % 5];
        return (
          <g key={i} transform={`translate(${x} ${y + bob}) scale(${0.7 + (y - horizon) / 900})`}>
            <rect x="-34" y="-100" width="68" height="120" rx="30" fill={c} />
            <circle cx="0" cy="-130" r="30" fill="#e8c4a0" />
            {open && i % 4 === 0 && <rect x="26" y="-200" width="14" height="110" rx="7" fill={c} transform={`rotate(${20 * Math.sin(g * 4 + i)} 33 -90)`} />}
          </g>
        );
      })}
      {open && crowd && Array.from({ length: 4 }).map((_, i) => (
        <circle key={i} cx={200 + i * 230} cy={horizon - 360 + Math.sin(g * 5 + i) * 10} r="26" fill="#e8c4a0" />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ CONTROL (Cockpit) */

export const Control: React.FC<SceneProps> = ({ flags, g, seed }) => {
  const alarm = flags.includes("alarm");
  const cold = flags.includes("cold");
  const dim = flags.includes("dim") || cold;
  const r = rng(seed);
  return (
    <g>
      <rect width={W} height={H} fill={dim ? "#0d1117" : "#1c232d"} />
      {/* Fenster */}
      <path d="M200 260 L 880 260 L 960 640 L 120 640 Z" fill="#02030a" stroke="#3a4250" strokeWidth="20" />
      <svg x="140" y="270" width="800" height="360" viewBox="0 0 1080 480" preserveAspectRatio="xMidYMid slice">
        <Stars seed={seed} g={g} h={480} n={80} />
        <Planet x={800} y={260} r={120} kind="earth" g={g} seed={seed} />
      </svg>
      {/* Paneele */}
      <rect x="40" y="700" width="1000" height="900" rx="30" fill={dim ? "#1b2027" : "#2b3440"} />
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const on = r() > 0.4 && (!dim || r() > 0.6);
          const blink = Math.sin(g * (2 + r() * 6) + row + col) > 0;
          const c = alarm && (row + col) % 5 === 0 ? (blink ? "#ff3b30" : "#4a0d0b") : on ? (r() > 0.5 ? "#ffd166" : "#7bdff2") : "#11161c";
          return <rect key={`${row}-${col}`} x={90 + col * 118} y={760 + row * 90} width="70" height="44" rx="8" fill={c} opacity={dim ? 0.7 : 1} />;
        })
      )}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${220 + i * 320} 1420)`}>
          <circle r="90" fill="#0b0f14" stroke="#4a5563" strokeWidth="10" />
          <line x1="0" y1="0" x2={70 * Math.cos(g * (0.5 + i) + i)} y2={70 * Math.sin(g * (0.5 + i) + i)} stroke={alarm ? "#ff3b30" : "#9ef01a"} strokeWidth="8" />
        </g>
      ))}
      <rect x="0" y="1640" width={W} height={H - 1640} fill="#0b0e13" />
      {alarm && <rect width={W} height={H} fill="#ff1a1a" opacity={0.12 + 0.12 * Math.max(0, Math.sin(g * 6))} />}
      {cold && <rect width={W} height={H} fill="#9fd0ff" opacity="0.12" />}
    </g>
  );
};

/* ------------------------------------------------------------------ MAP */

export const MapScene: React.FC<SceneProps & { label?: string; sub?: string }> = ({ g, t, seed, accent, label, sub }) => {
  const r = rng(seed + 99);
  const blob = (cx: number, cy: number, rad: number, n = 14) => {
    const pts = Array.from({ length: n }).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      const rr = rad * (0.7 + r() * 0.6);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.2];
    });
    return "M" + pts.map((p) => p.join(" ")).join(" L ") + " Z";
  };
  const ringP = (t * 0.6) % 1;
  return (
    <g>
      <rect width={W} height={H} fill="#0b1a33" />
      {Array.from({ length: 14 }).map((_, i) => <line key={"v" + i} x1={i * 80} y1="0" x2={i * 80} y2={H} stroke="#16305a" strokeWidth="2" />)}
      {Array.from({ length: 25 }).map((_, i) => <line key={"h" + i} x1="0" y1={i * 80} x2={W} y2={i * 80} stroke="#16305a" strokeWidth="2" />)}
      <path d={blob(260, 600, 380)} fill="#13294d" stroke="#2a4f86" strokeWidth="4" />
      <path d={blob(820, 1100, 420)} fill="#13294d" stroke="#2a4f86" strokeWidth="4" />
      <path d={blob(300, 1550, 260)} fill="#13294d" stroke="#2a4f86" strokeWidth="4" />
      <path d={`M 0 ${980 + 20 * Math.sin(g)} C 300 900, 600 1050, 1080 940`} stroke="#3a6fb5" strokeWidth="6" strokeDasharray="20 16" fill="none" opacity="0.7" />
      {Array.from({ length: 40 }).map((_, i) => (
        <rect key={i} x={380 + (r() - 0.5) * 600} y={900 + (r() - 0.5) * 600} width="12" height="12" fill={accent} opacity={0.25 + 0.35 * r()} />
      ))}
      <g transform="translate(540 920)">
        <circle r={60 + ringP * 380} fill="none" stroke={accent} strokeWidth={6 * (1 - ringP)} opacity={1 - ringP} />
        <circle r={60 + ((ringP + 0.5) % 1) * 380} fill="none" stroke={accent} strokeWidth={6 * (1 - ((ringP + 0.5) % 1))} opacity={1 - ((ringP + 0.5) % 1)} />
        <circle r="34" fill={accent} opacity="0.3" />
        <circle r="16" fill={accent} />
        <circle r="7" fill="#fff" />
      </g>
      {label && (
        <g transform="translate(540 820)">
          <rect x={-(label.length * 16 + 40) / 2} y="-44" width={label.length * 16 + 40} height="56" rx="10" fill="#f2efe6" />
          <text x="0" y="-6" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="30" fill="#14213d">{label}</text>
        </g>
      )}
      {sub && <text x="540" y="1060" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="30" letterSpacing="2" fill="#9fb6d8">{sub}</text>}
    </g>
  );
};

export const DarkScene: React.FC<SceneProps> = ({ g, seed, accent }) => (
  <g>
    <rect width={W} height={H} fill="#07080c" />
    <defs><Glow id={"dk" + seed} color={accent} o={0.18} /></defs>
    <circle cx={540 + Math.sin(g * 0.3) * 80} cy={900} r="900" fill={`url(#dk${seed})`} />
    <Clouds seed={seed} g={g * 0.6} color="#1a1c24" o={0.8} n={7} y0={200} y1={1700} />
  </g>
);

export function renderScene(preset: string, p: SceneProps & { label?: string; sub?: string }) {
  switch (preset) {
    case "city": return <City {...p} />;
    case "oldtown": return <OldTown {...p} />;
    case "volcano": return <Volcano {...p} />;
    case "ocean": return <Ocean {...p} />;
    case "space": return <Space {...p} />;
    case "earth": return <Earth {...p} />;
    case "room": return <Room {...p} />;
    case "plant": return <Plant {...p} />;
    case "airship": return <Airship {...p} />;
    case "mountains": return <Mountains {...p} />;
    case "mars": return <Mars {...p} />;
    case "underwater": return <Underwater {...p} />;
    case "wall": return <Wall {...p} />;
    case "control": return <Control {...p} />;
    case "map": return <MapScene {...p} />;
    default: return <DarkScene {...p} />;
  }
}
