import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { H, W, Word, clamp, easeOut, rng, shade } from "./lib";

const ANTON = "Anton, 'Inter Display', Impact, sans-serif";
const INTER = "Inter, 'Inter Display', sans-serif";

/* ---------------------------------------------------------------- Uhr / HUD */

function parseClock(s: string): { secs: number; parts: number } | null {
  if (!/^\d{1,3}:\d{2}(:\d{2})?$/.test(s)) return null;
  const p = s.split(":").map(Number);
  const secs = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
  return { secs, parts: p.length };
}

function fmtClock(secs: number, parts: number) {
  const s = Math.max(0, Math.floor(secs));
  const pad = (n: number) => String(n).padStart(2, "0");
  if (parts === 3) return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export const Hud: React.FC<{ label: string; clock?: string; tick: "up" | "down" | null; local: number; ctx?: string; accent: string; series: string; appear: number }> = ({ label, clock, tick, local, ctx, accent, series, appear }) => {
  let shown = clock ?? "";
  const pc = clock ? parseClock(clock) : null;
  if (pc && tick) shown = fmtClock(tick === "down" ? pc.secs - local : pc.secs + local, pc.parts);
  const urgent = pc && tick === "down" && pc.secs - local < 60;
  const a = easeOut(appear / 0.5);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 56, top: 260, transform: `translateY(${(1 - a) * -40}px)`, opacity: a }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 24, letterSpacing: 3, color: "#ffffffcc", marginBottom: 8, textShadow: "0 2px 6px #000a" }}>{label}</div>
        {shown && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "#0d0f14e6", border: `4px solid ${urgent ? "#ff3b30" : accent}`, borderRadius: 18, padding: "8px 22px 8px 14px", boxShadow: "0 8px 24px #0008" }}>
            <svg width="38" height="38" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke={urgent ? "#ff3b30" : accent} strokeWidth="4" />
              <line x1="20" y1="20" x2="20" y2="9" stroke={urgent ? "#ff3b30" : accent} strokeWidth="4" strokeLinecap="round" />
              <line x1="20" y1="20" x2={20 + 8 * Math.cos(local * 3)} y2={20 + 8 * Math.sin(local * 3)} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 50, color: urgent ? "#ff5b50" : "#fff", letterSpacing: 1 }}>{shown}</span>
          </div>
        )}
        {ctx && <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: "#e9edf5", marginTop: 12, textShadow: "0 2px 8px #000" }}>{ctx}</div>}
      </div>
      <div style={{ position: "absolute", right: 48, top: 266, fontFamily: INTER, fontWeight: 900, fontSize: 24, letterSpacing: 2, color: "#fff", background: accent, padding: "8px 16px", borderRadius: 10, opacity: a, boxShadow: "0 6px 18px #0007" }}>{series}</div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- Untertitel */

export type Chunk = { words: Word[]; s: number; e: number };

export function chunkWords(words: Word[], max = 3): Chunk[] {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  for (const w of words) {
    if (!/[\p{L}\p{N}]/u.test(w.w)) continue; // reine Satzzeichen (– …) nicht anzeigen
    cur.push(w);
    const len = cur.map((x) => x.w).join(" ").length;
    if (cur.length >= max || /[.!?:,;–]$/.test(w.w) || len > 16) flush();
  }
  flush();
  return out;
}

const STOP = new Set(["der", "die", "das", "und", "ein", "eine", "in", "im", "zu", "von", "mit", "auf", "es", "du", "ist", "nicht", "den", "dem", "des", "an", "am", "sich", "wie", "als", "für", "aber", "noch", "nur", "so", "oder", "dann", "doch", "man", "sie", "er", "wir", "ihr", "dir", "dich", "dein", "deine"]);

