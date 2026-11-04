# -*- coding: utf-8 -*-
"""Referenz-Videos analysieren (Inspiration, nicht Kopie).

    python3 pipeline/analyze_refs.py https://vm.tiktok.com/XXXX/ ...   # lädt per yt-dlp
    python3 pipeline/analyze_refs.py refs/*.mp4                          # lokale Dateien

Pro Video: Länge, Schnitte/Minute (FFmpeg-Szenenerkennung), Lautheit,
Sprechtempo + Transkript (faster-whisper, falls installiert) und ein Kontaktbogen.
Ergebnis: refs/report.md
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFS = os.path.join(ROOT, "refs")


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def fetch(url):
    os.makedirs(REFS, exist_ok=True)
    r = sh(["yt-dlp", "-q", "--no-warnings", "-o", os.path.join(REFS, "%(id)s.%(ext)s"),
            "--print", "after_move:filepath", url])
    return r.stdout.strip().splitlines()[-1] if r.returncode == 0 and r.stdout.strip() else None


def analyze(path):
    dur = float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).stdout)
    cuts = len(re.findall(r"pts_time", sh(["ffmpeg", "-i", path, "-vf", "select='gt(scene,0.25)',showinfo",
                                            "-an", "-f", "null", "-"]).stderr))
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", sh(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"]).stderr)
    sheet = os.path.splitext(path)[0] + "_sheet.jpg"
    sh(["ffmpeg", "-v", "error", "-y", "-i", path, "-vf", "fps=1/3,scale=240:-1,tile=6x3", "-frames:v", "1", sheet])
    info = {"datei": os.path.basename(path), "dauer_s": round(dur, 1), "schnitte_pro_min": round(cuts / dur * 60, 1),
            "lufs": float(lufs[-1]) if lufs else None, "kontaktbogen": os.path.basename(sheet)}
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(os.environ.get("WHISPER_MODEL", "small"), device="cpu", compute_type="int8")
        segs, lang = model.transcribe(path, word_timestamps=True)
        words = [w for s in segs for w in (s.words or [])]
        info["sprache"] = lang.language
        info["wörter_pro_s"] = round(len(words) / dur, 2)
        info["transkript"] = " ".join(w.word.strip() for w in words)
    except Exception as e:  # Modell nicht verfügbar
        info["transkript"] = f"(faster-whisper nicht verfügbar: {type(e).__name__})"
    return info


def main():
    items = sys.argv[1:] or sorted(os.path.join(REFS, f) for f in os.listdir(REFS) if f.endswith(".mp4"))
    rows = []
    for it in items:
        path = fetch(it) if it.startswith("http") else it
        if not path:
            print("Download fehlgeschlagen:", it)
            continue
        rows.append(analyze(path))
        print(json.dumps(rows[-1], ensure_ascii=False)[:300])
    os.makedirs(REFS, exist_ok=True)
    with open(os.path.join(REFS, "report.md"), "w", encoding="utf-8") as f:
        f.write("# Referenz-Analyse\n\n| Datei | Dauer | Schnitte/min | LUFS | Wörter/s |\n|---|---|---|---|---|\n")
        for r in rows:
            f.write(f"| {r['datei']} | {r['dauer_s']} s | {r['schnitte_pro_min']} | {r['lufs']} | {r.get('wörter_pro_s', '–')} |\n")
        for r in rows:
            f.write(f"\n## {r['datei']}\n\n![]({r['kontaktbogen']})\n\n{r['transkript']}\n")


if __name__ == "__main__":
    main()
