// Zweiter Kanal: Merge-Physik-Simulation (Planeten). Positionen kommen fertig aus merge/sim.mjs.
import "@fontsource/anton";
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, easeOut, rng } from "./lib";

export type MergeProps = {
  __comp?: string;
  fps: number;
  duration: number;
  topAt: number;
  flask: { cx: number; cy: number; r: number; neck: number; neckTop: number };
  theme: { slug: string; tiers: { key: string; name: string; r: number; emoji?: string; color?: string }[]; hook?: [string, string]; final?: string; accent?: string };
  frames: [number, number, number, number, number][][];
  events: { f: number; type: string; tier: number; x?: number; y?: number }[];
};

const GLOW: Record<string, string> = {
  asteroid: "#b8a99a", moon: "#e8e8e8", mars: "#ff6a3d", venus: "#ffd27a", earth: "#4fa3ff",
  neptune: "#3b5bff", uranus: "#7ff0ff", saturn: "#f3d29b", jupiter: "#ffb06b", sun: "#ffd23f",
};

// Kontinente der Erde (normiert auf Radius 1)
const CONT = [
  "M-0.55,-0.45 Q-0.2,-0.7 0.05,-0.45 Q0.1,-0.2 -0.15,-0.05 Q-0.45,0.05 -0.6,-0.2 Z",
  "M0.2,0.05 Q0.55,-0.1 0.65,0.25 Q0.5,0.6 0.25,0.55 Q0.1,0.3 0.2,0.05 Z",
  "M-0.5,0.3 Q-0.3,0.25 -0.25,0.5 Q-0.4,0.7 -0.55,0.55 Z",
];

