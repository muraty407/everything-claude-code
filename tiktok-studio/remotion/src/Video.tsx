import "@fontsource/anton";
import React, { useMemo } from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FPS, H, Props, W, clamp, easeOut, hashStr, parseScene, rng } from "./lib";
import { renderScene, You } from "./scenes";
import { PhoneBanner, PovArm, povCam } from "./pov";
import { World3D } from "./three/World";
import { Big, Captions, Card, EndCard, Hud, Particles, Progress, Quote, Stat, TopShade, Vignette, chunkWords } from "./ui";

const OVERLAP = 0.18; // Sekunden Überblendung zwischen Szenen
const HOOK_DUR = 2.8; // Sekunden, die der Hook-Titel am Anfang steht

// Folgen-Button: erscheint ab ~45 % des Videos für 2,6 s und zeigt auf TikToks echten
// Folgen-Knopf (Profilbild mit „+“ rechts, ca. y = 1000 px). Nicht am Anfang → schadet sonst der Retention.
const FollowButton: React.FC<{ time: number; start: number; accent: string; label: string; top?: number }> = ({ time, start, accent, label, top = 965 }) => {
  const t = time - start;
  if (t < 0 || t > 2.6) return null;
  const a = easeOut(t / 0.25) * clamp((2.6 - t) / 0.25);
  const tap = Math.max(0, Math.sin(t * 9)) * (t > 0.6 ? 1 : 0); // „Antippen“-Puls
  return (
    <div style={{ position: "absolute", right: 140, top, display: "flex", alignItems: "center", gap: 18, opacity: a, transform: `translateX(${(1 - a) * 80}px)` }}>
      <div style={{ background: accent, color: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 36, letterSpacing: 1, padding: "16px 26px", borderRadius: 60, boxShadow: "0 10px 30px #000a", display: "flex", alignItems: "center", gap: 14, transform: `scale(${1 + 0.06 * tap})` }}>
        <span style={{ fontSize: 44 }}>🔔</span>{label}
      </div>
      <svg width="110" height="90" viewBox="0 0 110 90" style={{ transform: `translateX(${8 * tap}px)` }}>
        <path d="M5 45 H80" stroke="#000" strokeWidth="22" strokeLinecap="round" />
        <path d="M5 45 H80" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
        <path d="M62 15 L100 45 L62 75 Z" fill="#fff" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// Großer Hook-Titel ab Frame 0 (wie das Cover) – entscheidet über die ersten 3 Sekunden
const HookTitle: React.FC<{ top: string; bottom: string; accent: string; time: number }> = ({ top, bottom, accent, time }) => {
  if (time >= HOOK_DUR) return null;
  const out = clamp((HOOK_DUR - time) / 0.25);
  const pop = 1 + 0.12 * (1 - easeOut(time / 0.18));
  const r = rng(Math.floor(time * FPS) * 7 + 3);
  const jx = time < 0.6 ? (r() - 0.5) * 10 : 0;
  const line = (txt: string, size: number, color: string) => (
    <div style={{ fontFamily: "Anton, sans-serif", fontSize: size, lineHeight: 0.98, color, textTransform: "uppercase", whiteSpace: "nowrap", WebkitTextStroke: "16px #000", paintOrder: "stroke fill", textShadow: "0 12px 0 #000, 0 0 60px #000a" }}>{txt}</div>
  );
  const fit = (t: string, max: number) => Math.min(max, Math.floor(940 / Math.max(1, t.length * 0.46)));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", opacity: out, transform: `translateX(${jx}px) rotate(-3deg) scale(${pop})` }}>
      {line(top, fit(top, 190), "#fff")}
      {line(bottom, fit(bottom, 210), accent)}
    </div>
  );
};

// v3-Hook: kein stehender Titel, sondern Sprache ab Frame 0 + ein großes Schlagwort mit Knall
const punchTime = (props: Props) => {
  const pu = props.day.punch;
  if (!pu) return -1;
  for (const s of props.timeline.segments) for (const w of s.words) if (w.w.toLowerCase().replace(/[^a-zäöüß]/g, "") === pu.match) return Math.max(0.3, w.s);
  return 1;
};
const PunchWord: React.FC<{ text: string; t: number; accent: string }> = ({ text, t, accent }) => {
  if (t < 0 || t > 1.6) return null;
  const a = easeOut(t / 0.12) * clamp((1.6 - t) / 0.25);
  const r = rng(Math.floor(t * 30) + 5);
  const j = t < 0.4 ? (r() - 0.5) * 18 : 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", opacity: a, transform: `translate(${j}px, ${j / 2}px) scale(${1.35 - 0.35 * easeOut(t / 0.2)}) rotate(-3deg)` }}>
      <span style={{ fontFamily: "Anton, sans-serif", fontSize: Math.min(230, Math.floor(1900 / Math.max(4, text.length * 0.92))), whiteSpace: "nowrap", color: accent, textTransform: "uppercase", WebkitTextStroke: "18px #000", paintOrder: "stroke fill", textShadow: "0 14px 0 #000, 0 0 80px #000" }}>{text}</span>
    </div>
  );
};

