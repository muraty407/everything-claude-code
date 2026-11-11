# -*- coding: utf-8 -*-
"""„Zuhören“: Tonspur eines Videos transkribieren (ElevenLabs Scribe) – mit Zeitstempeln, Sprechern und Geräuschen.

    python3 pipeline/listen.py <video-oder-audio> [--max 180]

Nutzt ELEVENLABS_API_KEY. Erkennt Sprache automatisch; Geräusche stehen in (Klammern).
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("--max", type=int, default=180, help="höchstens so viele Sekunden auswerten")
a = ap.parse_args()
mp3 = tempfile.mktemp(suffix=".mp3")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.src, "-t", str(a.max), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", mp3], check=True)
r = subprocess.run(["curl", "-sS", "-m", "300", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text",
                    "-H", f"xi-api-key: {os.environ['ELEVENLABS_API_KEY']}", "-F", "model_id=scribe_v1", "-F", f"file=@{mp3}",
                    "-F", "tag_audio_events=true", "-F", "diarize=true"], capture_output=True, text=True)
os.remove(mp3)
d = json.loads(r.stdout)
if "words" not in d:
    sys.exit(f"Fehler: {d}")
print(f"Sprache: {d.get('language_code')}")
line, start, spk = [], None, None
for w in d["words"]:
    if w.get("type") == "spacing":
        continue
    s = w.get("speaker_id")
    if start is None:
        start, spk = w["start"], s
    line.append(w["text"])
    if w["text"].endswith((".", "!", "?", ")")) or s != spk:
        print(f"[{start:6.1f}s] {spk or ''}: {' '.join(line)}")
        line, start = [], None
if line:
    print(f"[{start:6.1f}s] {spk or ''}: {' '.join(line)}")