const Planet: React.FC<{ k: string; r: number; a: number; id: string; t: number }> = ({ k, r, a, id, t }) => {
  const deg = (a * 180) / Math.PI;
  const clip = `c${id}`;
  const base = (stops: [string, string]) => (
    <>
      <defs>
        <radialGradient id={`g${id}`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor={stops[0]} />
          <stop offset="100%" stopColor={stops[1]} />
        </radialGradient>
        <clipPath id={clip}><circle r={r} /></clipPath>
      </defs>
      <circle r={r} fill={`url(#g${id})`} />
    </>
  );
  const shade = (
    <>
      <circle r={r} fill="url(#limb)" />
      <ellipse cx={-r * 0.35} cy={-r * 0.38} rx={r * 0.32} ry={r * 0.2} fill="#fff" opacity={0.18} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.38})`} />
    </>
  );
  switch (k) {
    case "asteroid": {
      const pts = Array.from({ length: 11 }, (_, i) => {
        const an = (i / 11) * Math.PI * 2;
        const rr = r * (0.82 + 0.18 * Math.sin(i * 2.7 + 1.3));
        return `${(Math.cos(an) * rr).toFixed(1)},${(Math.sin(an) * rr).toFixed(1)}`;
      }).join(" ");
      return (
        <g transform={`rotate(${deg})`}>
          <defs><radialGradient id={`g${id}`} cx="35%" cy="32%" r="80%"><stop offset="0%" stopColor="#a89888" /><stop offset="100%" stopColor="#4a3f36" /></radialGradient></defs>
          <polygon points={pts} fill={`url(#g${id})`} stroke="#2a221c" strokeWidth={2} />
          <circle cx={r * 0.25} cy={-r * 0.2} r={r * 0.18} fill="#5a4c40" />
          <circle cx={-r * 0.3} cy={r * 0.3} r={r * 0.12} fill="#5a4c40" />
        </g>
      );
    }
    case "moon":
      return (
        <g transform={`rotate(${deg})`}>
          {base(["#f4f4f4", "#8d8d8d"])}
          {[[0.3, -0.2, 0.2], [-0.35, 0.25, 0.16], [0.1, 0.45, 0.12], [-0.2, -0.45, 0.1]].map(([x, y, s], i) => (
            <circle key={i} cx={x * r} cy={y * r} r={s * r} fill="#a9a9a9" stroke="#8a8a8a" strokeWidth={1.5} />
          ))}
          {shade}
        </g>
      );
    case "mars":
      return (
        <g transform={`rotate(${deg})`}>
          {base(["#ff8a5c", "#8e2d12"])}
          <g clipPath={`url(#${clip})`}>
            <ellipse cx={-r * 0.2} cy={r * 0.1} rx={r * 0.5} ry={r * 0.18} fill="#a8401c" opacity={0.7} />
            <ellipse cx={r * 0.35} cy={-r * 0.25} rx={r * 0.3} ry={r * 0.12} fill="#a8401c" opacity={0.6} />
            <ellipse cx={0} cy={-r * 0.95} rx={r * 0.45} ry={r * 0.2} fill="#fff" opacity={0.85} />
          </g>
          {shade}
        </g>
      );
    case "venus":
      return (
        <g transform={`rotate(${deg})`}>
          {base(["#fff1c4", "#c98a2e"])}
          <g clipPath={`url(#${clip})`} opacity={0.35}>
            {[-0.5, -0.15, 0.2, 0.55].map((y, i) => <ellipse key={i} cx={(i % 2 ? 0.2 : -0.2) * r} cy={y * r} rx={r * 1.1} ry={r * 0.11} fill="#e0a94a" />)}
          </g>
          {shade}
        </g>
      );
    case "earth":
      return (
        <g>
          {base(["#69b7ff", "#0b3d91"])}
          <g clipPath={`url(#${clip})`}>
            <g transform={`translate(${((a * 0.6 * r) % (2 * r))} 0)`}>
              {[-2 * r, 0].map((dx) => (
                <g key={dx} transform={`translate(${dx} 0) scale(${r})`}>
                  {CONT.map((d, i) => <path key={i} d={d} fill="#3fa34d" stroke="#2c7a36" strokeWidth={0.03} />)}
                </g>
              ))}
            </g>
            <ellipse cx={0} cy={-r * 0.93} rx={r * 0.5} ry={r * 0.16} fill="#fff" />
            <path d={`M${-r} ${-r * 0.1} Q0 ${-r * 0.3} ${r} ${-r * 0.05}`} stroke="#fff" strokeWidth={r * 0.07} fill="none" opacity={0.6} />
          </g>
          {shade}
        </g>
      );
    case "neptune":
    case "uranus": {
      const n = k === "neptune";
      return (
        <g transform={`rotate(${deg * 0.3})`}>
          {base(n ? ["#6f8dff", "#121f73"] : ["#c8fbff", "#2a9db0"])}
          <g clipPath={`url(#${clip})`} opacity={0.25}>
            {[-0.45, 0, 0.45].map((y, i) => <rect key={i} x={-r} y={y * r - r * 0.06} width={2 * r} height={r * 0.12} fill="#fff" />)}
          </g>
          {n && <ellipse cx={r * 0.25} cy={r * 0.25} rx={r * 0.18} ry={r * 0.1} fill="#0b134d" opacity={0.8} />}
          {shade}
        </g>
      );
    }
    case "saturn":
    case "jupiter": {
      const sat = k === "saturn";
      const bands = sat ? ["#f6e0b0", "#e2c18a", "#f3d9a6", "#c9a26a", "#efd4a0", "#d8b47c"] : ["#f2dfc6", "#c97d4b", "#ecd2b0", "#b5683a", "#f0d8b8", "#c4824f", "#e9cba5"];
      const ring = (front: boolean) => (
        <g clipPath={front ? `url(#rf${id})` : undefined}>
          <ellipse rx={r * 1.85} ry={r * 0.42} fill="none" stroke="#e8d1a0" strokeWidth={r * 0.18} opacity={0.95} />
          <ellipse rx={r * 1.55} ry={r * 0.34} fill="none" stroke="#b89a68" strokeWidth={r * 0.08} opacity={0.9} />
        </g>
      );
      return (
        <g transform={`rotate(${sat ? -18 + Math.sin(a) * 10 : 0})`}>
          {sat && (
            <defs><clipPath id={`rf${id}`}><rect x={-3 * r} y={0} width={6 * r} height={2 * r} /></clipPath></defs>
          )}
          {sat && ring(false)}
          {base(sat ? ["#fbe9c2", "#b8935a"] : ["#f7e3c8", "#9b5a2e"])}
          <g clipPath={`url(#${clip})`}>
            {bands.map((c, i) => <rect key={i} x={-r} y={-r + (i * 2 * r) / bands.length} width={2 * r} height={(2 * r) / bands.length + 1} fill={c} opacity={0.85} />)}
            {!sat && <ellipse cx={r * 0.3 + Math.sin(a) * r * 0.2} cy={r * 0.3} rx={r * 0.22} ry={r * 0.13} fill="#b5442a" stroke="#8a3020" strokeWidth={2} />}
          </g>
          {shade}
          {sat && ring(true)}
        </g>
      );
    }
    case "sun": {
      const pulse = 1 + 0.04 * Math.sin(t * 4);
      return (
        <g>
          <circle r={r * 1.7 * pulse} fill="url(#sunglow)" />
          <defs><radialGradient id={`g${id}`} cx="45%" cy="42%" r="65%"><stop offset="0%" stopColor="#fffbe0" /><stop offset="55%" stopColor="#ffd23f" /><stop offset="100%" stopColor="#ff7a00" /></radialGradient></defs>
          <circle r={r} fill={`url(#g${id})`} />
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={Math.cos(i * 2.1 + t) * r * 0.5} cy={Math.sin(i * 1.7 + t * 0.7) * r * 0.5} r={r * 0.12} fill="#ff9d00" opacity={0.35} />
          ))}
        </g>
      );
    }
  }
  return <circle r={r} fill="#888" />;
};

