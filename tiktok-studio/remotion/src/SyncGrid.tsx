// Kanal 2: Sync-Story mit austauschbaren Geräten (Waschmaschinen, Ventilatoren …). Daten aus metronome/story.py.
import "@fontsource/anton";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, easeOut, rng } from "./lib";

export type SyncProps = {
  __comp?: string;
  fps: number;
  n: number;
  kind: "washer" | "fan";
  title: [string, string];
  rebel: number;
  events: [number, string][];
  frames: { p: number[]; d: number[]; r: number; m: number; s: number; on: boolean }[];
};

const INTER = "Inter, sans-serif";
const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";

const stateCol = (dev: number, on: boolean) => {
  if (!on) return "#3a0b0b";
  const a = Math.abs(dev);
  if (a < 0.35) return "#39ff6a";
  if (a < 1.2) return "#ffb020";
  return "#ff3434";
};

const Washer: React.FC<{ s: number; ph: number; col: string; on: boolean; id: number }> = ({ s, ph, col, on, id }) => {
  const w = 84 * s, h = 92 * s, r = 29 * s;
  const deg = (ph * 180) / Math.PI;
  return (
    <g>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={8 * s} fill={on ? "#cfd4d8" : "#3b3f44"} stroke="#111" strokeWidth={2} />
      <rect x={-w / 2 + 6 * s} y={-h + 6 * s} width={w - 12 * s} height={14 * s} rx={3 * s} fill="#2a2e33" />
      <text x={-w / 2 + 12 * s} y={-h + 17 * s} fontFamily={MONO} fontSize={10 * s} fill={on ? col : "#400"}>{on ? 150 + (id % 3) : ""}</text>
      <circle cx={w / 2 - 14 * s} cy={-h + 13 * s} r={3.5 * s} fill={on ? col : "#300"} />
      <circle cx={0} cy={-h / 2 + 6 * s} r={r + 5 * s} fill="#9aa1a7" stroke="#111" strokeWidth={2} />
      <circle cx={0} cy={-h / 2 + 6 * s} r={r} fill={on ? col : "#1a0505"} opacity={on ? 0.9 : 1} />
      <circle cx={0} cy={-h / 2 + 6 * s} r={r * 0.82} fill="#0d1a12" opacity={0.75} />
      <g transform={`translate(0 ${-h / 2 + 6 * s}) rotate(${deg})`}>
        <path d={`M${-r * 0.7} 0 A${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.7} 0 Q0 ${r * 0.25} ${-r * 0.7} 0 Z`} fill={on ? col : "#2a0a0a"} opacity={0.85} />
        <circle cx={r * 0.35} cy={r * 0.3} r={r * 0.16} fill="#ffffffaa" />
      </g>
      <ellipse cx={-r * 0.35} cy={-h / 2 + 6 * s - r * 0.4} rx={r * 0.35} ry={r * 0.18} fill="#fff" opacity={0.25} />
    </g>
  );
};

