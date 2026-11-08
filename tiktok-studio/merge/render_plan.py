# -*- coding: utf-8 -*-
"""Rendert alle Videos aus merge/plan.json (fehlende), in Plan-Reihenfolge, und pusht nach jedem Block.

    python3 merge/render_plan.py [--only 1-4] [--batch 4] [--no-push]
"""
import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BRANCH = "claude/tiktok-video-editor-30days-25xb1d"


def sh(cmd, **kw):
    return subprocess.run(cmd, shell=True, check=True, cwd=ROOT, **kw)


def push(msg):
    sh("git add merge output/merge assets/merge")
    if subprocess.run("git diff --cached --quiet", shell=True, cwd=ROOT).returncode == 0:
        return
    sh(f'git commit -qm "{msg}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0132bTE2M3jVWVFSo1s7Z6AE"')
    for _ in range(4):
        if subprocess.run(f"git pull -q --rebase origin {BRANCH} && git push -q -u origin {BRANCH}", shell=True, cwd=ROOT).returncode == 0:
            return
        subprocess.run("sleep 5", shell=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--batch", type=int, default=4)
    ap.add_argument("--no-push", action="store_true")
    a = ap.parse_args()
    plan = json.load(open(os.path.join(HERE, "plan.json"), encoding="utf-8"))
    if a.only:
        lo, _, hi = a.only.partition("-")
        plan = [e for e in plan if int(lo) <= e["n"] <= int(hi or lo)]
    todo = [e for e in plan if not os.path.exists(os.path.join(ROOT, "output/merge", e["id"] + ".mp4"))]
    os.makedirs(os.path.join(ROOT, "output/merge"), exist_ok=True)
    for k in range(0, len(todo), a.batch):
        chunk, ready = todo[k:k + a.batch], []
        for e in chunk:
            b = f"build/merge-{e['id']}"
            os.makedirs(os.path.join(ROOT, b), exist_ok=True)
            th = json.load(open(os.path.join(HERE, "themes", e["theme"] + ".json"), encoding="utf-8"))
            th.update(voice=f"assets/merge/{e['word']}.wav", word=e["word"])
            json.dump(th, open(os.path.join(ROOT, b, "theme.json"), "w"), ensure_ascii=False)
            n = e["n"] + 10  # Seed-Bereich je Video → nie zweimal dieselbe Physik
            ok = False
            for lo_s, hi_s in ((52, 68), (45, 75)):
                r = subprocess.run(f"node merge/sim.mjs {b}/theme.json {b}/sim.json --search {n * 100 + 1}-{n * 100 + 100} --min {lo_s} --max {hi_s}",
                                   shell=True, cwd=ROOT, capture_output=True, text=True)
                if r.returncode == 0:
                    ok = True
                    break
            if not ok:
                print("✗ keine passende Simulation:", e["id"], flush=True)
                continue
            d = json.load(open(os.path.join(ROOT, b, "sim.json")))
            d["__comp"] = "MergeSim"
            json.dump(d, open(os.path.join(ROOT, b, "props.json"), "w"))
            ready.append((e, b))
        if not ready:
            continue
        args = " ".join(f"../{b}/props.json ../{b}/render.mp4" for _, b in ready)
        sh(f"cd remotion && node render.mjs {args} 2>&1 | grep -E 'fertig' || true")
        for e, b in ready:
            out = f"output/merge/{e['id']}"
            sh(f"python3 merge/audio.py {b}/sim.json {b}/audio.wav > /dev/null")
            sh(f"ffmpeg -v error -y -i {b}/render.mp4 -i {b}/audio.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p "
               f"-c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5:LRA=11 -movflags +faststart -shortest {out}.mp4")
            sh(f"ffmpeg -v error -y -ss 0.5 -i {out}.mp4 -frames:v 1 {out}.png")
            os.remove(os.path.join(ROOT, b, "render.mp4"))
            print("✓", e["id"], flush=True)
        if not a.no_push:
            push(f"Kanal 2: Merge-Videos {ready[0][0]['id']} … {ready[-1][0]['id']}")


if __name__ == "__main__":
    main()
