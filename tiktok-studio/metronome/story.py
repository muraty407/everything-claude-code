# -*- coding: utf-8 -*-
"""Sync-Story: N Geräte (Waschmaschinen, Ventilatoren …) finden über den gemeinsamen Boden einen Rhythmus.
Mit Story-Ereignissen: eines schert aus → Stromausfall → Neustart → Resync. Gibt Phasen pro Frame aus.

    python3 metronome/story.py <out.json> [--seed 5] [--n 100]
"""
import argparse
import json

import numpy as np

FPS = 30
# (Zeit s, Ereignis)
EVENTS = [(19.0, "rebel"), (27.0, "blackout"), (29.5, "power"), (46.0, "end")]


def run(seed, n, f0=2.0, spread=0.015, k_max=2.2, ramp=16.0):
    rng = np.random.default_rng(seed)
    w = 2 * np.pi * f0 * (1 + spread * rng.standard_normal(n))
    ph = rng.uniform(0, 2 * np.pi, n)
    end = [t for t, e in EVENTS if e == "end"][0]
    sub, dt = 8, 1 / FPS / 8
    frames, thumps, t0, power, rebel = [], [], 0.0, True, -1
    last = np.floor(ph / (2 * np.pi))
    done = set()
    for f in range(int(end * FPS)):
        t = f / FPS
        for te, e in EVENTS:
            if t >= te and te not in done:
                done.add(te)
                if e == "rebel":
                    rebel = int(rng.integers(0, n))
                    ph[rebel] += np.pi * 0.9
                elif e == "blackout":
                    power = False
                elif e == "power":
                    power, t0 = True, t
                    ph = rng.uniform(0, 2 * np.pi, n)
                    last = np.floor(ph / (2 * np.pi))
        if power:
            k = k_max * min(1.0, (t - t0) / ramp) ** 1.4 if t0 > 0 else k_max * min(1.0, t / ramp) ** 1.4
            if t0 > 0:
                k *= 1.25  # nach dem Neustart etwas schneller
            for _ in range(sub):
                z = np.mean(np.exp(1j * ph))
                ph = ph + dt * (w + k * np.abs(z) * np.sin(np.angle(z) - ph))
            cur = np.floor(ph / (2 * np.pi))
            for i in np.nonzero(cur != last)[0]:
                thumps.append([round(t, 3), int(i)])
            last = cur
        z = np.mean(np.exp(1j * ph))
        dev = np.angle(np.exp(1j * (ph - np.angle(z))))
        insync = int(np.sum(np.abs(dev) < 0.35)) if power else 0
        frames.append({"p": [round(float(v % (2 * np.pi)), 2) for v in ph], "d": [round(float(v), 2) for v in dev],
                       "r": round(float(np.abs(z)), 3), "m": round(float(np.angle(z) % (2 * np.pi)), 3), "s": insync, "on": power})
    return {"fps": FPS, "n": n, "frames": frames, "thumps": thumps, "events": EVENTS, "rebel": rebel}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--seed", type=int, default=5)
    ap.add_argument("--n", type=int, default=100)
    a = ap.parse_args()
    d = run(a.seed, a.n)
    for s in range(0, 46, 3):
        print(f"t={s:2d}s in sync={d['frames'][s * FPS]['s']:3d}")
    json.dump(d, open(a.out, "w"))
