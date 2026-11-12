# -*- coding: utf-8 -*-
"""Schritt 1: Sprecherspur + Timing.

Für jedes Segment:  Text → (Normalisierung) → Piper-TTS (Erzähler oder 2. Stimme)
→ FFmpeg-Veredelung (Tempo, EQ, Kompressor, 48 kHz) → zusammenfügen.
Danach Wort-Timings: faster-whisper (falls Modell verfügbar), sonst
proportionale Verteilung innerhalb des Segments (der Text ist ja bekannt).

Ausgabe pro Tag: build/<id>/voice.wav  +  build/<id>/timeline.json
"""
import argparse
import json
import os
import re
import subprocess
import sys
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from de_text import normalize  # noqa: E402

# Engines (Umgebungsvariable TTS_ENGINE):
#   elevenlabs – Standard, sobald ELEVENLABS_API_KEY gesetzt ist (exakte Wort-Timings per API)
#   vits       – Coqui VITS "Thorsten" (offline, 22 kHz)
#   piper      – Piper "low" (offline, Fallback)
ENGINE = os.environ.get("TTS_ENGINE") or ("elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "vits")

# ElevenLabs: Modell + Stimmen. Erzähler = tiefe, ruhige Doku-Stimme ("Brian"),
# Zitate = zweite Stimme ("Daniel", wirkt wie Archiv/Nachrichten). Per Env-Var tauschbar,
# z. B. eine native deutsche Stimme aus der Voice Library.
EL_MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")
EL_VOICES = {
    "narrator": os.environ.get("ELEVENLABS_VOICE_ID", "nPczCjzI2devNBz1zQrb"),
    "second": os.environ.get("ELEVENLABS_VOICE_ID_2", "onwK4e9ZLuTAKqWW03F9"),
    "mama": os.environ.get("ELEVENLABS_VOICE_ID_MAMA", "XrExE9yKIg1WjnnlVkGX"),  # Matilda – POV-Storys
    "girl": os.environ.get("ELEVENLABS_VOICE_ID_GIRL", "cgSgspJ2msm6clMCkdW9"),  # Jessica – junge Stimme (Lena)
    "bouncer": os.environ.get("ELEVENLABS_VOICE_ID_BOUNCER", "pNInz6obpgDQGcFmaJgB"),  # Adam – tief, trocken (Club-Türsteher, englisch)
}
EL_SETTINGS = {
    "narrator": {"stability": 0.42, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.08},
    "second": {"stability": 0.55, "similarity_boost": 0.75, "style": 0.2, "use_speaker_boost": True, "speed": 1.0},
    "bouncer": {"stability": 0.6, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True, "speed": 0.95},
    "girl": {"stability": 0.35, "similarity_boost": 0.8, "style": 0.5, "use_speaker_boost": True, "speed": 1.05},
    "mama": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.0},
}
EL_CACHE = os.path.join(ROOT, "build", "_tts_cache")
VITS_DIR = os.path.join(ROOT, "assets/voices/coqui/tts_models--de--thorsten--vits")
VITS_TEMPO = {"narrator": 1.10, "second": 1.0}

VOICES = {
    "narrator": os.path.join(ROOT, "assets/voices/de-thorsten-low.onnx"),
    "second": os.path.join(ROOT, "assets/voices/de-ramona-low.onnx"),
}
# Erzähler: etwas schneller (TikTok-Tempo), zweite Stimme natürlicher
LENGTH_SCALE = {"narrator": 0.92, "second": 0.98}
GAP_AFTER = 0.22        # Pause zwischen Segmenten (s)
GAP_AFTER_HOOK = 0.40   # nach dem Hook etwas länger
TAIL = 1.2              # Ausklang am Ende
SR = 48000

_loaded = {}


def voice(name):
    from piper import PiperVoice
    if name not in _loaded:
        _loaded[name] = PiperVoice.load(VOICES[name])
    return _loaded[name]


def vits():
    if "vits" not in _loaded:
        from TTS.api import TTS
        _loaded["vits"] = TTS(model_path=os.path.join(VITS_DIR, "model_file.pth"),
                              config_path=os.path.join(VITS_DIR, "config.json"))
    return _loaded["vits"]


