# -*- coding: utf-8 -*-
"""Erzeugt die Fusions-Rufe (virale TikTok-Begriffe) mit ElevenLabs „Laura“ → assets/merge/<slug>.wav.
Jedes Merge-Video bekommt einen anderen Begriff; audio.py macht ihn pro Fusion tiefer.

    python3 merge/voices.py            # alle fehlenden erzeugen
"""
import json
import os
import subprocess
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "merge")
VOICE = "FGY2WhTYpPnrIDTdsKH5"  # Laura – verspielt

# Begriffe, die 2025/26 auf TikTok viral sind – familienfreundlich, ohne fremde Marken/Figuren
WORDS = {
    "oohlala": "Ooh la la!",
    "sheesh": "Sheeeesh!",
    "six-seven": "Six seven!",
    "let-him-cook": "Let him cook!",
    "slay": "Slaaay!",
    "no-cap": "No cap!",
    "rizz": "Rizz!",
    "delulu": "Delulu!",
    "mamma-mia": "Mamma mia!",
    "bruh": "Bruh!",
    "yippee": "Yippee!",
    "lock-in": "Lock in!",
    "cooked": "We're cooked!",
    "aura": "Aura!",
    "ate": "Ate!",
    "oh-no": "Oh no!",
    # Fahrzeug-Videos: eigene Sprüche statt Marken-Slogans
    "vroom-vroom": "Vroom vroom!",
    "beep-beep": "Beep beep!",
    "full-send": "Full send!",
    "skrrt": "Skrrrt!",
}
THEME_WORDS = {"autos": ["vroom-vroom", "beep-beep", "full-send", "skrrt"]}


def main():
    os.makedirs(OUT, exist_ok=True)
    key = os.environ["ELEVENLABS_API_KEY"]
    for slug, text in WORDS.items():
        wav = os.path.join(OUT, f"{slug}.wav")
        if os.path.exists(wav):
            continue
        body = {"text": text, "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.3, "similarity_boost": 0.8, "style": 0.7, "use_speaker_boost": True}}
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_192",
                                     data=json.dumps(body).encode(), headers={"xi-api-key": key, "Content-Type": "application/json"})
        mp3 = wav[:-4] + ".mp3"
        open(mp3, "wb").write(urllib.request.urlopen(req, timeout=60).read())
        trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", trim, "-ac", "1", "-ar", "44100", wav], check=True)
        os.remove(mp3)
        print("✓", slug)


if __name__ == "__main__":
    main()
