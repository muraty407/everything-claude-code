# -*- coding: utf-8 -*-
"""Sound für die Merge-Simulation – komplett synthetisch (keine Lizenzfragen).

- leiser Ambient-Teppich (Akkorde, langsam schwebend)
- „Plopp“ beim Einwerfen, glockiger Ton beim Verschmelzen (je höher die Stufe, desto höher/voller)
- großes Finale, wenn die höchste Stufe entsteht

    python3 merge/audio.py <sim.json> <out.wav>
"""
import json
import sys
import wave

import numpy as np

SR = 44100
PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26]  # Dur-Pentatonik


def note(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, a=0.005, d=0.4):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def bell(freq, dur, amp):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(2 * np.pi * freq * 2.01 * t) * np.exp(-t / 0.15)
         + 0.25 * np.sin(2 * np.pi * freq * 3.02 * t) * np.exp(-t / 0.08))
    return amp * s * env(n, 0.003, dur / 3)


def plop(amp):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 380 * np.exp(-t * 18) + 120
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.04)


def load_voice(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    return x / max(1e-6, np.max(np.abs(x)))


def pitched(x, semis):
    """Tonhöhe per Resampling ändern (tiefer = langsamer – genau der Effekt: je größer, desto tiefer)."""
    k = 2 ** (semis / 12)
    idx = np.arange(0, len(x) - 1, k)
    return np.interp(idx, np.arange(len(x)), x)


def pad(total, rng):
    t = np.arange(total) / SR
    out = np.zeros(total)
    chords = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 55, 59, 64]]  # Am F G Em
    seg = 8.0
    for k in range(int(total / SR / seg) + 1):
        a, b = int(k * seg * SR), min(total, int((k + 1) * seg * SR) + SR)
        if a >= total:
            break
        tt = t[a:b] - k * seg
        e = np.minimum(1, tt / 2.0) * np.minimum(1, np.maximum(0, (seg + 1 - tt)) / 2.0)
        for m in chords[k % 4]:
            f = note(m - 12)
            out[a:b] += 0.03 * e * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt + 0.3 * np.sin(tt)))
    return out


def main():
    sim = json.load(open(sys.argv[1], encoding="utf-8"))
    fps = sim["fps"]
    total = int((len(sim["frames"]) / fps + 0.5) * SR)
    rng = np.random.default_rng(1)
    mix = pad(total, rng)
    vpath = sim["theme"].get("voice")
    voice = load_voice(vpath) if vpath else None
    ntiers = len(sim["theme"]["tiers"])
    busy = 0.0
    for e in sim["events"]:
        tsec = e["f"] / fps
        if e["type"] == "drop":
            s = plop(0.08)
        else:
            tier = e["tier"]
            if voice is not None:
                # „Ooh la la“: kleine Fusion hoch und schnell, große tief und langsam
                semis = 5 - 17 * (tier - 1) / max(1, ntiers - 2)
                v = pitched(voice, semis)
                b = bell(note(72 + PENTA[min(tier, len(PENTA) - 1)] - 12), 0.6, 0.04)
                s = np.zeros(max(len(v), len(b)))
                s[: len(v)] += 0.55 * v
                s[: len(b)] += b
                if busy - tsec > 0.45 and tier < len(sim["theme"]["tiers"]) - 4:
                    continue  # bei viel Betrieb kleine Fusionen stumm lassen, damit nichts nachhinkt
                tsec = max(tsec, busy)  # Kaskaden nacheinander statt übereinander
                busy = tsec + len(s) / SR * 0.6
            else:
                s = bell(note(72 + PENTA[min(tier, len(PENTA) - 1)]), 0.9 + tier * 0.08, 0.10 + 0.025 * tier)
        i = int(tsec * SR)
        if i >= total:
            continue
        j = min(total, i + len(s))
        mix[i:j] += s[: j - i]
    # Finale: Akkord + Whoosh
    i = int(sim["topAt"] / fps * SR)
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    fin = sum(0.12 * np.sin(2 * np.pi * note(m) * t) * env(n, 0.01, 1.2) for m in (60, 64, 67, 72, 76))
    noise = rng.standard_normal(n) * np.exp(-t / 0.5) * 0.15
    fin = fin + np.convolve(noise, np.ones(30) / 30, mode="same")
    j = min(total, i + n)
    mix[i:j] += fin[: j - i]
    mix /= max(1e-6, np.max(np.abs(mix))) / 0.89
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print("audio", sys.argv[2], f"{total / SR:.1f}s")


if __name__ == "__main__":
    main()
