# -*- coding: utf-8 -*-
"""Kanal-Trailer „Willkommen bei ZEITZEUGE“ (zum Anpinnen).

    python3 content/trailer.py   → content/trailer.json
    python3 pipeline/make_all.py --source content/trailer.json --days 0
    python3 pipeline/thumbnails.py --source content/trailer.json --days 0
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import S, V  # noqa: E402

T = V("trailer-zeitzeuge", "Willkommen bei ZEITZEUGE", "#ff5a1f",
      ("ZEITZEUGE", None),
      ("DU WARST", "DABEI", "NEU", "WILLKOMMEN BEI ZEITZEUGE", "wall:night,crowd,open"),
      "Willkommen bei Zeitzeuge ⏳ Hier erlebst du Geschichte & Wissenschaft hautnah – aus deiner Perspektive. Folge, damit du kein Szenario verpasst! #zeitzeuge",
      ["zeitzeuge", "waswärewenn", "geschichte", "wissenschaft"],
      [
          S("Was wäre, wenn du dabei gewesen wärst?",
            "dark", ctx="ZEITZEUGE", big=("DU?", "WARST DABEI"), fx="flash"),
          S("In Pompeji. Achtzehn Stunden vor der Glutwolke.",
            "volcano:plume", c="79 N. CHR.", fx="shake", you=True),
          S("Auf der Titanic, kurz vor dem Eisberg.",
            "ocean:night,liner,iceberg", c="1912"),
          S("In Ost-Berlin, in der Nacht, als die Mauer fällt.",
            "wall:night,crowd,open", c="1989", you=True),
          S("Oder neben Neil Armstrong. Mit fünfundzwanzig Sekunden Treibstoff.",
            "space:moonsurface", c="1969", fx="red"),
          S("Hier erlebst du Geschichte und Wissenschaft hautnah. Aus deiner Perspektive.",
            "city:night", c="HEUTE", card=("ZEITZEUGE", "DU WARST DABEI")),
          S("Jeden Tag ein neues Szenario. Folge Zeitzeuge, damit du keins verpasst.",
            "dark", c="TÄGLICH", card=("MO–FR 17 UHR · SA/SO 11 UHR", "JETZT FOLGEN")),
      ])

T.update({
    "day": 0, "id": "trailer-zeitzeuge", "date": None, "weekday": None, "post_time": "sofort",
    "series": "ZEITZEUGE · TRAILER", "next": "Du bist in Pompeji",
    "hashtags": ["#zeitzeuge", "#waswärewenn", "#geschichte", "#wissenschaft", "#fyp", "#fürdich", "#lernenmittiktok"],
})
T["word_count"] = sum(len(s["text"].split()) for s in T["segments"])

if __name__ == "__main__":
    with open(os.path.join(HERE, "trailer.json"), "w", encoding="utf-8") as f:
        json.dump([T], f, ensure_ascii=False, indent=1)
    print("trailer.json:", T["word_count"], "Wörter")