def elevenlabs(text, name, out_mp3):
    """Ruft ElevenLabs /with-timestamps auf (mit Cache, damit nichts doppelt bezahlt wird).
    Gibt Wort-Timings (relativ, Sekunden) zurück."""
    import base64, hashlib, urllib.request
    os.makedirs(EL_CACHE, exist_ok=True)
    body = {"text": text, "model_id": EL_MODEL, "language_code": "de", "voice_settings": EL_SETTINGS[name]}
    if "multilingual" in EL_MODEL:
        body.pop("language_code")  # v2 erkennt die Sprache selbst
    key = hashlib.sha1(json.dumps([EL_VOICES[name], body], sort_keys=True).encode()).hexdigest()
    cache = os.path.join(EL_CACHE, key + ".json")
    if os.path.exists(cache):
        data = json.load(open(cache))
    else:
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{EL_VOICES[name]}/with-timestamps?output_format=mp3_44100_192",
            data=json.dumps(body).encode(), method="POST",
            headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.load(r)
        json.dump(data, open(cache, "w"))
    open(out_mp3, "wb").write(base64.b64decode(data["audio_base64"]))
    al = data.get("alignment") or {}
    chars, st, en = al.get("characters", []), al.get("character_start_times_seconds", []), al.get("character_end_times_seconds", [])
    words, cur = [], None
    for c, a, b in zip(chars, st, en):
        if c.isspace():
            if cur:
                words.append(cur)
            cur = None
        elif cur is None:
            cur = {"w": c, "s": a, "e": b}
        else:
            cur["w"] += c
            cur["e"] = b
    if cur:
        words.append(cur)
    return words


def synth(text, name, out_wav):
    """Erzeugt die Sprachdatei. Rückgabe: (dauer, wort_timings_relativ | None)."""
    raw = out_wav + ".raw.wav"
    if ENGINE == "elevenlabs":
        mp3 = out_wav + ".el.mp3"
        words = elevenlabs(text, name, mp3)
        # Keine Stille-Trimmung/Tempoänderung → API-Timings bleiben exakt
        chain = ("highpass=f=60,equalizer=f=3000:t=q:w=1.2:g=2,"
                 "acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90:makeup=2,")
        if name == "second":
            chain = "highpass=f=180,lowpass=f=7000,acompressor=threshold=-22dB:ratio=3:makeup=3,aecho=0.6:0.4:30:0.12,"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", chain + f"aresample={SR}",
                        "-ac", "1", out_wav], check=True)
        os.remove(mp3)
        return duration(out_wav), words
    if ENGINE == "vits":
        import contextlib, io
        with contextlib.redirect_stdout(io.StringIO()):
            vits().tts_to_file(text=normalize(text), file_path=raw)
        tempo = VITS_TEMPO[name]
    else:
        from piper import SynthesisConfig
        cfg = SynthesisConfig(length_scale=LENGTH_SCALE[name], noise_scale=0.6, noise_w_scale=0.75)
        with wave.open(raw, "wb") as wf:
            voice(name).synthesize_wav(normalize(text), wf, syn_config=cfg)
        tempo = 1.02 if name == "narrator" else 1.0
    # Veredelung: Stille trimmen, leicht schneller, Bass/Präsenz, Kompression, 48 kHz
    if name == "narrator":
        chain = ("silenceremove=start_periods=1:start_threshold=-45dB,"
                 "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                 f"atempo={tempo},highpass=f=70,equalizer=f=180:t=q:w=1:g=3,"
                 "equalizer=f=3200:t=q:w=1.2:g=4,equalizer=f=7000:t=q:w=1:g=-2,"
                 "acompressor=threshold=-20dB:ratio=3.5:attack=5:release=80:makeup=4,"
                 f"aresample={SR}")
    else:  # Zitat-Stimme: etwas "Archiv/Funk"-Charakter
        chain = ("silenceremove=start_periods=1:start_threshold=-45dB,"
                 "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                 f"atempo={tempo},highpass=f=250,lowpass=f=5500,equalizer=f=1800:t=q:w=1:g=4,"
                 "acompressor=threshold=-22dB:ratio=4:attack=5:release=60:makeup=5,"
                 "aecho=0.6:0.4:35:0.15,"
                 f"aresample={SR}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", chain, "-ac", "1", out_wav], check=True)
    os.remove(raw)
    return duration(out_wav), None


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def split_words(text):
    return [w for w in re.split(r"\s+", text.strip()) if w]


