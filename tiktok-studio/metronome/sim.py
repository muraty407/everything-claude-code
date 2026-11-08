# -*- coding: utf-8 -*-
"""Metronom-Synchronisation (Kuramoto-Modell, gekoppelt über ein rollendes Brett).

N Metronome starten mit zufälliger Phase und leicht unterschiedlichem Takt. Das Brett bewegt sich mit dem
mittleren Schwung aller Pendel mit → koppelt sie → nach ~15 s schlagen alle im selben Takt.

    python3 metronome/sim.py <out.json> [--seed 7] [--n 100] [--dur 24]
"""
import argparse
import json

import numpy as np

FPS = 30


def run(seed, n, dur, f0=1.55, spread=0.018, k_max=1.6, ramp=14.0):
    rng = np.random.default_rng(seed)
    w = 2 * np.pi * f0 * (1 + spread * rng.standard_normal(n))
    ph = rng.uniform(0, 2 * np.pi, n)
    sub = 8
    dt = 1 / FPS / sub
    frames, ticks = [], []
    last = np.floor(ph / np.pi)
    for f in range(int(dur * FPS)):
        t = f / FPS
        k = k_max * min(1.0, t / ramp) ** 1.5  # Kopplung wächst, während das Brett in Schwung kommt
        for _ in range(sub):
            z = np.mean(np.exp(1j * ph))
            ph = ph + dt * (w + k * np.abs(z) * np.sin(np.angle(z) - ph))
        cur = np.floor(ph / np.pi)
        for i in np.nonzero(cur != last)[0]:
            ticks.append([round(t, 3), int(i)])  # Tick an jedem Umkehrpunkt
        last = cur
        z = np.mean(np.exp(1j * ph))
        frames.append({"a": [round(float(v), 2) for v in np.sin(ph)], "x": round(float(np.mean(np.cos(ph))), 3), "r": round(float(np.abs(z)), 3),
                       "d": [round(float(v), 2) for v in np.angle(np.exp(1j * (ph - np.angle(z))))]})
    return {"fps": FPS, "n": n, "frames": frames, "ticks": ticks}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--n", type=int, default=100)
    ap.add_argument("--dur", type=float, default=24)
    a = ap.parse_args()
    d = run(a.seed, a.n, a.dur)
    rs = [fr["r"] for fr in d["frames"]]
    for s in range(0, int(a.dur), 2):
        print(f"t={s:2d}s sync={rs[s * FPS] * 100:5.1f}%")
    json.dump(d, open(a.out, "w"))
