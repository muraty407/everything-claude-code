# -*- coding: utf-8 -*-
"""Erzeugt eigene, lizenzfreie Spannungs-Musik in Stereo (reine Synthese mit numpy) → assets/music/track<N>.wav

Aufbau wie ein Doku-/Thriller-Bett: Bass-Puls (Achtel), Flächen-Akkorde, Arpeggio (links/rechts wandernd),
weiche Kick + Hi-Hat, alle 8 Takte ein kleiner Aufbau. Drei Varianten (Tonart/Tempo), damit nicht jedes Video
gleich klingt.           python3 pipeline/music.py
"""
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "music")
SR = 48000


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def adsr(n, a=0.01, d=0.2, s=0.6, r=0.2):
    t = np.arange(n) / SR
    L = n / SR
    e = np.minimum(1, t / a) * (s + (1 - s) * np.exp(-t / d))
    return e * np.clip((L - t) / r, 0, 1)


def saw(f, n, det=0.0):
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 9):  # bandbegrenzt
        x += np.sin(2 * np.pi * f * (1 + det) * k * t) / k
    return x * 0.5


def lp(x, a):  # einfacher Tiefpass
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def track(root, bpm, prog, seed, bars=32):
    rng = np.random.default_rng(seed)
    beat = 60 / bpm
    bar = 4 * beat
    n = int(bars * bar * SR)
    L, R = np.zeros(n), np.zeros(n)

    def put(x, t0, pan=0.0, g=1.0):
        i = int(t0 * SR)
        if i >= n:
            return
        j = min(n, i + len(x))
        L[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 - pan))
        R[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 + pan))

    for b in range(bars):
        ch = prog[b % len(prog)]  # Halbtöne über dem Grundton: (grund, terz, quinte)
        t0 = b * bar
        lift = 1.0 if (b % 8) >= 6 else 0.8  # Takt 7/8: etwas mehr Druck
        # Fläche (zwei leicht verstimmte Sägen je Ton, weit im Stereo)
        for k, iv in enumerate(ch):
            f = note(root + 12 + iv)
            m = int((bar + 0.4) * SR)
            env = adsr(m, 0.5, 2.0, 0.8, 0.6)
            put(lp(saw(f / 2, m, -0.004), 0.035) * env, t0, pan=-0.7 + 0.2 * k, g=0.16)
            put(lp(saw(f / 2, m, +0.005), 0.035) * env, t0, pan=0.7 - 0.2 * k, g=0.16)
        # tiefer Drone (Grundton + Quinte), langsam atmend
        m = int(bar * SR)
        t = np.arange(m) / SR
        dr = (np.sin(2 * np.pi * note(root - 12) * t) + 0.5 * np.sin(2 * np.pi * note(root - 5) * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * t / bar))
        put(dr, t0, 0.0, 0.16)
        # Bass-Puls in Achteln
        for e in range(8):
            m = int(beat / 2 * 0.95 * SR)
            x = lp(saw(note(root - 12 + ch[0]), m), 0.09) * adsr(m, 0.005, 0.12, 0.35, 0.05)
            put(x, t0 + e * beat / 2, 0.0, 0.42 * (1.0 if e % 2 == 0 else 0.7) * lift)
        # Arpeggio in Sechzehnteln, wandert links ↔ rechts
        arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]
        for s in range(16):
            if b < 2 and s % 2:
                continue  # Einstieg dünner
            m = int(beat / 4 * 1.8 * SR)
            t = np.arange(m) / SR
            f = note(root + 12 + arp[s % 8])
            x = lp(saw(f, m), 0.12) * np.exp(-t / 0.07)
            put(x, t0 + s * beat / 4, pan=0.8 * np.sin(s / 16 * 2 * np.pi + b), g=0.11 * lift)
        # Kick auf 1 und 3, Hi-Hat auf den Off-Beats
        for q in range(4):
            if q % 2 == 0:
                m = int(0.28 * SR)
                t = np.arange(m) / SR
                x = np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 32)) / SR) * np.exp(-t / 0.09)
                put(x, t0 + q * beat, 0.0, 0.55)
            m = int(0.05 * SR)
            h = np.diff(rng.standard_normal(m + 1)) * np.exp(-np.arange(m) / SR / 0.012)
            put(h, t0 + q * beat + beat / 2, pan=0.35 if q % 2 else -0.35, g=0.06)
        # kleiner Aufbau vor jedem 8. Takt
        if b % 8 == 7:
            m = int(bar * SR)
            t = np.arange(m) / SR
            x = lp(rng.standard_normal(m), 0.25) * (t / bar) ** 2.5
            put(x, t0, 0.0, 0.10)
    # leichter Hall (Stereo-versetzt) + Normalisierung
    for ch_, d in ((L, 0.137), (R, 0.171)):
        k = int(d * SR)
        ch_[k:] += 0.22 * ch_[:-k].copy()
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    fade = np.minimum(1, np.arange(n) / (0.05 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
    return np.stack([L * fade, R * fade], axis=1) / peak * 0.85


VARIANTS = [
    # (grundton MIDI, bpm, akkordfolge als (grund, terz, quinte) in Halbtönen)
    (45, 100, [(0, 3, 7), (8, 12, 15), (5, 8, 12), (7, 11, 14)], 1),   # a-Moll: Am F Dm E
    (40, 108, [(0, 3, 7), (0, 3, 7), (8, 12, 15), (10, 14, 17)], 2),   # e-Moll: Em Em C D
    (43, 94, [(0, 3, 7), (5, 8, 12), (3, 7, 10), (10, 14, 17)], 3),    # g-Moll: Gm Cm Bb F
]

def club(bpm=124, bars=16, seed=5):
    """Club-Beat: Four-on-the-floor-Kick, Offbeat-Bass, Clap auf 2 und 4, Hi-Hats, Synth-Stabs (a-Moll)."""
    rng = np.random.default_rng(seed)
    beat = 60 / bpm
    n = int(bars * 4 * beat * SR)
    L, R = np.zeros(n), np.zeros(n)

    def put(x, t0, pan=0.0, g=1.0):
        i = int(t0 * SR)
        if i >= n:
            return
        j = min(n, i + len(x))
        L[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 - pan))
        R[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 + pan))

    roots = [45, 45, 41, 43]  # Am Am F G
    for b in range(bars):
        root = roots[b % 4]
        for q in range(4):
            t0 = (b * 4 + q) * beat
            m = int(0.3 * SR); t = np.arange(m) / SR
            put(np.sin(2 * np.pi * np.cumsum(45 + 130 * np.exp(-t * 35)) / SR) * np.exp(-t / 0.11), t0, 0, 0.95)   # Kick
            m = int(beat / 2 * 0.9 * SR)
            put(lp(saw(note(root - 12), m), 0.1) * adsr(m, 0.005, 0.1, 0.4, 0.04), t0 + beat / 2, 0, 0.5)           # Offbeat-Bass
            m = int(0.04 * SR)
            put(np.diff(rng.standard_normal(m + 1)) * np.exp(-np.arange(m) / SR / 0.01), t0 + beat / 2, 0.4, 0.09)   # Hi-Hat
            if q % 2 == 1:
                m = int(0.12 * SR)
                put(lp(rng.standard_normal(m), 0.5) * np.exp(-np.arange(m) / SR / 0.03), t0, -0.2, 0.3)             # Clap
        if b % 2 == 1:
            for k, st in enumerate((0, 1.5, 3)):                                                                       # Synth-Stabs
                m = int(0.22 * SR)
                x = sum(lp(saw(note(root + 12 + iv), m, 0.004 * iv), 0.2) for iv in (0, 3, 7)) * adsr(m, 0.005, 0.08, 0.3, 0.05)
                put(x, (b * 4 + st) * beat, 0.6 if k % 2 else -0.6, 0.11)
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    return np.stack([L, R], axis=1) / peak * 0.85


if __name__ == "__main__":
    os.makedirs(os.path.join(OUT, "club"), exist_ok=True)
    x = club()
    with wave.open(os.path.join(OUT, "club", "club1.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(f"club/club1.wav {len(x) / SR:.0f}s 124 BPM")
    os.makedirs(OUT, exist_ok=True)
    for i, (root, bpm, prog, seed) in enumerate(VARIANTS, start=1):
        x = track(root, bpm, prog, seed)
        with wave.open(os.path.join(OUT, f"track{i}.wav"), "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((x * 32767).astype(np.int16).tobytes())
        print(f"track{i}.wav {len(x) / SR:.0f}s {bpm} BPM")