const SegmentView: React.FC<{ props: Props; i: number }> = ({ props, i }) => {
  const frame = useCurrentFrame(); // lokal in der Sequence
  const { day, timeline } = props;
  const seg = day.segments[i];
  const ts = timeline.segments[i];
  const t = frame / FPS;
  const g = ts.start + t;
  const dur = ts.end - ts.start;
  const { preset, flags } = parseScene(seg.scene);
  const seed = hashStr(day.id + seg.scene) % 100000;
  const fx = seg.fx ?? [];

  // Kamera: Punch-in beim Schnitt + langsamer Push
  const hookOpen = day.hook && !day.punch && i === 0 && t < HOOK_DUR;
  const punch = i === 0 ? (day.hook ? 0.22 * (1 - easeOut(t / 0.9)) : 0) : 0.1 * (1 - easeOut(t / 0.35));
  const push = 1.02 + 0.06 * clamp(t / Math.max(1, dur));
  const panX = Math.sin(seed) * 30 * clamp(t / Math.max(1, dur));
  let sx = 0, sy = 0;
  if (fx.includes("shake") || hookOpen) {
    const k = hookOpen ? Math.max(0.35, 1 - t / 1.2) : Math.max(0.15, 1 - t / 1.6);
    const r = rng(frame * 13 + seed);
    sx = (r() - 0.5) * 36 * k;
    sy = (r() - 0.5) * 36 * k;
  }
  if (day.pov) { const c = povCam(g); sx += c.x; sy += c.y; }
  const glitch = fx.includes("glitch") && Math.sin(g * 7.3) > 0.82;
  const ot = day.hook && !day.punch && i === 0 ? t - HOOK_DUR : t; // Overlays im 1. Segment erst nach dem Hook
  const fadeIn = i === 0 ? 1 : clamp(t / OVERLAP);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `translate(${sx + panX + (glitch ? 14 : 0)}px, ${sy}px) scale(${push + punch})`, filter: glitch ? "hue-rotate(40deg) saturate(1.6)" : undefined }}>
        {seg.s3d ? (
          <World3D sc={seg.s3d} t={t} dur={dur} width={W} height={H} shake={fx.includes("shake") ? Math.max(0, 1 - t / 1.2) : 0} />
        ) : seg.img ? (
          // Plan B: echtes Foto mit Ken-Burns-Schwenk (Richtung wechselt pro Segment)
          <Img src={staticFile(seg.img)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, objectFit: "cover",
            objectPosition: `${i % 2 ? 70 - 40 * clamp(t / Math.max(1, dur)) : 30 + 40 * clamp(t / Math.max(1, dur))}% 50%`,
            transform: `scale(${1.04 + 0.06 * clamp(t / Math.max(1, dur))})`, filter: "contrast(1.12) saturate(1.08)" }} />
        ) : (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {renderScene(preset, { flags, t, g, accent: day.accent, seed, label: seg.map?.label, sub: seg.map?.sub })}
            {seg.you && !day.pov && <You g={g} accent={day.accent} x={preset === "room" ? 360 : 300} y={1700} s={0.95} />}
          </svg>
        )}
      </AbsoluteFill>
      {seg.img && <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.7) 100%)" }} />}
      {glitch && <AbsoluteFill style={{ background: "linear-gradient(transparent 40%, rgba(255,0,80,0.18) 41%, transparent 44%, transparent 70%, rgba(0,255,220,0.15) 71%, transparent 73%)" }} />}
      {fx.includes("ash") && <Particles kind="ash" g={g} seed={seed} />}
      {fx.includes("snow") && <Particles kind="snow" g={g} seed={seed} />}
      {fx.includes("rain") && <Particles kind="rain" g={g} seed={seed} />}
      {fx.includes("embers") && <Particles kind="embers" g={g} seed={seed} />}
      {fx.includes("red") && <AbsoluteFill style={{ background: "#ff2a00", mixBlendMode: "multiply", opacity: 0.25 + 0.12 * Math.sin(g * 5) }} />}
      {fx.includes("dark") && <AbsoluteFill style={{ background: "#000", opacity: 0.6 * clamp(t / 1.5) }} />}
      {fx.includes("flash") && <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, 0.9 - t * 2.2) }} />}
      {hookOpen && <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 85%), linear-gradient(${day.accent}33, ${day.accent}33)`, opacity: clamp((HOOK_DUR - t) / 0.3) }} />}

      {day.pov && flags.includes("night") && (
        // Ich-Perspektive nachts: Handy-Taschenlampe leuchtet die Straße an (wackelt mit)
        <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(ellipse 46% 30% at ${50 + Math.sin(g * 1.3) * 6}% ${66 + Math.sin(g * 2.1) * 3}%, rgba(255,236,190,0.55) 0%, rgba(255,220,160,0.18) 45%, transparent 75%)` }} />
      )}
      {day.pov && <PovArm g={g} t={t} phone={seg.phone} accent={day.accent} />}
      {/* Overlays */}
      {seg.phone && <PhoneBanner phone={seg.phone} t={ot - 0.05} dur={dur} />}
      {seg.stat && <Stat title={seg.stat.title} rows={seg.stat.rows} t={ot - 0.15} accent={day.accent} />}
      {seg.card && <Card kicker={seg.card.kicker} title={seg.card.title} t={ot - 0.1} accent={day.accent} />}
      {seg.big && <Big value={seg.big.value} sub={seg.big.sub} t={ot - 0.05} accent={day.accent} />}
      {seg.quote && <Quote text={seg.quote.text} who={seg.quote.who} t={ot - 0.05} accent={day.accent} />}
    </AbsoluteFill>
  );
};

