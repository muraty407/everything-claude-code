# -*- coding: utf-8 -*-
"""ElevenLabs: passende Erzählerstimmen finden und Hörproben erzeugen.

    python3 pipeline/el_voices.py            # listet Stimmen, macht Hörproben → output/voice_samples/
    python3 pipeline/el_voices.py <voice_id> # nur diese Stimme testen

Danach die gewählte ID setzen:  export ELEVENLABS_VOICE_ID=<id>
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ.get("ELEVENLABS_API_KEY")
SAMPLE = ("Du bist in Pompeji. Ein ganz normaler Tag im Jahr 79. Und du hast noch etwa achtzehn Stunden. "
          "Gegen Mittag hörst du einen gewaltigen Knall.")
# Kandidaten für spannende Doku-/Storytelling-Stimmen (premade, mit multilingual_v2 auf Deutsch nutzbar)
CANDIDATES = {
    "nPczCjzI2devNBz1zQrb": "Brian – tief, ruhig, Doku",
    "onwK4e9ZLuTAKqWW03F9": "Daniel – Nachrichten, autoritär",
    "pNInz6obpgDQGcFmaJgB": "Adam – tief, markant",
    "JBFqnCBsd6RMkjVDRZzb": "George – warm, Erzähler",
    "N2lVS1w4EtoT3dr4eOWO": "Callum – rau, spannend",
}


def api(path, body=None):
    req = urllib.request.Request("https://api.elevenlabs.io" + path, method="POST" if body else "GET",
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main():
    if not KEY:
        sys.exit("ELEVENLABS_API_KEY fehlt (in den Umgebungs-Einstellungen hinterlegen).")
    voices = json.loads(api("/v1/voices"))["voices"]
    print("Stimmen in deinem Account:")
    for v in voices:
        lab = v.get("labels", {})
        print(f"  {v['voice_id']}  {v['name']:<18} {lab.get('accent', ''):<12} {lab.get('description', '')} {lab.get('use_case', '')}")
    ids = sys.argv[1:] or [i for i in CANDIDATES if any(v["voice_id"] == i for v in voices)] + \
        [v["voice_id"] for v in voices if "german" in json.dumps(v.get("labels", {})).lower()]
    out = os.path.join(ROOT, "output", "voice_samples")
    os.makedirs(out, exist_ok=True)
    for vid in dict.fromkeys(ids):
        audio = api(f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                    {"text": SAMPLE, "model_id": "eleven_multilingual_v2",
                     "voice_settings": {"stability": 0.42, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}})
        name = next((v["name"] for v in voices if v["voice_id"] == vid), vid)
        path = os.path.join(out, f"{name}_{vid}.mp3")
        open(path, "wb").write(audio)
        print("Hörprobe:", path, "-", CANDIDATES.get(vid, ""))


if __name__ == "__main__":
    main()