const Fan: React.FC<{ s: number; ph: number; col: string; on: boolean }> = ({ s, ph, col, on }) => {
  const r = 38 * s;
  const deg = (ph * 180) / Math.PI;
  return (
    <g>
      <rect x={-6 * s} y={-r * 0.2} width={12 * s} height={r * 1.1} fill="#555" />
      <ellipse cx={0} cy={r * 0.95} rx={r * 0.6} ry={r * 0.18} fill="#333" />
      <g transform={`translate(0 ${-r * 0.4})`}>
        <circle r={r} fill="#111" stroke={on ? col : "#400"} strokeWidth={3 * s} />
        <g transform={`rotate(${deg})`}>
          {[0, 120, 240].map((a) => (
            <ellipse key={a} cx={0} cy={-r * 0.48} rx={r * 0.22} ry={r * 0.46} fill={on ? col : "#2a0a0a"} opacity={0.9} transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r={r * 0.14} fill="#ccc" />
        {[0.35, 0.7].map((k) => <circle key={k} r={r * k} fill="none" stroke="#ffffff22" strokeWidth={1.5} />)}
      </g>
    </g>
  );
};

export const SyncGrid: React.FC<SyncProps> = (p) => {
  const frame = useCurrentFrame();
  const f = Math.min(frame, p.frames.length - 1);
  const fr = p.frames[f];
  const t = frame / p.fps;
  const ev = (name: string) => p.events.find((e) => e[1] === name)?.[0] ?? 999;
  const tRebel = ev("rebel"), tBlack = ev("blackout"), tPower = ev("power");
  const cols = 10, rows = Math.ceil(p.n / cols);

  // Perspektive: Tribüne – hinten klein/oben, vorne groß/unten
  const rowS = (j: number) => 0.52 + j * 0.06;
  let y = 640;
  const ys: number[] = [];
  for (let j = 0; j < rows; j++) { y += 92 * rowS(j) * 0.86; ys.push(y); }
  const syncPulse = fr.on && fr.s >= 98 ? Math.pow(Math.max(0, Math.cos(fr.m)), 8) : 0;
  const shake = syncPulse * 5;
  const R = rng(frame * 7 + 1);
  const zoom = 1 + 0.04 * clamp(t / 40);

  // Status-Text
  let status = `${p.n} ${p.kind === "washer" ? "MACHINES" : "FANS"} · ONE FLOOR`;
  if (fr.s > 30 && t < tRebel) status = "THE FLOOR IS SHAKING THEM";
  if (fr.s >= 99 && t < tRebel) status = `ALL ${p.n} IN SYNC`;
  if (t >= tRebel && t < tRebel + 2.5) status = `UNIT ${p.rebel + 1} IS OUT OF SYNC`;
  if (t >= tRebel + 2.5 && t < tBlack) status = "THE FLOOR PULLS IT BACK";
  if (t >= tBlack && t < tPower) status = "TOTAL POWER FAILURE";
  if (t >= tPower) status = fr.s >= 99 ? "POWER ROAR · 100%" : "RESTARTING…";
  const numCol = !fr.on ? "#ff3434" : fr.s >= 99 ? "#39ff6a" : fr.s >= 60 ? "#ffb020" : "#ff5a3c";

  // Sync-Verlauf (Mini-Grafik)
  const hist: string[] = [];
  for (let i = 0; i <= f; i += 6) hist.push(`${(i / p.frames.length) * 300},${60 - (p.frames[i].s / p.n) * 55}`);

  const els: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++) {
    const s = rowS(j);
    const w = 84 * s * cols * 1.04;
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      if (k >= p.n) break;
      const x = 540 + (i - (cols - 1) / 2) * (w / cols);
      const col = stateCol(fr.d[k], fr.on);
      const vib = fr.on ? Math.sin(fr.p[k] * 2) * 1.2 * s : 0;
      els.push(
        <g key={k} transform={`translate(${x + vib} ${ys[j]})`}>
          {p.kind === "washer" ? <Washer s={s} ph={fr.p[k]} col={col} on={fr.on} id={k} /> : <Fan s={s} ph={fr.p[k]} col={col} on={fr.on} />}
        </g>,
      );
    }
  }

  const blackoutA = t >= tBlack && t < tPower ? 1 : t >= tPower && t < tPower + 0.4 ? 1 - (t - tPower) / 0.4 : 0;
  return (
    <AbsoluteFill style={{ background: "#0b0c0e" }}>
      {/* Scheinwerfer */}
      {[300, 540, 780].map((x, i) => (
        <AbsoluteFill key={i} style={{ background: `radial-gradient(ellipse 22% 42% at ${x / 10.8}% 30%, rgba(255,240,200,${fr.on ? 0.16 : 0.02}), transparent 70%)` }} />
      ))}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", transform: `translate(${(R() - 0.5) * shake}px, ${(R() - 0.5) * shake}px) scale(${zoom})`, transformOrigin: "50% 60%" }}>
        {[300, 540, 780].map((x) => <path key={x} d={`M${x - 20} 470 L${x + 20} 470 L${x + 12} 500 L${x - 12} 500 Z`} fill="#222" />)}
        {els}
        <rect x={0} y={ys[rows - 1] + 4} width={1080} height={400} fill="#151619" />
      </svg>
      {fr.on && syncPulse > 0 && <AbsoluteFill style={{ background: "#39ff6a", opacity: syncPulse * 0.06, mixBlendMode: "screen" }} />}
      <AbsoluteFill style={{ background: "#300000", opacity: blackoutA * 0.75 }} />

      {/* Titel */}
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 58, color: "#fff", background: "#ff2e63", padding: "6px 20px", borderRadius: 8 }}>{p.title[0]}</span>
        <div style={{ marginTop: 14 }}><span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 36, color: "#111", background: "#fff", padding: "4px 14px", borderRadius: 6 }}>{p.title[1]}</span></div>
      </div>

      {/* Anzeige unten */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 1470, height: 170, background: "#0a0a0acc", border: "3px solid #444", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 30px", gap: 30 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: "#aaa", letterSpacing: 2 }}>IN SYNC</div>
          <div style={{ fontFamily: MONO, fontWeight: 900, fontSize: 84, color: numCol, lineHeight: 1 }}>{fr.s}<span style={{ fontSize: 30, color: "#888" }}>/{p.n}</span></div>
          <div style={{ fontFamily: MONO, fontSize: 20, color: numCol, marginTop: 6, letterSpacing: 1 }}>{status}</div>
        </div>
        <svg width={300} height={70} style={{ marginLeft: "auto" }}>
          <rect width={300} height={70} fill="#111" />
          <polyline points={hist.join(" ")} fill="none" stroke={numCol} strokeWidth={3} />
        </svg>
      </div>
      {t >= tBlack && t < tPower && (
        <div style={{ position: "absolute", top: 1270, left: 0, right: 0, textAlign: "center", fontFamily: "Anton, Impact, sans-serif", fontSize: 120, color: "#ff3434", opacity: Math.sin(t * 10) > 0 ? 1 : 0.3 }}>POWER FAILURE</div>
      )}
      {fr.on && fr.s >= 99 && t > tPower && (
        <div style={{ position: "absolute", top: 1260, left: 0, right: 0, textAlign: "center", fontFamily: "Anton, Impact, sans-serif", fontSize: 130, color: "#39ff6a", textShadow: "0 0 40px #39ff6a88", opacity: easeOut(clamp((t - tPower - 10) / 0.5)) }}>PERFECT SYNC</div>
      )}
    </AbsoluteFill>
  );
};
