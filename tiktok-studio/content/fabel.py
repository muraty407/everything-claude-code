# -*- coding: utf-8 -*-
"""„Fabel“-Stil (Wunsch des Nutzers vom 24.11., Referenz: ruhige Vektor-Storys mit Ein-Wort-Untertiteln).

Wahre Geschichten mit einer Lehre, erzählt wie eine Fabel: Bild zeigt genau, was gesagt wird.
    python3 content/fabel.py   →  content/fabel.json
Quellen Hanoi 1902: https://en.wikipedia.org/wiki/Great_Hanoi_Rat_Massacre · https://www.atlasobscura.com/articles/hanoi-rat-massacre-1902
"""
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import S, V  # noqa: E402
import build  # noqa: E402


def F(text, kind, label=None):
    seg = S(text, "space:stars")
    seg["fab"] = {"kind": kind, **({"label": label} if label else {})}
    return seg


FABELN = [
    ("2026-11-24", "17:00",
     V("ratten-von-hanoi", "Diese Ratte hat keinen Schwanz – und genau deshalb lebt sie noch", "#ffd98a",
       ("HANOI 1902", None),
       ("OHNE", "SCHWANZ", "HANOI 1902", "WAHRE GESCHICHTE", "city:night"),
       "Diese Ratte hat keinen Schwanz. Und genau deshalb lebt sie noch. Eine wahre Geschichte aus Hanoi, 1902. 🐀",
       ["geschichte", "psychologie", "wahregeschichte", "wissen"],
       [
           F("Diese Ratte hat keinen Schwanz. Und genau deshalb lebt sie noch.", "rat-notail"),
           F("Hanoi, 1902. Die Stadt gehört den Franzosen. Und unter ihren Villen leben unzählige Ratten.", "city", "HANOI · 1902"),
           F("Die Verwaltung hat eine Idee. Ein Cent für jeden Rattenschwanz.", "bounty"),
           F("Die Menschen liefern. Tausende Schwänze. Die Franzosen zahlen. Und sind zufrieden.", "pile"),
           F("Dann sieht ein Beamter etwas Seltsames. Ratten. Lebendig. Ohne Schwanz.", "spot"),
           F("Die Jäger schneiden nur den Schwanz ab. Und lassen die Ratte wieder frei. Damit sie Junge bekommt. Mit neuen Schwänzen.", "release"),
           F("Vor der Stadt entstehen sogar Rattenfarmen. Die Prämie wird gestrichen. Die Ratten bleiben.", "farm"),
           F("Bezahle Menschen für ein Problem. Und sie sorgen dafür, dass es bleibt.", "moral"),
       ])),
    # Quellen: https://en.wikipedia.org/wiki/Abraham_Wald · https://en.wikipedia.org/wiki/Survivorship_bias
    ("2026-11-24", "17:00",
     V("loecher-im-flugzeug", "Dieses Flugzeug ist voller Einschusslöcher – und genau deshalb kommt es zurück", "#ffd98a",
       ("1943", None),
       ("DIE LÖCHER", "IM FLUGZEUG", "1943", "WAHRE GESCHICHTE", "space:earth"),
       "Dieses Flugzeug ist voller Einschusslöcher. Und genau deshalb kommt es zurück. Eine wahre Geschichte von 1943. ✈️",
       ["geschichte", "psychologie", "wahregeschichte", "wissen"],
       [
           F("Dieses Flugzeug ist voller Einschusslöcher. Und genau deshalb kommt es zurück.", "plane-fly"),
           F("1943. Amerikanische Bomber kehren aus dem Krieg zurück. Zerschossen.", "return", "1943"),
           F("Die Offiziere zählen die Löcher. Die meisten sind an den Flügeln und am Rumpf.", "count"),
           F("Der Plan ist klar. Genau dort mehr Panzerung.", "armor"),
           F("Ein Mathematiker sagt: Nein. Abraham Wald.", "wald"),
           F("Ihr seht nur die Flugzeuge, die zurückgekommen sind. Die anderen wurden woanders getroffen. Am Motor.", "lost"),
           F("Wo die Löcher fehlen, muss die Panzerung hin.", "fix"),
           F("Schau nicht nur auf die, die es geschafft haben. Schau auf die, die fehlen.", "missing"),
       ])),
]


def main():
    out = []
    for n, (date, time, v) in enumerate(FABELN, 1):
        e = build.enrich(v, day=n, id_=f"fb{n:02d}-{v['slug']}", date=dt.date.fromisoformat(date), post_time=time,
                         series="ZEITZEUGE", nxt="", badge="WAHRE GESCHICHTE", brand="ZEITZEUGE")
        e.update(fable=True, short=True, music="fabel/dark1.wav")
        e["pin"] = "Kennst du so ein Beispiel aus deinem Alltag? Schreib es in die Kommentare 👇"
        out.append(e)
    json.dump(out, open(os.path.join(HERE, "fabel.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("fabel.json:", [e["id"] for e in out])


if __name__ == "__main__":
    main()
