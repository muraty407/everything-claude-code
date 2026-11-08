# -*- coding: utf-8 -*-
"""v3-Remakes der besten Videos mit neuem Einstieg (Sprache ab Frame 0 + Schlagwort mit Knall)
für organische Tests und Werbung. → content/remake.json

    python3 content/remake.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import S  # noqa: E402

Q = lambda t: ("FRAGE", t)  # noqa: E731

REMAKES = {
    "sonne-verschwindet": dict(
        punch={"word": "8 MINUTEN.", "match": "acht"},
        segments=[
            S("Noch acht Minuten. Dann wird es auf der Erde dunkel. Für immer.", "space:sun", c="08:00", ctx="JETZT · ÜBERALL AUF DER ERDE", fx="shake"),
            S("Denn die Sonne ist gerade verschwunden. Ihr letztes Licht ist noch unterwegs zu uns.", "space:earth", c="07:52",
              big=("8:20 MIN", "BRAUCHT IHR LICHT ZU UNS")),
            S("Dann wird es schlagartig schwarz. Auch der Mond erlischt – er leuchtet nur durch die Sonne.", "city:night,blackout", c="00:00",
              fx="flash,dark", you=True),
            S("Die Erde rast jetzt geradeaus ins All. Keine Umlaufbahn mehr.", "earth:cold", c="00:00", card=("UMLAUFBAHN", "GERADEAUS INS ALL")),
            S("Nach einer Woche: unter minus siebzehn Grad. Nach einem Jahr: minus siebzig.", "city:night,snow", c="+1 JAHR", fx="snow",
              stat=("TEMPERATUR", [("NACH 1 WOCHE", "< −17 °C"), ("NACH 1 JAHR", "≈ −73 °C")])),
            S("Überleben könntest du nur tief im Meer – oder in Island, mit Erdwärme.", "map", c="+1 JAHR", map=("ISLAND", "ERDWÄRME = ÜBERLEBEN")),
            S("Zum Glück hält die Sonne noch Milliarden Jahre. Hättest du überlebt? Lass ein Herz da, wenn ja.", "space:sun", c="08:00",
              card=Q("HÄTTEST DU ÜBERLEBT?")),
        ]),
}


def main():
    days = {d["slug"]: d for d in json.load(open(os.path.join(HERE, "days.json"), encoding="utf-8"))}
    out = []
    for n, (slug, r) in enumerate(REMAKES.items(), start=1):
        d = dict(days[slug])
        d.update(day=n, id=f"v3-{slug}", segments=r["segments"], punch=r["punch"], hook=True,
                 series="ZEITZEUGE", badge="NEU", next=None)
        out.append(d)
    json.dump(out, open(os.path.join(HERE, "remake.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(out), "Remakes")


if __name__ == "__main__":
    main()