// Überlebens-Anzeige: sinkt von Szene zu Szene (wie die „?“-Leiste bei Daddyverse → Grund zum Dranbleiben)
const SurvivalMeter: React.FC<{ values: (number | null)[]; cur: number; local: number; accent: string }> = ({ values, cur, local }) => {
  const prev = cur > 0 ? values[cur - 1] ?? values[cur] : values[0];
  const tgt = values[cur];
  if (tgt === null || tgt === undefined) {
    return (
      <div style={{ position: "absolute", left: 60, right: 60, top: 400, textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 40, color: "#fff", textShadow: "0 3px 12px #000" }}>
        DEINE ÜBERLEBENSCHANCE: <span style={{ color: "#ffd23f" }}>?</span>
      </div>
    );
  }
  const v = (prev ?? tgt) + (tgt - (prev ?? tgt)) * easeOut(clamp(local / 0.8));
  const col = v > 60 ? "#39d353" : v > 30 ? "#ffb020" : "#ff3b30";
  const blink = v <= 15 && Math.sin(local * 10) > 0;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 395 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 30, color: "#fff", textShadow: "0 2px 8px #000", letterSpacing: 1 }}>
        <span>DEINE ÜBERLEBENSCHANCE</span><span style={{ color: col }}>{Math.round(v)} %</span>
      </div>
      <div style={{ marginTop: 8, height: 26, borderRadius: 13, background: "#000a", border: "3px solid #000", overflow: "hidden" }}>
        <div style={{ width: `${v}%`, height: "100%", background: col, opacity: blink ? 0.45 : 1, boxShadow: `0 0 20px ${col}` }} />
      </div>
    </div>
  );
};

export const WasWaereWenn: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const { day, timeline } = props;
  const time = frame / FPS;
  const total = timeline.duration;

  const chunks = useMemo(() => chunkWords(timeline.segments.flatMap((s) => s.words)), [timeline]);

  // aktuelles Segment
  let cur = 0;
  timeline.segments.forEach((s, i) => { if (time >= s.start) cur = i; });
  const ts = timeline.segments[cur];
  const seg = day.segments[cur];
  let ctx: string | undefined;
  for (let i = Math.max(0, cur - 1); i <= cur; i++) if (day.segments[i].ctx) ctx = day.segments[i].ctx;
  let clock: string | undefined;
  for (let i = 0; i <= cur; i++) if (day.segments[i].clock !== undefined) clock = day.segments[i].clock;
  const last = timeline.segments[timeline.segments.length - 1];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {timeline.segments.map((s, i) => {
        const from = Math.max(0, Math.round((s.start - (i === 0 ? 0 : OVERLAP)) * FPS));
        const to = Math.round((i === timeline.segments.length - 1 ? total : s.end + 0.02) * FPS);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
            <SegmentView props={props} i={i} />
          </Sequence>
        );
      })}
      <TopShade />
      <Vignette />
      <Hud label={day.hud.label} clock={clock} tick={day.hud.tick} local={time - ts.start} ctx={ctx} accent={day.accent} series={day.series} appear={time} />
      {!(day.hook && !day.punch && time < HOOK_DUR) && <Captions chunks={chunks} time={time} accent={day.accent} y={seg.card || seg.quote || seg.big ? 1180 : 1090} />}
      {time > last.speech_end + 0.1 && <EndCard next={day.next} t={time - last.speech_end - 0.1} accent={day.accent} day={day.day} label={day.next_label} />}
      {day.hook && !day.punch && <HookTitle top={day.thumb.top} bottom={day.thumb.bottom} accent={day.accent} time={time} />}
      {day.punch && <PunchWord text={day.punch.word} t={time - punchTime(props)} accent={day.accent} />}
      {day.punch && time - punchTime(props) >= 0 && time - punchTime(props) < 0.25 && <AbsoluteFill style={{ background: "#fff", opacity: 0.55 * (1 - (time - punchTime(props)) / 0.25) }} />}
      {day.hook && <FollowButton time={time} start={Math.max(day.punch ? 6 : HOOK_DUR + 3, total * 0.45)} accent={day.accent}
        label={/teil 1/i.test(day.title) ? "FOLGEN FÜR TEIL 2" : "FOLGEN – NICHTS VERPASSEN"}
        top={seg.scene === "map" ? 1250 : 965} />}
      {day.survival && time > 0.25 && <SurvivalMeter values={day.survival} cur={cur} local={time - ts.start} accent={day.accent} />}
      <Progress p={time / total} accent={day.accent} />
    </AbsoluteFill>
  );
};