def proportional_words(text, start, dur):
    words = split_words(text)
    # Gewicht = Silbenschätzung (Vokalgruppen) + Satzzeichenpause
    def weight(w):
        syl = max(1, len(re.findall(r"[aeiouyäöüAEIOUYÄÖÜ]+", w)))
        if re.search(r"\d", w):
            syl += len(re.sub(r"\D", "", w))  # Zahlen werden lang gesprochen
        pause = 0.6 if w[-1] in ".!?:" else (0.3 if w[-1] in ",;–" else 0)
        return syl + pause
    ws = [weight(w) for w in words]
    total = sum(ws)
    t, out = start, []
    for w, k in zip(words, ws):
        d = dur * k / total
        out.append({"w": w, "s": round(t, 3), "e": round(t + d, 3)})
        t += d
    return out


def whisper_words(wav_path, text, start):
    """Versucht faster-whisper; gibt None zurück, wenn kein Modell erreichbar ist."""
    try:
        from faster_whisper import WhisperModel
    except Exception:
        return None
    try:
        model = whisper_words.model = getattr(whisper_words, "model", None) or WhisperModel(
            os.environ.get("WHISPER_MODEL", "small"), device="cpu", compute_type="int8")
        segs, _ = model.transcribe(wav_path, language="de", word_timestamps=True)
        got = [w for s in segs for w in (s.words or [])]
    except Exception:
        return None
    words = split_words(text)
    if not got or abs(len(got) - len(words)) > max(2, len(words) // 5):
        return None
    # Skript-Wörter auf Whisper-Zeiten mappen (gleich lang → 1:1, sonst gestreckt)
    out = []
    for i, w in enumerate(words):
        j = min(len(got) - 1, round(i * (len(got) - 1) / max(1, len(words) - 1)))
        out.append({"w": w, "s": round(start + got[j].start, 3), "e": round(start + got[j].end, 3)})
    return out


def build_day(day, outdir, use_whisper=True):
    os.makedirs(outdir, exist_ok=True)
    parts, t, segs = [], 0.0, []
    for i, seg in enumerate(day["segments"]):
        name = seg.get("voice") or "narrator"
        wav = os.path.join(outdir, f"seg{i:02d}.wav")
        d, rel = synth(seg["text"], name, wav)
        if rel and len(rel) == len(split_words(seg["text"])):
            words = [{"w": w, "s": round(t + r["s"], 3), "e": round(t + r["e"], 3)}
                     for w, r in zip(split_words(seg["text"]), rel)]
        else:
            words = (whisper_words(wav, seg["text"], t) if use_whisper else None) or \
                proportional_words(seg["text"], t, d)
        fast = day.get("hook")  # v2: straffer geschnitten
        gap = (0.2 if fast else GAP_AFTER_HOOK) if i == 0 else (0.1 if fast else GAP_AFTER)
        if i == len(day["segments"]) - 1:
            gap = TAIL
        segs.append({"i": i, "start": round(t, 3), "end": round(t + d + gap, 3),
                     "speech_end": round(t + d, 3), "voice": name, "words": words})
        parts.append((wav, d, gap))
        t += d + gap

    # Zusammenfügen mit Pausen
    lst = os.path.join(outdir, "concat.txt")
    sil = os.path.join(outdir, "sil_{}.wav")
    with open(lst, "w") as f:
        for k, (wav, d, gap) in enumerate(parts):
            f.write(f"file '{os.path.basename(wav)}'\n")
            s = sil.format(k)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                            f"anullsrc=r={SR}:cl=mono", "-t", f"{gap:.3f}", s], check=True)
            f.write(f"file '{os.path.basename(s)}'\n")
    voice_wav = os.path.join(outdir, "voice.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c:a", "pcm_s16le", voice_wav], check=True)
    for k in range(len(parts)):
        os.remove(sil.format(k))
    os.remove(lst)

    timeline = {"id": day["id"], "duration": round(t, 3), "segments": segs,
                "engine": ENGINE,
                "word_source": "api" if ENGINE == "elevenlabs" else "whisper" if use_whisper and whisper_words.__dict__.get("model") else "script"}
    with open(os.path.join(outdir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=1)
    return timeline


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", default="1-30", help="z. B. 1-30 oder 3,5,7")
    ap.add_argument("--no-whisper", action="store_true")
    args = ap.parse_args()
    days = json.load(open(os.path.join(ROOT, "content/days.json"), encoding="utf-8"))
    sel = set()
    for part in args.days.split(","):
        a, _, b = part.partition("-")
        sel.update(range(int(a), int(b or a) + 1))
    for d in days:
        if d["day"] in sel:
            tl = build_day(d, os.path.join(ROOT, "build", d["id"]), use_whisper=not args.no_whisper)
            print(f"Tag {d['day']:2d}: {tl['duration']:5.1f}s  ({tl['word_source']})  {d['title']}")


if __name__ == "__main__":
    main()
