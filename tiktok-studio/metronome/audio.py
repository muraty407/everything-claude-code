# -*- coding: utf-8 -*-
"""Tick-Sound für die Metronom-Simulation: jeder Umkehrpunkt = ein Holz-Klick (synthetisch).
Chaos klingt wie Regen, Synchron wird zu einem einzigen lauten Schlag.

    python3 metronome/audio.py <sim.json> <out.wav>
"""
import json
import sys
import wave

import numpy as np

SR = 44100


def click(rng, pitch):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * pitch * t) * np.exp(-t / 0.008) + 0.6 * np.sin(2 * np.pi * pitch * 2.7 * t) * np.exp(-t / 0.004)
    noise = rng.standard_normal(n) * np.exp(-t / 0.002) * 0.5
    return body + noise


def main():
    d = json.load(open(sys.argv[1]))
    total = int((len(d["frames"]) / d["fps"] + 0.3) * SR)
    rng = np.random.default_rng(3)
    mix = np.zeros(total)
    pitches = 1800 + 400 * rng.random(d["n"])
    cache = {}
    for t, i in d["ticks"]:
        a = int(t * SR) + int(rng.integers(0, 60))
        if i not in cache:
            cache[i] = click(rng, pitches[i])
        c = cache[i]
        b = min(total, a + len(c))
        mix[a:b] += 0.05 * c[: b - a]
    # leiser Raumklang
    k = int(0.03 * SR)
    mix += 0.25 * np.concatenate([np.zeros(k), mix[:-k]])
    mix /= np.max(np.abs(mix)) / 0.9
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    main()