export const Captions: React.FC<{ chunks: Chunk[]; time: number; accent: string; y?: number }> = ({ chunks, time, accent, y = 1090 }) => {
  let idx = -1;
  for (let i = 0; i < chunks.length; i++) if (time >= chunks[i].s - 0.05) idx = i;
  if (idx < 0) return null;
  const c = chunks[idx];
  const next = chunks[idx + 1];
  if (!next && time > c.e + 0.6) return null;
  const age = time - c.s;
  const pop = 0.82 + 0.18 * easeOut(age / 0.12);
  // Schlüsselwort: längstes Nicht-Stoppwort bzw. Zahl
  let key = -1, best = 0;
  c.words.forEach((w, i) => {
    const clean = w.w.replace(/[^\p{L}\p{N}]/gu, "");
    const score = /\d/.test(clean) ? 99 : STOP.has(clean.toLowerCase()) ? 0 : clean.length;
    if (score > best) { best = score; key = i; }
  });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `scale(${pop})`, transformOrigin: "50% 50%" }}>
      {c.words.map((w, i) => {
        const active = time >= w.s && time < w.e + 0.08;
        const color = i === key ? accent : active ? "#fff" : "#f2f2f2";
        return (
          <span key={i} style={{ fontFamily: ANTON, fontSize: 104, lineHeight: 1.08, color, textTransform: "uppercase", letterSpacing: 1, WebkitTextStroke: "10px #000", paintOrder: "stroke fill", textShadow: "0 8px 0 #000, 0 12px 30px #000c", opacity: time >= w.s - 0.04 ? 1 : 0.55 }}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- Overlays */

export const Card: React.FC<{ kicker: string; title: string; t: number; accent: string; y?: number }> = ({ kicker, title, t, accent, y = 540 }) => {
  const a = easeOut(t / 0.35);
  const rot = (1 - a) * -8 + -1.5;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: a, transform: `translateY(${(1 - a) * 80}px) rotate(${rot}deg) scale(${0.9 + 0.1 * a})` }}>
      <div style={{ background: "#f4f0e6", borderRadius: 16, padding: "48px 56px 40px", minWidth: 640, maxWidth: 900, boxShadow: "0 24px 60px #000a, 0 0 0 6px #00000022", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", background: accent, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 30, letterSpacing: 3, padding: "8px 22px", borderRadius: 10, whiteSpace: "nowrap", boxShadow: "0 6px 14px #0006" }}>{kicker}</div>
        <div style={{ fontFamily: ANTON, fontSize: title.length > 18 ? 76 : 96, lineHeight: 1.04, color: "#15171c", textTransform: "uppercase" }}>{title}</div>
        <div style={{ height: 8, background: shade(accent, 0), width: 120, margin: "22px auto 0", borderRadius: 4 }} />
      </div>
    </div>
  );
};

export const Stat: React.FC<{ title: string; rows: [string, string][]; t: number; accent: string }> = ({ title, rows, t, accent }) => {
  const a = easeOut(t / 0.3);
  return (
    <div style={{ position: "absolute", left: 56, top: 500, opacity: a, transform: `translateX(${(1 - a) * -60}px)` }}>
      <div style={{ background: "#11141ae8", borderRadius: 18, overflow: "hidden", minWidth: 560, boxShadow: "0 16px 40px #0009", border: "3px solid #ffffff1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 26px", background: "#ffffff10" }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: accent }} />
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 30, letterSpacing: 2, color: "#fff" }}>{title}</div>
        </div>
        {rows.map(([k, v], i) => {
          const ra = easeOut((t - 0.15 - i * 0.12) / 0.25);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 40, padding: "16px 26px", borderTop: "2px solid #ffffff12", opacity: ra, transform: `translateY(${(1 - ra) * 14}px)` }}>
              <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 32, color: "#c9d1dc", letterSpacing: 1 }}>{k}</span>
              <span style={{ fontFamily: ANTON, fontSize: 44, color: i === rows.length - 1 ? accent : "#fff" }}>{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Big: React.FC<{ value: string; sub: string; t: number; accent: string }> = ({ value, sub, t, accent }) => {
  const a = easeOut(t / 0.25);
  const sc = 1.6 - 0.6 * a;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 540, textAlign: "center", opacity: a }}>
      <div style={{ fontFamily: ANTON, fontSize: value.length > 7 ? 170 : 240, lineHeight: 1, color: "#fff", transform: `scale(${sc})`, WebkitTextStroke: "12px #000", paintOrder: "stroke fill", textShadow: `0 10px 0 #000, 0 0 60px ${accent}aa` }}>{value}</div>
      <div style={{ display: "inline-block", marginTop: 18, background: accent, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 34, letterSpacing: 3, padding: "10px 24px", borderRadius: 10 }}>{sub}</div>
    </div>
  );
};

