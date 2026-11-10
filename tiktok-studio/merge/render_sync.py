# -*- coding: utf-8 -*-
"""Rendert fehlende Videos aus merge/sync_plan.json → output/metronome/<id>.mp4/.png
    python3 merge/render_sync.py [--only 1-10]
"""
import argparse
import json
import os
import shutil
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# schon vorhandene Test-Videos für die ersten drei Slots wiederverwenden
REUSE = {"s01-washer": "washers-100", "s02-metronome": "metronome-100", "s03-fan": "fans-100"}

ap = argparse.ArgumentParser()
ap.add_argument("--only")
a = ap.parse_args()
plan = json.load(open(os.path.join(HERE, "sync_plan.json")))
if a.only:
    lo, _, hi = a.only.partition("-")
    plan = [e for e in plan if int(lo) <= e["n"] <= int(hi or lo)]
out = os.path.join(ROOT, "output", "metronome")
for e in plan:
    dst = os.path.join(out, e["id"] + ".mp4")
    if os.path.exists(dst):
        continue
    if e["id"] in REUSE and os.path.exists(os.path.join(out, REUSE[e["id"]] + ".mp4")):
        for ext in (".mp4", ".png"):
            shutil.copy(os.path.join(out, REUSE[e["id"]] + ext), os.path.join(out, e["id"] + ext))
    elif e["kind"] == "metronome":
        subprocess.run(["bash", "metronome/make.sh", e["id"], "--seed", str(e["seed"]), "--n", str(e["count"]), "--dur", "22"], cwd=ROOT, check=True)
    else:
        subprocess.run(["bash", "metronome/make_story.sh", e["id"], e["kind"], e["title"][0], e["title"][1], "--seed", str(e["seed"])], cwd=ROOT, check=True)
    print("✓", e["id"], flush=True)
