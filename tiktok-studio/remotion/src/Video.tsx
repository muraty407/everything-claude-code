import "@fontsource/anton";
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { FPS, H, Props, W, clamp, easeOut, hashStr, parseScene, rng } from "./lib";
import { renderScene, You } from "./scenes";
import { Big, Captions, Card, EndCard, Hud, Particles, Progress, Quote, Stat, TopShade, Vignette, chunkWords } from "./ui";

const OVERLAP = 0.18; // Sekunden Überblendung zwischen Szenen
const HOOK_DUR = 2.8; // Sekunden, die der Hook-Titel am Anfang steht

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
  const punch = i === 0 ? 0 : 0.1 * (1 - easeOut(t / 0.35));
  const push = 1.02 + 0.06 * clamp(t / Math.max(1, dur));
  const panX = Math.sin(seed) * 30 * clamp(t / Math.max(1, dur));
  let sx = 0, sy = 0;
  if (fx.includes("shake")) {
    const k = Math.max(0.15, 1 - t / 1.6);
    const r = rng(frame * 13 + seed);
    sx = (r() - 0.5) * 36 * k;
    sy = (r() - 0.5) * 36 * k;
  }
  const glitch = fx.includes("glitch") && Math.sin(g * 7.3) > 0.82;
  const ot = day.hook && i === 0 ? t - HOOK_DUR : t; // Overlays im 1. Segment erst nach dem Hook
  const fadeIn = i === 0 ? 1 : clamp(t / OVERLAP);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `translate(${sx + panX + (glitch ? 14 : 0)}px, ${sy}px) scale(${push + punch})`, filter: glitch ? "hue-rotate(40deg) saturate(1.6)" : undefined }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {renderScene(preset, { flags, t, g, accent: day.accent, seed, label: seg.map?.label, sub: seg.map?.sub })}
          {seg.you && <You g={g} accent={day.accent} x={preset === "room" ? 360 : 300} y={1700} s={0.95} />}
        </svg>
      </AbsoluteFill>
      {glitch && <AbsoluteFill style={{ background: "linear-gradient(transparent 40%, rgba(255,0,80,0.18) 41%, transparent 44%, transparent 70%, rgba(0,255,220,0.15) 71%, transparent 73%)" }} />}
      {fx.includes("ash") && <Particles kind="ash" g={g} seed={seed} />}
      {fx.includes("snow") && <Particles kind="snow" g={g} seed={seed} />}
      {fx.includes("rain") && <Particles kind="rain" g={g} seed={seed} />}
      {fx.includes("embers") && <Particles kind="embers" g={g} seed={seed} />}
      {fx.includes("red") && <AbsoluteFill style={{ background: "#ff2a00", mixBlendMode: "multiply", opacity: 0.25 + 0.12 * Math.sin(g * 5) }} />}
      {fx.includes("dark") && <AbsoluteFill style={{ background: "#000", opacity: 0.6 * clamp(t / 1.5) }} />}
      {fx.includes("flash") && <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, 0.9 - t * 2.2) }} />}

      {/* Overlays */}
      {seg.stat && <Stat title={seg.stat.title} rows={seg.stat.rows} t={ot - 0.15} accent={day.accent} />}
      {seg.card && <Card kicker={seg.card.kicker} title={seg.card.title} t={ot - 0.1} accent={day.accent} />}
      {seg.big && <Big value={seg.big.value} sub={seg.big.sub} t={ot - 0.05} accent={day.accent} />}
      {seg.quote && <Quote text={seg.quote.text} who={seg.quote.who} t={ot - 0.05} accent={day.accent} />}
    </AbsoluteFill>
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
      <Captions chunks={chunks} time={time} accent={day.accent} y={seg.card || seg.quote || seg.big ? 1180 : 1090} />
      {time > last.speech_end + 0.1 && <EndCard next={day.next} t={time - last.speech_end - 0.1} accent={day.accent} day={day.day} />}
      {day.hook && <HookTitle top={day.thumb.top} bottom={day.thumb.bottom} accent={day.accent} time={time} />}
      <Progress p={time / total} accent={day.accent} />
    </AbsoluteFill>
  );
};
