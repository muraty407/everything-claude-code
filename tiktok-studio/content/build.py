# -*- coding: utf-8 -*-
"""Fügt alle 30 Skripte zusammen, vergibt Tag/Datum/Uhrzeit und schreibt
content/days.json + plan/30-TAGE-PLAN.md.

    python3 content/build.py [--start 2026-11-05]
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
from v2_overrides import OVERRIDES  # noqa: E402

BASE_TAGS = ["waswärewenn", "geschichte", "wissen", "fyp", "fürdich", "lernenmittiktok"]
WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
# Posting-Zeiten: Mo–Fr 17:00, Sa/So 11:00 (Wunsch des Kanals). Nach 2 Wochen mit Analytics prüfen.
POST_TIME = {0: "17:00", 1: "17:00", 2: "17:00", 3: "17:00", 4: "17:00", 5: "11:00", 6: "11:00"}


def words(seg_list):
    return sum(len(s["text"].split()) for s in seg_list)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2026-11-04")
    args = ap.parse_args()
    start = dt.date.fromisoformat(args.start)

    days = D1 + D2 + D3
    assert len(days) == 30, len(days)
    out = []
    for i, d in enumerate(days):
        date = start + dt.timedelta(days=i)
        d = dict(d)
        if d["slug"] in OVERRIDES:  # v2-Retention-Format (kürzer, Cold Open, Hook-Titel)
            d["segments"] = OVERRIDES[d["slug"]]
            d["hook"] = True
        d["day"] = i + 1
        d["id"] = f"tag{i + 1:02d}-{d['slug']}"
        d["date"] = date.isoformat()
        d["weekday"] = WOCHENTAGE[date.weekday()]
        d["post_time"] = POST_TIME[date.weekday()]
        d["series"] = f"WAS WÄRE WENN · TAG {i + 1}/30"
        d["next"] = days[i + 1]["title"] if i + 1 < len(days) else None
        d["hashtags"] = ["#" + t for t in (d["tags"] + BASE_TAGS)][:9]
        d["word_count"] = words(d["segments"])
        # Instagram Reels: längere Caption erlaubt, 3–5 Themen-Hashtags (Instagram rät von Hashtag-Spam ab)
        base = d["caption"].split(" #")[0]
        ig_tags = ["#" + t for t in d["tags"][:3]] + ["#zeitzeuge", "#geschichte" if "#geschichte" not in ["#" + t for t in d["tags"][:3]] else "#wissen"]
        d["ig_caption"] = (base + "\n\nSchreib deine Antwort in die Kommentare 👇\nFolge für jeden Tag ein neues Szenario ⏳"
                           + ("\nMorgen: " + d["next"] if d.get("next") else "") + "\n\n" + " ".join(ig_tags))
        out.append(d)

    with open(os.path.join(HERE, "days.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    os.makedirs(os.path.join(ROOT, "plan"), exist_ok=True)
    lines = [
        "# 30-Tage-Upload-Plan · „WAS WÄRE WENN – Geschichte & Wissenschaft hautnah“",
        "",
        f"Start: **{WOCHENTAGE[start.weekday()]}, {start.strftime('%d.%m.%Y')}** · 1 Video pro Tag · "
        "Format 1080×1920, 30 fps, deutsche Sprecher, Untertitel eingebrannt.",
        "",
        "Uhrzeiten sind Startwerte für ein deutsches Publikum (Abendpeak). Nach ~14 Tagen in "
        "TikTok-Analytics → *Follower-Aktivität* prüfen und anpassen.",
        "",
        "| Tag | Datum | Uhrzeit | Thema | Thumbnail-Text | Video | Thumbnail |",
        "|---:|---|---|---|---|---|---|",
    ]
    for d in out:
        t = d["thumb"]
        lines.append(
            f"| {d['day']} | {d['weekday']} {dt.date.fromisoformat(d['date']).strftime('%d.%m.')} | {d['post_time']} | "
            f"{d['title']} | {t['top']} {t['bottom']} | [mp4](../output/videos/{d['id']}.mp4) | "
            f"[png](../output/thumbnails/{d['id']}.png) |"
        )
    lines += ["", "## Captions & Hashtags zum Kopieren", ""]
    for d in out:
        lines += [
            f"### Tag {d['day']} – {d['title']}",
            f"**Posten:** {d['weekday']} {dt.date.fromisoformat(d['date']).strftime('%d.%m.%Y')}, {d['post_time']} Uhr  ",
            "",
            "```",
            d["caption"].split(" #")[0] + "\n\n" + " ".join(d["hashtags"]),
            "```",
            "",
            "**Instagram Reel:**",
            "",
            "```",
            d["ig_caption"],
            "```",
            "",
            "<details><summary>Sprechertext</summary>",
            "",
            " ".join(s["text"] for s in d["segments"]),
            "",
            "</details>",
            "",
        ]
    with open(os.path.join(ROOT, "plan", "30-TAGE-PLAN.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"{len(out)} Tage geschrieben. Ø Wörter: {sum(d['word_count'] for d in out) / 30:.0f}")


if __name__ == "__main__":
    main()
