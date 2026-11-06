# -*- coding: utf-8 -*-
"""Baut den Upload-Plan aus allen Skripten.

Slot A (Tag 1–30):   content/days.json    · Mo–Fr 17:00, Sa/So 11:00
Slot B (Extra 1–30): content/days_b.json  · Mo–Fr 12:00, Sa/So 18:00 (Start einen Tag nach Slot A)

Schreibt außerdem plan/30-TAGE-PLAN.md mit Captions für TikTok, Instagram Reels und YouTube Shorts.

    python3 content/build.py [--start 2026-11-04]
"""
import argparse
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from days_01_10 import DAYS as D1  # noqa: E402
from days_11_20 import DAYS as D2  # noqa: E402
from days_21_30 import DAYS as D3  # noqa: E402
from days_b import DAYS_B  # noqa: E402
from v2_overrides import OVERRIDES  # noqa: E402

WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
# Posting-Zeiten (Wunsch des Kanals). Nach ~2 Wochen mit Analytics → Follower-Aktivität prüfen.
POST_TIME_A = {0: "17:00", 1: "17:00", 2: "17:00", 3: "17:00", 4: "17:00", 5: "11:00", 6: "11:00"}
POST_TIME_B = {0: "12:00", 1: "12:00", 2: "12:00", 3: "12:00", 4: "12:00", 5: "18:00", 6: "18:00"}


def words(seg_list):
    return sum(len(s["text"].split()) for s in seg_list)


def enrich(d, *, day, id_, date, post_time, series, nxt, badge=None, brand=None, next_label=None):
    d = dict(d)
    d.update(day=day, id=id_, date=date.isoformat(), weekday=WOCHENTAGE[date.weekday()],
             post_time=post_time, series=series, next=nxt, word_count=words(d["segments"]))
    if badge:
        d["badge"] = badge
    if brand:
        d["brand"] = brand
    if next_label:
        d["next_label"] = next_label
    # Plan B: echte Fotos (pipeline/media.py) einhängen + Bildnachweis merken
    mpath = os.path.join(HERE, "media", id_ + ".json")
    if os.path.exists(mpath):
        credits = json.load(open(mpath, encoding="utf-8"))
        d["segments"] = [dict(s, img=c["file"]) if c else s for s, c in zip(d["segments"], credits + [None] * len(d["segments"]))]
        d["photo_credits"] = sorted({f"{c['source']}" for c in credits if c})
    base = d["caption"].split(" #")[0]
    topic = ["#" + t for t in d["tags"][:3]]
    # TikTok: 5 passende Hashtags statt #fyp/#fürdich (siehe Analyse Tag 1)
    d["hashtags"] = topic + ["#waswärewenn", "#zeitzeuge"]
    # Instagram Reels: 3–5 Hashtags
    ig_tags = topic + ["#zeitzeuge", "#wissen" if "#geschichte" in topic else "#geschichte"]
    d["ig_caption"] = (base + "\n\nSchreib deine Antwort in die Kommentare 👇\nFolge für jeden Tag ein neues Szenario ⏳"
                       + ("\nMorgen: " + nxt if nxt else "") + "\n\n" + " ".join(ig_tags))
    # YouTube Shorts: Titel ≤ 100 Zeichen, Beschreibung mit #shorts
    d["yt_title"] = (d["title"] + " #shorts")[:100]
    d["yt_description"] = base + "\n\n" + " ".join(topic + ["#zeitzeuge", "#shorts"])
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2026-11-04")
    args = ap.parse_args()
    start = dt.date.fromisoformat(args.start)

    # ---- Slot A
    days = D1 + D2 + D3
    assert len(days) == 30, len(days)
    out = []
    for i, d in enumerate(days):
        d = dict(d)
        if d["slug"] in OVERRIDES:  # v2-Retention-Format (kürzer, Cold Open, Hook-Titel)
            d["segments"] = OVERRIDES[d["slug"]]
            d["hook"] = True
        date = start + dt.timedelta(days=i)
        out.append(enrich(d, day=i + 1, id_=f"tag{i + 1:02d}-{d['slug']}", date=date,
                          post_time=POST_TIME_A[date.weekday()], series=f"WAS WÄRE WENN · TAG {i + 1}/30",
                          nxt=days[i + 1]["title"] if i + 1 < len(days) else None))

    # ---- Slot B
    assert len(DAYS_B) == 30, len(DAYS_B)
    out_b = []
    for k, d in enumerate(DAYS_B, start=1):
        d = dict(d, hook=True)
        date = start + dt.timedelta(days=k)
        out_b.append(enrich(d, day=k, id_=f"extra{k:02d}-{d['slug']}", date=date,
                            post_time=POST_TIME_B[date.weekday()], series=f"ZEITZEUGE · EXTRA {k}/30",
                            nxt=DAYS_B[k]["title"] if k < len(DAYS_B) else None,
                            badge=f"EXTRA {k}/30", brand="ZEITZEUGE", next_label="MORGEN · EXTRA"))

    for name, data in (("days.json", out), ("days_b.json", out_b)):
        with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)

    # ---- Plan
    allp = sorted(out + out_b, key=lambda d: (d["date"], d["post_time"]))
    os.makedirs(os.path.join(ROOT, "plan"), exist_ok=True)
    lines = [
        "# Upload-Plan · ZEITZEUGE – „Was wäre wenn“ (2 Videos pro Tag)",
        "",
        f"Start: **{WOCHENTAGE[start.weekday()]}, {start.strftime('%d.%m.%Y')}**. Slot A (Tag 1–30): Mo–Fr 17:00, Sa/So 11:00. "
        "Slot B (Extra 1–30, ab dem Folgetag): Mo–Fr 12:00, Sa/So 18:00.",
        "",
        "Format 1080×1920, 30 fps, Stimme: ElevenLabs „Brian“, Untertitel eingebrannt. Posten auf TikTok, "
        "Instagram Reels und YouTube Shorts (immer die Originaldatei, nie mit Wasserzeichen).",
        "",
        "| Datum | Uhrzeit | Folge | Thema | Video | Cover |",
        "|---|---|---|---|---|---|",
    ]
    for d in allp:
        label = d.get("badge") or f"TAG {d['day']}/30"
        lines.append(
            f"| {d['weekday']} {dt.date.fromisoformat(d['date']).strftime('%d.%m.')} | {d['post_time']} | {label} | "
            f"{d['title']} | [mp4](../output/videos/{d['id']}.mp4) | [png](../output/thumbnails/{d['id']}.png) |")
    lines += ["", "## Texte zum Kopieren", ""]
    for d in allp:
        label = d.get("badge") or f"Tag {d['day']}/30"
        lines += [
            f"### {label} – {d['title']}",
            f"**Posten:** {d['weekday']} {dt.date.fromisoformat(d['date']).strftime('%d.%m.%Y')}, {d['post_time']} Uhr",
            "", "**TikTok:**", "", "```", d["caption"].split(" #")[0] + "\n\n" + " ".join(d["hashtags"]), "```",
            "", "**Instagram Reel:**", "", "```", d["ig_caption"], "```",
            "", "**YouTube Shorts:**", "", "```", "Titel: " + d["yt_title"] + "\n\n" + d["yt_description"], "```",
            "", "<details><summary>Sprechertext</summary>", "", " ".join(s["text"] for s in d["segments"]), "",
            "</details>", "",
        ]
    with open(os.path.join(ROOT, "plan", "30-TAGE-PLAN.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Slot A: {len(out)} · Slot B: {len(out_b)} · Ø Wörter B: {sum(d['word_count'] for d in out_b) / 30:.0f}")


if __name__ == "__main__":
    main()
