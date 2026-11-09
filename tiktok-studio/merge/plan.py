# -*- coding: utf-8 -*-
"""30-Tage-Plan für Kanal 2 (Merge-Simulationen, englisch, ohne Sprecher) → merge/plan.json

2 Videos pro Tag (15:00 und 22:00 Uhr deutscher Zeit = Mittag/Nachmittag in den USA).
Themen rotieren, jedes Video bekommt einen eigenen viralen Begriff, der bei jeder Fusion tiefer wird.

    python3 merge/plan.py [--start 2026-11-09] [--days 30]
"""
import argparse
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from voices import THEME_WORDS, WORDS  # noqa: E402

ORDER = ["autos", "planeten", "tiere", "emojis", "suesses", "baelle", "dinos"]
TIMES = ["15:00", "22:00"]
TEXT = {
    "autos": ("Can this become a rocket? 🚀 Wait for the end…", ["#cars", "#vehicles"], "Which vehicle should be next? 🚗👇"),
    "planeten": ("Can this make the Sun? ☀️ Wait for it…", ["#space", "#planets"], "What should I merge next? 🪐👇"),
    "tiere": ("From ant to blue whale – can it get there? 🐳", ["#animals", "#wildlife"], "Which animal did you expect at the end? 🐾👇"),
    "emojis": ("Which emoji becomes the king? 👑", ["#emoji", "#funny"], "What's your most used emoji? 😂👇"),
    "suesses": ("Can sweets build a giant cake? 🎂", ["#sweets", "#food"], "Which sweet is your favorite? 🍩👇"),
    "baelle": ("Which ball wins? Watch till the end ⚽🏀", ["#sports", "#balls"], "Which sport do you play? ⚽👇"),
    "dinos": ("From a tiny egg to a T-Rex 🦖", ["#dinosaur", "#trex"], "Team T-Rex or team Dragon? 🦖🐉👇"),
}
BASE_TAGS = ["#satisfying", "#simulation", "#oddlysatisfying"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2026-11-09")
    ap.add_argument("--days", type=int, default=30)
    a = ap.parse_args()
    start = dt.date.fromisoformat(a.start)
    general = [w for w in WORDS if not any(w in v for v in THEME_WORDS.values())]
    plan, part, wi = [], {}, 0
    for d in range(a.days):
        for k, time in enumerate(TIMES):
            n = len(plan) + 1
            theme = ORDER[(n - 1) % len(ORDER)]
            part[theme] = part.get(theme, 0) + 1
            if theme in THEME_WORDS:
                ws = THEME_WORDS[theme]
                word = ws[(part[theme] - 1) % len(ws)]
            else:
                word = general[wi % len(general)]
                wi += 1
            cap, tags, pin = TEXT[theme]
            hashtags = BASE_TAGS + tags
            plan.append({
                "n": n, "id": f"m{n:02d}-{theme}-{word}", "theme": theme, "word": word,
                "date": (start + dt.timedelta(days=d)).isoformat(), "post_time": time,
                "caption": f"{cap} (Part {part[theme]}) 🔊 “{WORDS[word].strip('!')}”",
                "hashtags": hashtags,
                "yt_title": (cap.split("…")[0].strip() + " #shorts")[:100],
                "yt_description": (cap + " " + " ".join(hashtags[:2] + ["#shorts"]))[:100],
                "ig_caption": cap + "\n\nFollow for a new merge every day 🔁\n\n" + " ".join(hashtags),
                "pin": pin,
            })
    json.dump(plan, open(os.path.join(HERE, "plan.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{len(plan)} Videos · {plan[0]['date']} bis {plan[-1]['date']}")


if __name__ == "__main__":
    main()
