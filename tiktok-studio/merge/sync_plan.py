# -*- coding: utf-8 -*-
"""Drittes Daddyverse-Video pro Tag (18:30): Sync-Simulationen (Waschmaschinen, Ventilatoren, Metronome).
→ merge/sync_plan.json        python3 merge/sync_plan.py [--start 2026-11-11] [--days 30]
"""
import argparse
import datetime as dt
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
KINDS = ["washer", "metronome", "fan"]
SUB = {
    "washer": ["can they find one rhythm?", "one floor. one beat?", "wait for the power failure…", "will they spin as one?"],
    "fan": ["will they spin as one?", "nobody touches them…", "can they sync?", "watch what happens…"],
}
TEXT = {
    "washer": ("100 washing machines. One floor. Will they sync? 🤯 Wait for the power failure…", ["#washingmachine"], "Which machine was the rebel? 👀👇"),
    "fan": ("100 desk fans. Nobody touches them. Watch them become one 🌀", ["#fans"], "Did you spot the moment they synced? 🌀👇"),
    "metronome": ("{n} metronomes. Random start. Nobody touches them… 🤯", ["#metronome", "#science"], "Would you have believed this was real physics? 👇"),
}
BASE = ["#satisfying", "#physics", "#oddlysatisfying"]
METRO_N = [100, 64, 144, 81, 121]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2026-11-11")
    ap.add_argument("--days", type=int, default=30)
    a = ap.parse_args()
    d0 = dt.date.fromisoformat(a.start)
    out, cnt = [], {}
    for i in range(a.days):
        kind = KINDS[i % 3]
        cnt[kind] = cnt.get(kind, 0) + 1
        k = cnt[kind]
        cap, tags, pin = TEXT[kind]
        e = {"n": i + 1, "kind": kind, "date": (d0 + dt.timedelta(days=i)).isoformat(), "post_time": "18:30", "seed": 100 + i * 7, "pin": pin}
        if kind == "metronome":
            e["count"] = METRO_N[(k - 1) % len(METRO_N)]
            cap = cap.format(n=e["count"])
        else:
            e["title"] = ["100 WASHING MACHINES" if kind == "washer" else "100 DESK FANS", SUB[kind][(k - 1) % len(SUB[kind])]]
        e["id"] = f"s{i + 1:02d}-{kind}"
        e["caption"] = f"{cap} (Part {k})"
        e["hashtags"] = BASE + tags
        e["yt_title"] = (cap.split("…")[0].split(" 🤯")[0].strip() + " #shorts")[:100]
        e["yt_description"] = (cap + " " + " ".join(BASE[:2] + ["#shorts"]))[:100]
        e["ig_caption"] = cap + "\n\nFollow for a new simulation every day 🔁\n\n" + " ".join(e["hashtags"])
        out.append(e)
    json.dump(out, open(os.path.join(HERE, "sync_plan.json"), "w"), ensure_ascii=False, indent=1)
    print(len(out), "Sync-Videos", out[0]["date"], "bis", out[-1]["date"])


if __name__ == "__main__":
    main()
