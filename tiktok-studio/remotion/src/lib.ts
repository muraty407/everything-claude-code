export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Deterministischer Zufall (Remotion rendert parallel → kein Math.random)
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Tod = "day" | "dusk" | "night" | "dawn" | "storm" | "sunset";

export const SKY: Record<Tod, [string, string, string]> = {
  day: ["#5aa9e6", "#9fd3f5", "#e3f4ff"],
  dusk: ["#1f1638", "#7a3b5e", "#f0915a"],
  night: ["#03050c", "#0c1426", "#1d2a48"],
  dawn: ["#2c3a5c", "#8a6d8f", "#f6c28b"],
  storm: ["#141a22", "#2b3440", "#4a5663"],
  sunset: ["#3b0d2a", "#c0392b", "#f7b267"],
};

export function todFrom(flags: string[], fallback: Tod = "day"): Tod {
  for (const f of ["day", "dusk", "night", "dawn", "storm", "sunset"] as Tod[]) {
    if (flags.includes(f)) return f;
  }
  return fallback;
}

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  if (amt >= 0) {
    r = r + (255 - r) * amt;
    g = g + (255 - g) * amt;
    b = b + (255 - b) * amt;
  } else {
    r = r * (1 + amt);
    g = g * (1 + amt);
    b = b * (1 + amt);
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

export type Seg = {
  text: string;
  scene: string;
  clock?: string;
  ctx?: string;
  card?: { kicker: string; title: string };
  stat?: { title: string; rows: [string, string][] };
  big?: { value: string; sub: string };
  quote?: { text: string; who: string };
  map?: { label: string; sub: string };
  fx?: string[];
  voice?: string;
  you?: boolean;
  phone?: { from: string; msgs: string[]; battery?: number; net?: string }; // POV: Handy-Nachricht
  img?: string; // Plan B: echtes Foto (Pfad in public/), ersetzt die Grafik-Szene
};

export type Day = {
  id: string;
  day: number;
  title: string;
  accent: string;
  series: string;
  next: string | null;
  hud: { label: string; tick: "up" | "down" | null };
  thumb: { top: string; bottom: string; tag: string; kicker: string; scene: string };
  hook?: boolean; // v2: großer Hook-Titel in den ersten Sekunden (Retention)
  punch?: { word: string; match: string }; // v3-Hook: Schlagwort mit Knall statt Titel
  pov?: boolean; // POV-Story: Ich-Perspektive (eigener Arm), Kamera wackelt beim Gehen
  next_label?: string; // z. B. "MORGEN · EXTRA" für Slot B
  segments: Seg[];
};

export type Word = { w: string; s: number; e: number };
export type TSeg = { i: number; start: number; end: number; speech_end: number; voice: string; words: Word[] };
export type Timeline = { id: string; duration: number; segments: TSeg[] };

export type Props = { day: Day; timeline: Timeline; still?: boolean };

export function parseScene(s: string) {
  const [preset, rest] = s.split(":");
  return { preset, flags: rest ? rest.split(",") : [] };
}
