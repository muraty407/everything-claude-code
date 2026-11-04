# -*- coding: utf-8 -*-
"""Komplette Pipeline für alle (oder ausgewählte) Tage.

    python3 pipeline/make_all.py               # alle 30 Tage
    python3 pipeline/make_all.py --days 1-5    # nur Tag 1-5
    python3 pipeline/make_all.py --force       # alles neu

1) voice.py   Piper-TTS + Timing (faster-whisper, falls Modell erreichbar)
2) Remotion   Animation + Untertitel (stumm)
3) mix.py     Musik/SFX/Ducking, -14 LUFS, Export via FFmpeg
"""
import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import voice  # noqa: E402
import mix  # noqa: E402


def sel_days(spec):
    out = set()
    for part in spec.split(","):
        a, _, b = part.partition("-")
        out.update(range(int(a), int(b or a) + 1))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", default="1-30")
    ap.add_argument("--source", default="content/days.json", help="z. B. content/trailer.json (Tag 0)")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--batch", type=int, default=3, help="Videos pro Remotion-Bundle")
    args = ap.parse_args()

    days = json.load(open(os.path.join(ROOT, args.source), encoding="utf-8"))
    todo = [d for d in days if d["day"] in sel_days(args.days)]
    vids = os.path.join(ROOT, "output", "videos")
    os.makedirs(vids, exist_ok=True)
    if not os.path.exists(os.path.join(ROOT, "assets/sfx/bed.wav")):
        subprocess.run([sys.executable, os.path.join(HERE, "sfx.py")], check=True)

    pending = []
    for d in todo:
        final = os.path.join(vids, d["id"] + ".mp4")
        if os.path.exists(final) and not args.force:
            print(f"Tag {d['day']}: vorhanden, übersprungen")
            continue
        b = os.path.join(ROOT, "build", d["id"])
        tl_path = os.path.join(b, "timeline.json")
        if args.force or not os.path.exists(tl_path):
            voice.build_day(d, b)
        tl = json.load(open(tl_path, encoding="utf-8"))
        with open(os.path.join(b, "props.json"), "w", encoding="utf-8") as f:
            json.dump({"day": d, "timeline": tl}, f, ensure_ascii=False)
        pending.append((d, b, tl))

    for k in range(0, len(pending), args.batch):
        chunk = pending[k:k + args.batch]
        cmd = ["node", "render.mjs"]
        for d, b, _ in chunk:
            cmd += [os.path.join(b, "props.json"), os.path.join(b, "render.mp4")]
        subprocess.run(cmd, cwd=os.path.join(ROOT, "remotion"), check=True)
        for d, b, tl in chunk:
            mix.mix_audio(d, tl, os.path.join(b, "voice.wav"), os.path.join(b, "mix.wav"))
            final = os.path.join(vids, d["id"] + ".mp4")
            mix.finalize(os.path.join(b, "render.mp4"), os.path.join(b, "mix.wav"), final)
            os.remove(os.path.join(b, "render.mp4"))
            for f in os.listdir(b):
                if f.startswith("seg") and f.endswith(".wav"):
                    os.remove(os.path.join(b, f))
            print(f"✓ Tag {d['day']:2d} → {final}  ({os.path.getsize(final) / 1e6:.1f} MB, {tl['duration']:.0f}s)")


if __name__ == "__main__":
    main()
