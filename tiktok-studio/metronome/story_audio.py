# -*- coding: utf-8 -*-
"""Musik + Geräusche für die Sync-Story (alles synthetisch, keine Lizenzfragen).

- jedes Gerät „wummst“ einmal pro Umdrehung → Chaos = Rumpeln, Sync = ein großer Schlag
- Beat folgt dem gemeinsamen Takt: Kick wird lauter, je mehr synchron sind; ab 50 % Hi-Hats; ab 99 % Bass + Melodie („Drop“)
- Stromausfall: Power-down-Sweep, Stille; Neustart: Power-up

    python3 metronome/story_audio.py <story.json> <out.wav>
"""
import json
import sys
import wave

import numpy as np

SR = 44100


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def tone(f, dur, amp, wave_="sine", a=0.005, d=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * f * t
    x = np.sin(ph) if wave_ == "sine" else (2 * (ph / (2 * np.pi) % 1) - 1)
    return amp * x * env(n, a, d)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.12)


def hat(rng):
    n = int(0.06 * SR)
    x = rng.standard_normal(n)
    x = np.diff(np.concatenate([[0], x]))  # Hochpass
    return x * env(n, 0.001, 0.015)


def thud(rng, f):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * rng.standard_normal(n) * np.exp(-t / 0.01)) * env(n, 0.003, 0.05)


def add(mix, at, x):
    a = int(at * SR)
    if a >= len(mix) or a < 0:
        return
    b = min(len(mix), a + len(x))
    mix[a:b] += x[: b - a]


def main():
    d = json.load(open(sys.argv[1]))
    fps, frames = d["fps"], d["frames"]
    total = int((len(frames) / fps + 0.5) * SR)
    rng = np.random.default_rng(4)
    mix = np.zeros(total)
    ev = {e: t for t, e in d["events"]}
    tB, tP = ev.get("blackout", 1e9), ev.get("power", 1e9)
    # Geräte-Wummsen
    th = {i: thud(rng, 55 + (i % 7) * 4) for i in range(d["n"])}
    for t, i in d["thumps"]:
        add(mix, t + rng.uniform(0, 0.004), 0.006 * th[i])
    # Beat: immer wenn die mittlere Phase 0 passiert (= gemeinsamer Takt)
    K, H = kick(), [hat(rng) for _ in range(4)]
    notes = [57, 60, 64, 67, 69, 67, 64, 60]  # A-Moll-Arpeggio
    beat = 0
    for k in range(1, len(frames)):
        a, b = frames[k - 1], frames[k]
        if not b["on"]:
            continue
        if b["m"] < a["m"] - 3:  # Phasen-Umbruch → Schlag
            t = k / fps
            s = b["s"] / d["n"]
            add(mix, t, 1.3 * s ** 2 * K)
            if s > 0.5:
                add(mix, t + 0.25, 0.25 * (s - 0.5) * 2 * H[beat % 4])
            if s >= 0.99:
                f = 440 * 2 ** ((notes[beat % 8] - 69) / 12)
                add(mix, t, tone(f / 4, 0.45, 0.35, "saw", 0.005, 0.2))
                add(mix, t + 0.25, tone(f, 0.25, 0.12, "sine", 0.005, 0.12))
            beat += 1
    # Pad (außer im Stromausfall)
    t = np.arange(total) / SR
    pad = sum(np.sin(2 * np.pi * 440 * 2 ** ((m - 69) / 12) * t) for m in (45, 52, 57, 60)) * 0.02
    pad *= 1.6
    pad *= np.where((t >= tB) & (t < tP), 0, 1) * np.minimum(1, t / 2)
    mix += pad
    # Stromausfall-Sweep + Neustart
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    add(mix, tB, 0.5 * np.sin(2 * np.pi * np.cumsum(220 * np.exp(-tt * 3) + 20) / SR) * np.exp(-tt / 0.6))
    add(mix, tB, 0.4 * rng.standard_normal(int(0.08 * SR)) * env(int(0.08 * SR), 0.001, 0.03))
    add(mix, tP, 0.35 * np.sin(2 * np.pi * np.cumsum(30 + 300 * (tt / 1.2) ** 2) / SR) * np.minimum(1, tt / 0.8) * np.exp(-tt / 1.5))
    mix /= np.max(np.abs(mix)) / 0.9
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    main()
