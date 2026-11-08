// Kanal 2: 100 Metronome synchronisieren sich von selbst (Daten aus metronome/sim.py).
import "@fontsource/anton";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, easeOut } from "./lib";

export type MetProps = {
  __comp?: string;
  fps: number;
  n: number;
  frames: { a: number[]; x: number; r: number; d: number[] }[];
  texts?: { from: number; to: number; text: string }[];
  final?: [string, string];
};

const INTER = "Inter, sans-serif";

function hsl(h: number, s: number, l: number) {
  return `hsl(${h.toFixed(0)} ${s}% ${l}%)`;
}

export const Metronome: React.FC<MetProps> = (p) => {
  const frame = useCurrentFrame();
  const f = Math.min(frame, p.frames.length - 1);
  const fr = p.frames[f];
  const t = frame / p.fps;
  const cols = Math.round(Math.sqrt(p.n));
  const rows = Math.ceil(p.n / cols);
  const shift = fr.x * 22; // Brett rollt mit
  const sync = Math.min(100, Math.round(fr.r * 100 + (fr.r > 0.99 ? 1 : 0)));
  const synced = fr.r > 0.97;
  // Zeitpunkt, ab dem synchron
  let syncAt = -1;
  for (let i = 0; i <= f; i++) if (p.frames[i].r > 0.97) { syncAt = i; break; }
  const st = syncAt >= 0 ? (frame - syncAt) / p.fps : -1;

  // Perspektive: hintere Reihen kleiner und höher
  const rowY = (j: number) => 700 + j * 62 + j * j * 1.6;
  const rowS = (j: number) => 0.62 + j * 0.05;
  const boardTop = rowY(0) - 70, boardBot = rowY(rows - 1) + 40;
  const wTop = 760, wBot = 1000;

  const els: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++) {
    const s = rowS(j);
    const y = rowY(j);
    const w = wTop + ((wBot - wTop) * (y - boardTop)) / (boardBot - boardTop);
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      if (k >= p.n) break;
      const x = 540 + shift + (i - (cols - 1) / 2) * (w / cols);
      const ang = fr.a[k] * 30; // Ausschlag in Grad
      const dev = Math.abs(fr.d[k]) / Math.PI; // 0 = im Takt, 1 = gegenläufig
      const hue = 40 + ((k * 37) % 300) * clamp(dev * 3);
      const col = dev < 0.06 ? "#ffb703" : hsl(hue, 90, 60);
      const h = 64 * s, bw = 30 * s, tw = 10 * s;
      els.push(
        <g key={k} transform={`translate(${x} ${y})`}>
          <path d={`M${-bw / 2} 0 L${bw / 2} 0 L${tw / 2} ${-h} L${-tw / 2} ${-h} Z`} fill="#1b1d2a" stroke="#000" strokeWidth={1.5} />
          <g transform={`translate(0 ${-6 * s}) rotate(${ang})`}>
            <line x1={0} y1={0} x2={0} y2={-h * 1.55} stroke={col} strokeWidth={3 * s} strokeLinecap="round" />
            <circle cx={0} cy={-h * 1.05} r={6 * s} fill={col} stroke="#000" strokeWidth={1} />
          </g>
        </g>,
      );
    }
  }

  const texts = p.texts ?? [
    { from: 0, to: 4.2, text: "100 metronomes.\nTotal chaos." },
    { from: 4.2, to: 9, text: "Hands off.\nOnly the board can roll." },
    { from: 9, to: 99, text: "Watch closely…" },
  ];
  const cur = !synced || st < 0 ? texts.find((x) => t >= x.from && t < x.to) : undefined;
  const fin = p.final ?? ["ONE HEARTBEAT.", "spontaneous synchronization"];

  return (
    <AbsoluteFill style={{ background: "#050507" }}>
      {synced && <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 35% at 50% 50%, rgba(255,183,3,0.22), transparent 70%)", opacity: clamp(st / 0.6) }} />}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {/* Brett */}
        <g transform={`translate(${shift} 0)`}>
          <path d={`M${540 - wTop / 2 - 30} ${boardTop} L${540 + wTop / 2 + 30} ${boardTop} L${540 + wBot / 2 + 40} ${boardBot} L${540 - wBot / 2 - 40} ${boardBot} Z`} fill="#6b4a2b" stroke="#2b1b0e" strokeWidth={4} />
          <rect x={540 - wBot / 2 - 40} y={boardBot} width={wBot + 80} height={34} fill="#4a321c" />
          {[-1, 1].map((sg) => (
            <g key={sg} transform={`translate(${540 + sg * 330} ${boardBot + 62})`}>
              <circle r={30} fill="#2a2a2e" stroke="#000" strokeWidth={3} />
              <line x1={0} y1={0} x2={Math.cos(fr.x * 3) * 24} y2={Math.sin(fr.x * 3) * 24} stroke="#555" strokeWidth={4} />
            </g>
          ))}
        </g>
        <line x1={60} y1={boardBot + 94} x2={1020} y2={boardBot + 94} stroke="#333" strokeWidth={3} />
        {els}
      </svg>

      {cur && (
        <div style={{ position: "absolute", top: 300, left: 40, right: 40, textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 64, lineHeight: 1.15, color: "#fff", whiteSpace: "pre-line", textShadow: "0 4px 20px #000", opacity: clamp((t - cur.from) / 0.25) }}>
          {cur.text}
        </div>
      )}
      {synced && st >= 0 && (
        <div style={{ position: "absolute", top: 270, left: 0, right: 0, textAlign: "center", opacity: clamp(st / 0.4), transform: `scale(${0.85 + 0.15 * easeOut(st / 0.4)})` }}>
          <div style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 130, color: "#ffb703", textShadow: "0 0 50px #ff9d0088" }}>{fin[0]}</div>
          <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 44, color: "#ddd", marginTop: 6 }}>{fin[1]}</div>
        </div>
      )}
      <div style={{ position: "absolute", top: 1560, left: 0, right: 0, textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 64, color: sync >= 100 ? "#ffb703" : "#e8e8e8" }}>
        Sync: {sync}%
      </div>
    </AbsoluteFill>
  );
};
