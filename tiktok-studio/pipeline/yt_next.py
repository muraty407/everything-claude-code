# -*- coding: utf-8 -*-
"""Zeitzeuge auf YouTube: zwei Videos pro Tag aus einer Warteschlange (seit 23.11.2026).

    python3 pipeline/yt_next.py           → zeigt das nächste Video (JSON)
    python3 pipeline/yt_next.py --mark    → zeigt es und trägt es in plan/yt_sent.txt ein

Warteschlange = alle Einträge aus schedule.json und bonus.json ab 17.11., nach Datum und Uhrzeit sortiert,
ohne die schon gelieferten (plan/yt_sent.txt). Teil 1 und Teil 2 liegen dadurch einen Tag auseinander.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SENT = os.path.join(ROOT, "plan", "yt_sent.txt")


def main():
    sent = set(open(SENT, encoding="utf-8").read().split()) if os.path.exists(SENT) else set()
    q = []
    for f in ("schedule.json", "bonus.json"):
        for e in json.load(open(os.path.join(ROOT, "content", f), encoding="utf-8")):
            if e["date"] >= "2026-11-17" and e["id"] not in sent and os.path.exists(os.path.join(ROOT, "output/videos", e["id"] + ".mp4")):
                q.append(e)
    q.sort(key=lambda e: (e["date"], e["post_time"]))
    if not q:
        print(json.dumps({"empty": True}))
        return
    e = q[0]
    out = {k: e.get(k) for k in ("id", "badge", "title", "yt_title", "yt_description", "pin")}
    out["teil1"] = "teil-1" in e["slug"]
    out["video"] = f"tiktok-studio/output/videos/{e['id']}.mp4"
    out["cover"] = f"tiktok-studio/output/thumbnails/{e['id']}.png"
    out["remaining"] = len(q) - 1
    print(json.dumps(out, ensure_ascii=False, indent=1))
    if "--mark" in sys.argv:
        with open(SENT, "a", encoding="utf-8") as fh:
            fh.write(e["id"] + "\n")


if __name__ == "__main__":
    main()
