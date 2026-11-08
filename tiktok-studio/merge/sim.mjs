// Merge-Physik-Simulation (zweiter Kanal): Objekte fallen durch den Hals in einen runden Kolben,
// zwei gleiche verschmelzen zur nächsten Stufe. Läuft deterministisch (eigener Zufall + feste Zeitschritte)
// und schreibt alle Positionen pro Video-Frame → Remotion zeichnet sie nur noch.
//
//   node merge/sim.mjs <theme.json> <out.json> [--seed N | --search A-B] [--min 40] [--max 65]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "../remotion/package.json"));
const Matter = require("matter-js");
const { Engine, Bodies, Composite, Body, Events } = Matter;

const FPS = 30, SUB = 2; // 60 Hz Physik, 30 fps Video
export const FLASK = { cx: 540, cy: 1080, r: 420, neck: 64, neckTop: 170 };

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate(theme, seed, maxSec = 80) {
  const R = theme.tiers.map((t) => t.r);
  const top = R.length - 1;
  const rand = rng(seed);
  const engine = Engine.create({ gravity: { x: 0, y: 1.1 } });
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  const { cx, cy, r, neck, neckTop } = FLASK;
  const walls = [];
  const N = 140, th = 40;
  const neckY = cy - Math.sqrt(r * r - neck * neck); // wo der Hals auf den Kreis trifft
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = cx + Math.cos(a) * (r + th / 2), y = cy + Math.sin(a) * (r + th / 2);
    if (y < cy && Math.abs(x - cx) < neck + 6) continue; // Öffnung oben
    walls.push(Bodies.rectangle(x, y, th, (2 * Math.PI * (r + th)) / N + 4, { isStatic: true, angle: a, friction: 0.05 }));
  }
  walls.push(Bodies.rectangle(cx - neck - 20, (neckTop + neckY) / 2 - 20, 40, neckY - neckTop + 60, { isStatic: true }));
  walls.push(Bodies.rectangle(cx + neck + 20, (neckTop + neckY) / 2 - 20, 40, neckY - neckTop + 60, { isStatic: true }));
  Composite.add(engine.world, walls);

  const tierOf = new Map();
  let nextId = 1;
  const add = (tier, x, y, vx = 0, vy = 0) => {
    const b = Bodies.circle(x, y, R[tier], { restitution: 0.15, friction: 0.02, frictionAir: 0.004, density: 0.0015 });
    b.plugin = { id: nextId++, tier };
    Body.setVelocity(b, { x: vx, y: vy });
    Composite.add(engine.world, b);
    tierOf.set(b.id, b);
    return b;
  };

  let pending = [];
  const collect = (ev) => {
    for (const p of ev.pairs) {
      const a = p.bodyA, b = p.bodyB;
      if (a.plugin?.tier === undefined || b.plugin?.tier === undefined) continue;
      if (a.plugin.tier === b.plugin.tier && a.plugin.tier < top) pending.push([a, b]);
    }
  };
  Events.on(engine, "collisionStart", collect);
  Events.on(engine, "collisionActive", collect);

  const frames = [], events = [];
  let maxTier = 0, topAt = null, spawnCd = 0, f = 0;
  const weights = theme.spawn; // z. B. [0.4, 0.3, 0.2, 0.1]
  for (; f < maxSec * FPS; f++) {
    // Nachschub oben in den Hals
    if (topAt === null && --spawnCd <= 0) {
      const blocked = Composite.allBodies(engine.world).some((b) => !b.isStatic && b.position.y < neckTop + 60);
      if (!blocked) {
        let u = rand(), t = 0;
        while (t < weights.length - 1 && u > weights[t]) { u -= weights[t]; t++; }
        add(t, cx + (rand() - 0.5) * 20, neckTop - 40, 0, 10);
        events.push({ f, type: "drop", tier: t });
        spawnCd = theme.every ?? 5;
      }
    }
    for (let s = 0; s < SUB; s++) {
      pending = [];
      Engine.update(engine, 1000 / 60);
      const used = new Set();
      for (const [a, b] of pending) {
        if (used.has(a.id) || used.has(b.id) || !tierOf.has(a.id) || !tierOf.has(b.id)) continue;
        used.add(a.id); used.add(b.id);
        const t = a.plugin.tier + 1;
        const x = (a.position.x + b.position.x) / 2, y = (a.position.y + b.position.y) / 2;
        Composite.remove(engine.world, a); Composite.remove(engine.world, b);
        tierOf.delete(a.id); tierOf.delete(b.id);
        add(t, x, y, (a.velocity.x + b.velocity.x) / 2, (a.velocity.y + b.velocity.y) / 2 - 2);
        events.push({ f, type: "merge", tier: t, x: Math.round(x), y: Math.round(y) });
        if (t > maxTier) maxTier = t;
        if (t === top && topAt === null) topAt = f;
      }
    }
    const bodies = [];
    for (const b of tierOf.values()) bodies.push([b.plugin.id, b.plugin.tier, Math.round(b.position.x), Math.round(b.position.y), +b.angle.toFixed(2)]);
    frames.push(bodies);
    // Überlauf → Versuch gescheitert
    if (topAt === null && Composite.allBodies(engine.world).filter((b) => !b.isStatic && b.position.y < neckTop + 30).length > 2 && f > 300) {
      return { ok: false, reason: "overflow@" + (f / FPS).toFixed(0) + "s", f };
    }
    if (topAt !== null && f > topAt + FPS * 3.5) break;
  }
  const drops = events.filter((e) => e.type === "drop").length;
  const last = frames[frames.length - 1] || [];
  const fill = last.reduce((s, b) => s + R[b[1]] ** 2, 0) / (r * r);
  return { ok: topAt !== null, topAt, frames, events, maxTier, duration: frames.length / FPS, reason: `drops=${drops} bodies=${last.length} fill=${fill.toFixed(2)}` };
}

const args = process.argv.slice(2);
const theme = JSON.parse(fs.readFileSync(args[0], "utf8"));
const out = args[1];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const minS = +opt("--min", 40), maxS = +opt("--max", 65);
let seeds = [];
if (args.includes("--seed")) seeds = [+opt("--seed")];
else { const [a, b] = opt("--search", "1-60").split("-").map(Number); for (let s = a; s <= b; s++) seeds.push(s); }
for (const seed of seeds) {
  const res = simulate(theme, seed, maxS + 10);
  const t = res.topAt != null ? (res.topAt / FPS).toFixed(1) : "-";
  console.log(`seed ${seed}: ${res.ok ? "✓" : "✗"} top bei ${t}s ${res.reason ?? ""} (max tier ${res.maxTier ?? "?"})`);
  if (res.ok && res.topAt / FPS >= minS && res.topAt / FPS <= maxS) {
    fs.writeFileSync(out, JSON.stringify({ seed, theme, flask: FLASK, fps: FPS, topAt: res.topAt, duration: res.duration, frames: res.frames, events: res.events }));
    console.log(`→ ${out} (${res.duration.toFixed(1)} s)`);
    process.exit(0);
  }
}
console.log("kein passender Seed gefunden");
process.exit(1);