// Emoji-Objekte (Noto Color Emoji, OFL) – für alle Themen außer Planeten
const Emoji: React.FC<{ e: string; r: number; a: number }> = ({ e, r, a }) => (
  <g transform={`rotate(${(a * 180) / Math.PI})`}>
    <text x={0} y={r * 0.42} textAnchor="middle" fontSize={r * 2.0} fontFamily="'Noto Color Emoji', sans-serif" style={{ filter: "drop-shadow(0 4px 6px #0008)" }}>{e}</text>
  </g>
);
const Obj: React.FC<{ ti: { key: string; r: number; emoji?: string }; r: number; a: number; id: string; t: number }> = ({ ti, r, a, id, t }) =>
  ti.emoji ? <Emoji e={ti.emoji} r={r} a={a} /> : <Planet k={ti.key} r={r} a={a} id={id} t={t} />;
const glow = (ti: { key: string; color?: string }) => ti.color ?? GLOW[ti.key] ?? "#ffffff";

export const MergeSim: React.FC<MergeProps> = (p) => {
  const frame = useCurrentFrame();
  const f = Math.min(frame, p.frames.length - 1);
  const t = frame / p.fps;
  const { cx, cy, r, neck, neckTop } = p.flask;
  const tiers = p.theme.tiers;
  const top = tiers.length - 1;
  const neckY = cy - Math.sqrt(r * r - neck * neck);

  const stars = useMemo(() => {
    const rand = rng(7);
    return Array.from({ length: 140 }, () => [rand() * 1080, rand() * 1920, rand() * 1.8 + 0.4, rand()]);
  }, []);

  // höchste bisher erreichte Stufe (für die Leiste links)
  let reached = 0;
  for (const e of p.events) if (e.type === "merge" && e.f <= f && e.tier > reached) reached = e.tier;
  for (const b of p.frames[0] ?? []) reached = Math.max(reached, b[1]);
  const fx = p.events.filter((e) => e.type === "merge" && e.f <= f && f - e.f < 20);
  const sunT = (frame - p.topAt) / p.fps;
  const shake = sunT >= 0 && sunT < 0.8 ? (1 - sunT / 0.8) * 14 : 0;
  const sr = rng(frame + 11);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <radialGradient id="limb" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>
          <radialGradient id="sunglow" cx="50%" cy="50%" r="50%">
            <stop offset="35%" stopColor="#ffcf3f" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#ff7a00" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff2fd6" />
            <stop offset="25%" stopColor="#ff8a00" />
            <stop offset="50%" stopColor="#ffe600" />
            <stop offset="70%" stopColor="#2dff6f" />
            <stop offset="85%" stopColor="#00d0ff" />
            <stop offset="100%" stopColor="#7a5cff" />
          </linearGradient>
          <filter id="blur"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        {stars.map(([x, y, s, ph], i) => <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={0.25 + 0.35 * Math.abs(Math.sin(t * 1.5 + ph * 6))} />)}

        <g transform={`translate(${(sr() - 0.5) * shake} ${(sr() - 0.5) * shake})`}>
          {/* Kolben (Regenbogen + Glow) */}
          {[16, 6].map((w, i) => (
            <path key={i} d={`M${cx - neck} ${neckTop} L${cx - neck} ${neckY} A${r} ${r} 0 1 0 ${cx + neck} ${neckY} L${cx + neck} ${neckTop}`}
              fill="none" stroke="url(#rainbow)" strokeWidth={w} strokeLinecap="round" opacity={i ? 1 : 0.45} filter={i ? undefined : "url(#blur)"} />
          ))}

          {p.frames[f].map(([id, tier, x, y, a]) => {
            const born = p.events.find((e) => e.type === "merge" && e.tier === tier && e.f <= f && f - e.f < 8 && Math.hypot((e.x ?? 0) - x, (e.y ?? 0) - y) < 60);
            const pop = born ? 0.6 + 0.4 * easeOut((f - born.f) / 8) + 0.12 * Math.sin(((f - born.f) / 8) * Math.PI) : 1;
            return (
              <g key={id} transform={`translate(${x} ${y}) scale(${pop})`}>
                <Obj ti={tiers[tier]} r={tiers[tier].r} a={a} id={String(id)} t={t} />
              </g>
            );
          })}

          {/* Verschmelz-Effekte */}
          {fx.map((e, i) => {
            const k = (f - e.f) / 20;
            const R = tiers[e.tier].r;
            const col = glow(tiers[e.tier]);
            return (
              <g key={i} transform={`translate(${e.x} ${e.y})`} opacity={1 - k}>
                <circle r={R * (0.9 + 1.4 * easeOut(k))} fill="none" stroke="#fff" strokeWidth={4 * (1 - k) + 1} />
                <circle r={R * (0.6 + 0.9 * easeOut(k))} fill="none" stroke={col} strokeWidth={10 * (1 - k)} opacity={0.8} />
                <circle r={R * 0.5 * (1 - k)} fill="#fff" opacity={0.85} filter="url(#blur)" />
                {Array.from({ length: 10 }, (_, j) => {
                  const an = (j / 10) * Math.PI * 2 + e.tier;
                  const d = R * (0.8 + 1.6 * easeOut(k));
                  return <circle key={j} cx={Math.cos(an) * d} cy={Math.sin(an) * d} r={3.5 * (1 - k) + 1} fill={j % 2 ? "#fff" : col} />;
                })}
              </g>
            );
          })}
        </g>

        {/* Leiste links: welche Stufen schon erreicht sind (Neugier: was kommt als Nächstes?) */}
        {tiers.map((ti, i) => {
          const y = 520 + i * 104;
          const got = i <= reached;
          const s = Math.min(1, 34 / ti.r);
          return (
            <g key={ti.key} transform={`translate(62 ${y})`}>
              <circle r={42} fill="#ffffff10" stroke={got ? glow(ti) : "#ffffff30"} strokeWidth={3} />
              {got ? (
                <g transform={`scale(${s})`}><Obj ti={ti} r={ti.r} a={0} id={`leg${i}`} t={t} /></g>
              ) : (
                <text y={14} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={40} fill="#ffffff55">?</text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Hook in den ersten Sekunden */}
      {t < 3.2 && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
          <div style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 108, lineHeight: 1.05, textAlign: "center", color: "#fff", WebkitTextStroke: "9px #000", paintOrder: "stroke fill",
            opacity: clamp((3.2 - t) / 0.3), transform: `scale(${0.9 + 0.1 * easeOut(t / 0.25)})`, textShadow: "0 0 40px #000" }}>
            {(p.theme.hook ?? ["CAN THIS MAKE", "THE SUN?"])[0]}<br /><span style={{ color: p.theme.accent ?? "#ffd23f" }}>{(p.theme.hook ?? ["CAN THIS MAKE", "THE SUN?"])[1]}</span>
          </div>
        </AbsoluteFill>
      )}
      {/* Finale: Sonne entsteht → Blitz */}
      {sunT >= 0 && <AbsoluteFill style={{ background: "#fff7d0", opacity: Math.max(0, 0.85 - sunT * 1.6), mixBlendMode: "screen" }} />}
      {sunT >= 0.3 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 300 }}>
          <div style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: Math.min(150, Math.floor(1750 / Math.max(6, (p.theme.final ?? "THE SUN!").length))), textAlign: "center", color: p.theme.accent ?? "#ffd23f", WebkitTextStroke: "10px #000", paintOrder: "stroke fill", opacity: clamp((sunT - 0.3) / 0.3), transform: `scale(${0.8 + 0.2 * easeOut((sunT - 0.3) / 0.4)})`, textShadow: "0 0 60px #ff9d00" }}>
            {p.theme.final ?? "THE SUN!"}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
