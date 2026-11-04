# -*- coding: utf-8 -*-
"""Erzeugt lizenzfreie Musik-/SFX-Bausteine komplett mit FFmpeg (kein Download nötig).

assets/sfx/bed.wav     – dunkles Spannungs-Bett (Drone + Puls, 100 BPM), 3 min
assets/sfx/whoosh.wav  – Übergang
assets/sfx/boom.wav    – Impact (Explosion, Knall, Schnitt-Akzent)
assets/sfx/pop.wav     – Karte/Info-Einblendung
assets/sfx/tick.wav    – Uhr-Tick für Countdown-Videos
"""
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sfx")
SR = 48000


def ff(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, check=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    beat = 0.6  # 100 BPM
    # Kick-Puls + Drone (A1/E2) + leise Hi-Hat-Rauschen + Schwebung
    expr = (
        f"0.55*sin(2*PI*mod(t,{beat})*(42+95*exp(-mod(t,{beat})*28)))*exp(-mod(t,{beat})*7)"
        "+0.16*sin(2*PI*55*t)*(0.6+0.4*sin(2*PI*0.07*t))"
        "+0.10*sin(2*PI*82.41*t+0.5*sin(2*PI*0.2*t))"
        "+0.05*sin(2*PI*110.3*t)*(0.5+0.5*sin(2*PI*0.13*t))"
        f"+0.06*sin(2*PI*220*t)*exp(-mod(t+{beat/2},{beat*4})*3)"
    )
    ff(["-f", "lavfi", "-i", f"aevalsrc='{expr}':s={SR}:d=180",
        "-f", "lavfi", "-i", f"anoisesrc=color=pink:r={SR}:a=0.05:d=180",
        "-filter_complex",
        "[1]highpass=f=6000,volume=0.25,"
        f"apulsator=mode=sine:hz={1/beat*2}:amount=1[hh];"
        "[0][hh]amix=inputs=2:normalize=0,lowpass=f=9000,"
        "aecho=0.8:0.5:300:0.25,acompressor=threshold=-18dB:ratio=3,"
        "afade=t=in:d=1.5,volume=0.9[o]",
        "-map", "[o]", "-ac", "2", os.path.join(OUT, "bed.wav")])
    # Whoosh: gefiltertes Rauschen mit An-/Abschwellen
    ff(["-f", "lavfi", "-i", f"anoisesrc=color=pink:r={SR}:a=0.9:d=0.7",
        "-af", "bandpass=f=900:w=1.2,highpass=f=200,afade=t=in:d=0.38:curve=exp,"
               "afade=t=out:st=0.4:d=0.3,volume=1.6",
        "-ac", "2", os.path.join(OUT, "whoosh.wav")])
    # Boom: Pitch-Drop-Sinus + Rauschburst
    ff(["-f", "lavfi", "-i", f"aevalsrc='0.9*sin(2*PI*t*(38+120*exp(-t*7)))*exp(-t*2.2)':s={SR}:d=2.2",
        "-f", "lavfi", "-i", f"anoisesrc=color=brown:r={SR}:a=0.8:d=1.2",
        "-filter_complex", "[1]lowpass=f=700,afade=t=out:d=1.1[n];[0][n]amix=inputs=2:normalize=0,"
                           "acompressor=threshold=-12dB:ratio=4,volume=1.2[o]",
        "-map", "[o]", "-ac", "2", os.path.join(OUT, "boom.wav")])
    # Pop: kurzer heller Ton
    ff(["-f", "lavfi", "-i", f"aevalsrc='0.6*sin(2*PI*t*(660+500*exp(-t*40)))*exp(-t*18)':s={SR}:d=0.35",
        "-ac", "2", os.path.join(OUT, "pop.wav")])
    # Tick
    ff(["-f", "lavfi", "-i", f"aevalsrc='0.7*sin(2*PI*2400*t)*exp(-t*160)':s={SR}:d=0.06",
        "-ac", "2", os.path.join(OUT, "tick.wav")])
    print("SFX erzeugt in", OUT)


if __name__ == "__main__":
    main()
