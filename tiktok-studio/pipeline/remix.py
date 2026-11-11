# -*- coding: utf-8 -*-
"""Nur den Ton neu mischen (Bild bleibt): python3 pipeline/remix.py <quelle.json> <tage z. B. 13-20>
Nimmt das Bild aus dem fertigen MP4 und die Stimme aus build/<id>/voice.wav – kein Rendern, keine ElevenLabs-Kosten."""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import mix  # noqa: E402
import voice  # noqa: E402
from make_all import sel_days  # noqa: E402

days = [d for d in json.load(open(os.path.join(ROOT, sys.argv[1]), encoding="utf-8")) if d["day"] in sel_days(sys.argv[2])]
for d in days:
    b = os.path.join(ROOT, "build", d["id"])
    mp4 = os.path.join(ROOT, "output", "videos", d["id"] + ".mp4")
    if not os.path.exists(mp4):
        print("übersprungen (Video fehlt):", d["id"])
        continue
    if not os.path.exists(os.path.join(b, "voice.wav")):
        voice.build_day(d, b)  # Stimme kommt aus dem ElevenLabs-Cache → keine Kosten
    tl = json.load(open(os.path.join(b, "timeline.json"), encoding="utf-8"))
    mix.mix_audio(d, tl, os.path.join(b, "voice.wav"), os.path.join(b, "mix.wav"))
    tmp = mp4 + ".tmp.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-i", os.path.join(b, "mix.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", "-shortest", tmp], check=True)
    os.replace(tmp, mp4)
    for f in os.listdir(b):  # Platz sparen: Zwischendateien wieder löschen
        if f.endswith(".wav"):
            os.remove(os.path.join(b, f))
    print("✓ Ton neu:", d["id"], flush=True)
