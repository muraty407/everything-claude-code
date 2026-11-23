# -*- coding: utf-8 -*-
"""Eigene Musik für den Fabel-Stil: dunkler, treibender Halftime-Beat (140 BPM, d-Moll) → assets/music/fabel/dark1.wav

Die Stimmung orientiert sich an der Referenz des Nutzers (gemessen: ca. 70/140 BPM, d-Moll-Bereich, Bass + Drums,
„cool, selbstsicher“). Melodie, Akkorde und Klänge sind eigene Synthese – nichts ist aus dem Referenzvideo übernommen.
    python3 pipeline/music_fabel.py
"""
import os
import wave

import numpy as np

from music import OUT, SR, adsr, lp, note

BPM, BARS = 140, 16
BEAT = 60 / BPM
N = int(BARS * 4 * BEAT * SR)


def put(buf, x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i:i + len(x), 0] += x * gain * (1 - max(0, pan))
    buf[i:i + len(x), 1] += x * gain * (1 + min(0, pan))


def sub808(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = note(m) * (1 + 0.9 * np.exp(-t / 0.018))  # kurzer Tonhöhen-Knack am Anfang
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return np.tanh(x * 1.8) * np.exp(-t / (dur * 0.7)) * np.clip((dur - t) / 0.03, 0, 1)


def kick():
    t = np.arange(int(0.22 * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 130 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.09)


def snare(r):
    t = np.arange(int(0.2 * SR)) / SR
    return (r.standard_normal(len(t)) * np.exp(-t / 0.06) * 0.8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04) * 0.6)


def hat(r, open_=False):
    t = np.arange(int((0.16 if open_ else 0.045) * SR)) / SR
    x = r.standard_normal(len(t))
    x = x - lp(x, 0.35)  # nur Höhen
    return x * np.exp(-t / (0.06 if open_ else 0.014))


def pluck(m, dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = note(m)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.08) + 0.25 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.04)
    return x * np.exp(-t / 0.22)


def pad(ms, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * note(m) * (1 + d) * t) for m in ms for d in (-0.003, 0.003))
    return lp(x, 0.08) * adsr(n, a=0.6, d=1.5, s=0.8, r=0.8) / (2 * len(ms))


def main():
    r = np.random.default_rng(7)
    buf = np.zeros((N, 2))
    # d-Moll: Dm – Bb – F – C (i – VI – III – VII), je 2 Takte; Bass spielt Grundtöne mit Vorschlag
    prog = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]
    motif = [74, 72, 69, 65, 69, 72, 74, 77]  # eigene kleine Tonfolge über die Akkorde
    for bar in range(BARS):
        t0 = bar * 4 * BEAT
        root, chord = prog[(bar // 2) % 4]
        full = bar >= 2  # die ersten zwei Takte nur Fläche + Zupfer (ruhiger Einstieg unter dem Hook)
        if bar % 2 == 0:
            put(buf, pad(chord, 8 * BEAT), t0, 0.5)
        # Zupf-Melodie: Achtel, leicht nach links/rechts wandernd
        for k in range(8):
            if (k + bar) % 3 != 2:
                put(buf, pluck(motif[(k + bar * 3) % 8] - (12 if k % 4 == 3 else 0)), t0 + k * BEAT / 2, 0.16, pan=0.5 * np.sin(k + bar))
        if not full:
            continue
        # Halftime: Kick auf 1 und „2-und“, Snare auf 3
        for b in (0, 1.5, 2.75 if bar % 4 == 3 else None):
            if b is not None:
                put(buf, kick(), t0 + b * BEAT, 0.9)
        put(buf, snare(r), t0 + 2 * BEAT, 0.5)
        # 808-Bass folgt der Kick, am Ende jedes zweiten Takts ein Übergangston
        put(buf, sub808(root, 1.4 * BEAT), t0, 0.75)
        put(buf, sub808(root, 1.2 * BEAT), t0 + 1.5 * BEAT, 0.65)
        if bar % 2 == 1:
            put(buf, sub808(root + 3, 0.9 * BEAT), t0 + 3 * BEAT, 0.6)
        # Hi-Hats: Achtel, in jedem vierten Takt ein Wirbel aus Zweiunddreißigsteln
        for k in range(8):
            put(buf, hat(r), t0 + k * BEAT / 2, 0.16 + 0.06 * (k % 2), pan=0.25)
        if bar % 4 == 3:
            for k in range(8):
                put(buf, hat(r), t0 + 3 * BEAT + k * BEAT / 8, 0.1 + 0.02 * k, pan=-0.25)
        if bar % 2 == 1:
            put(buf, hat(r, True), t0 + 3.5 * BEAT, 0.14, pan=0.3)
    buf = np.tanh(buf * 1.1)
    buf = buf / np.abs(buf).max() * 0.85
    os.makedirs(os.path.join(OUT, "fabel"), exist_ok=True)
    with wave.open(os.path.join(OUT, "fabel", "dark1.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())
    print(f"fabel/dark1.wav {N / SR:.0f}s {BPM} BPM")


if __name__ == "__main__":
    main()
