# -*- coding: utf-8 -*-
"""Thumbnails (TikTok-Cover, 1080×1920) für alle Tage.

1) Remotion rendert die Hintergrund-Szene (Composition "ThumbBG") als PNG.
2) HyperFrames legt Typo/Sticker/Pfeil darüber (thumbnails/hyperframes/index.html,
   Variablen pro Tag) und rendert ein PNG.

    python3 pipeline/thumbnails.py [--days 1-30]
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HF = os.path.join(ROOT, "thumbnails", "hyperframes")
OUT = os.path.join(ROOT, "output", "thumbnails")


def browser():
    if os.environ.get("HYPERFRAMES_BROWSER_PATH"):
        return os.environ["HYPERFRAMES_BROWSER_PATH"]
    hits = glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell")
    return hits[0] if hits else None


def fit(text, maxpx, width=900):
    """Anton-Großbuchstaben sind ~0.46 em breit → Zeile auf eine Breite zwingen."""
    est = sum(0.28 if c == " " else 0.46 for c in text)
    return int(min(maxpx, width / max(est, 0.1)))


def luminance(hexcol):
    r, g, b = (int(hexcol[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return 0.299 * r + 0.587 * g + 0.114 * b


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", default="1-30")
    ap.add_argument("--source", default="content/days.json")
    args = ap.parse_args()
    sel = set()
    for part in args.days.split(","):
        a, _, b = part.partition("-")
        sel.update(range(int(a), int(b or a) + 1))
    days = [d for d in json.load(open(os.path.join(ROOT, args.source), encoding="utf-8")) if d["day"] in sel]
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(os.path.join(HF, "assets", "bg"), exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="thumbs_")

    # 1) Hintergründe in einem Remotion-Durchlauf
    cmd = ["node", "render.mjs", "--still", "ThumbBG"]
    for d in days:
        p = os.path.join(tmp, d["id"] + ".json")
        json.dump({"id": d["id"], "scene": d["thumb"]["scene"], "accent": d["accent"], "you": True}, open(p, "w"))
        cmd += [p, os.path.join(HF, "assets", "bg", d["id"] + ".png")]
    subprocess.run(cmd, cwd=os.path.join(ROOT, "remotion"), check=True)

    # 2) HyperFrames-Overlay
    env = dict(os.environ)
    if browser():
        env["HYPERFRAMES_BROWSER_PATH"] = browser()
    for d in days:
        t = d["thumb"]
        variables = {
            "top": t["top"], "bottom": t["bottom"], "tag": t["tag"], "kicker": t["kicker"],
            "day": f"TAG {d['day']}/30" if d["day"] else "TRAILER",
            "brand": "ZEITZEUGE" if not d["day"] else "WAS WÄRE WENN?", "accent": d["accent"], "bg": f"assets/bg/{d['id']}.png",
            "size1": f"{fit(t['top'], 200)}px", "size2": f"{fit(t['bottom'], 220)}px",
            "badgefg": "#111111" if luminance(d["accent"]) > 0.55 else "#ffffff",
        }
        seq = os.path.join(tmp, d["id"])
        subprocess.run(["npx", "hyperframes", "render", ".", "--format", "png-sequence", "--fps", "1",
                        "--quiet", "--variables", json.dumps(variables, ensure_ascii=False), "-o", seq],
                       cwd=HF, env=env, check=True, stdout=subprocess.DEVNULL)
        frame = sorted(glob.glob(os.path.join(seq, "*.png")))[0]
        dst = os.path.join(OUT, d["id"] + ".png")
        # als kompaktes PNG speichern (RGB, ohne Alpha)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", frame, "-pix_fmt", "rgb24", dst], check=True)
        print(f"✓ Thumbnail Tag {d['day']:2d} → {dst}")
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