export const Quote: React.FC<{ text: string; who: string; t: number; accent: string }> = ({ text, who, t, accent }) => {
  const a = easeOut(t / 0.4);
  const chars = Math.floor(text.length * clamp(t / Math.max(0.6, text.length * 0.035)));
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 520, opacity: a }}>
      <div style={{ background: "#0b0d12e0", borderLeft: `12px solid ${accent}`, borderRadius: 14, padding: "40px 44px", boxShadow: "0 20px 50px #000a" }}>
        <div style={{ fontFamily: "Georgia, 'DejaVu Serif', serif", fontSize: 140, lineHeight: 0.6, color: accent, height: 60 }}>„</div>
        <div style={{ fontFamily: "Georgia, 'DejaVu Serif', serif", fontStyle: "italic", fontSize: text.length > 50 ? 56 : 72, lineHeight: 1.2, color: "#fff" }}>
          {text.slice(0, chars)}
          <span style={{ opacity: 0 }}>{text.slice(chars)}</span>
        </div>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: "#aab4c3", marginTop: 26 }}>— {who.toUpperCase()}</div>
      </div>
    </div>
  );
};

export const EndCard: React.FC<{ next: string | null; t: number; accent: string; day: number; label?: string }> = ({ next, t, accent, day, label }) => {
  const a = easeOut(t / 0.35);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>
      {next ? (
        <>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 28, letterSpacing: 4, color: "#fff", background: "#000a", padding: "6px 16px", borderRadius: 8 }}>{label ? `${label} ${day + 1}` : `MORGEN · TAG ${day + 1}`}</div>
          <div style={{ fontFamily: ANTON, fontSize: 58, color: "#fff", textAlign: "center", maxWidth: 900, textTransform: "uppercase", WebkitTextStroke: "6px #000", paintOrder: "stroke fill" }}>{next}</div>
        </>
      ) : null}
      <div style={{ marginTop: 6, fontFamily: INTER, fontWeight: 900, fontSize: 34, color: "#fff", background: accent, padding: "12px 30px", borderRadius: 40, boxShadow: "0 8px 20px #0008" }}>{label && /NEXT|TOMORROW/.test(label) ? "FOLLOW TO GET IN ➜" : "FOLGEN FÜR MEHR ➜"}</div>
    </div>
  );
};

/* ---------------------------------------------------------------- FX */

export const Particles: React.FC<{ kind: string; g: number; seed: number }> = ({ kind, g, seed }) => {
  const r = rng(seed + kind.length * 31);
  const n = kind === "rain" ? 120 : kind === "embers" ? 70 : 110;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }).map((_, i) => {
        const x0 = r() * W, sp = 0.5 + r(), sz = 2 + r() * 5, ph = r() * 1000;
        if (kind === "rain") {
          const y = (ph + g * 1400 * sp) % (H + 200) - 100;
          const x = (x0 - g * 200 * sp) % W;
          return <line key={i} x1={x < 0 ? x + W : x} y1={y} x2={(x < 0 ? x + W : x) - 18} y2={y + 60} stroke="#b9d3ea" strokeWidth={2} opacity={0.5} />;
        }
        if (kind === "embers") {
          const y = H - ((ph + g * 220 * sp) % (H + 100));
          const x = x0 + Math.sin(g * 2 + i) * 30;
          return <circle key={i} cx={x} cy={y} r={sz * 0.7} fill={i % 3 ? "#ff9b2c" : "#ffd166"} opacity={0.85} />;
        }
        const speed = kind === "snow" ? 110 : 70;
        const y = (ph + g * speed * sp) % (H + 50) - 25;
        const x = x0 + Math.sin(g * 0.8 + i) * 40;
        return <circle key={i} cx={x} cy={y} r={kind === "snow" ? sz : sz * 0.8} fill={kind === "snow" ? "#ffffff" : "#5a534d"} opacity={kind === "snow" ? 0.85 : 0.75} />;
      })}
    </svg>
  );
};

export const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  const r = rng(frame * 7919);
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.22, pointerEvents: "none" }}>
      <Img src={staticFile("grain.png")} style={{ position: "absolute", left: -Math.floor(r() * 256), top: -Math.floor(r() * 256), width: W + 512, height: H + 512, objectFit: "none" }} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
);

export const TopShade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 70%, rgba(0,0,0,0.35) 100%)", pointerEvents: "none" }} />
);

export const Progress: React.FC<{ p: number; accent: string }> = ({ p, accent }) => (
  <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: `${p * 100}%`, background: accent, boxShadow: `0 0 12px ${accent}` }} />
);
