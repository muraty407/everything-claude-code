# -*- coding: utf-8 -*-
"""POV-Storys in 3D (Comic-Look, Ich-Perspektive). → content/pov3d.json

    python3 content/pov3d.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import S, V  # noqa: E402

CTX = "GESAMTSCHULE · RAUM 114 · DI"
SEAT = [1.0, 1.12, 1.25]


def cls(yaw=(0, 0), smoke=(0, 0), alarm=False, scared=0, look=0, dark=False, pitch=-0.14):
    return {"room": "classroom", "cam": {"pos": SEAT, "yaw": list(yaw), "pitch": pitch}, "smoke": list(smoke), "alarm": alarm,
            "scared": scared, "look": look, "dark": dark}


def hall(smoke=(0.3, 0.6), z0=0.5, dz=-4, dark=False, run=True):
    return {"room": "hallway", "cam": {"pos": [0.3, 1.6, z0], "yaw": [0.02, -0.04], "pitch": -0.05, "walk": 1, "move": [0, 0, dz]},
            "smoke": list(smoke), "alarm": True, "run": run, "dark": dark}


POV3D = [
    V("feuer-pov-teil-1", "POV: Feueralarm – keine Übung · Teil 1", "#ff5a1f", ("UHRZEIT", None),
      ("POV: FEUER-", "ALARM", "TEIL 1", "KEINE ÜBUNG", "city:day"),
      "POV: Mitten in Mathe riecht es nach Rauch – und diesmal ist es keine Übung. Teil 1 🔥",
      ["pov", "feueralarm", "schule", "deutschland"],
      [
          S("Neun Uhr siebenundvierzig. Mathe. Und dann riecht es nach Rauch.", "3d", c="09:47", ctx=CTX + " 09:47",
            s3d=cls(yaw=(0.05, 0.25), smoke=(0, 0.05))),
          S("Leute … riecht ihr das auch?", "3d", c="09:47", voice="second", s3d=cls(yaw=(0.35, 0.45), look=0.7, scared=0.2)),
          S("Unter der Tür vorne quillt grauer Rauch herein.", "3d", c="09:47",
            s3d=cls(yaw=(0.0, -0.7), smoke=(0.05, 0.3), scared=0.5, look=-0.9)),
          S("Dann der Alarm. Und diesmal sagt niemand: Das ist nur eine Übung.", "3d", c="09:48", fx="shake",
            s3d=cls(yaw=(-0.7, -0.4), smoke=(0.3, 0.4), alarm=True, scared=0.8, look=-0.9)),
          S("Alle raus! Taschen liegen lassen! Sofort!", "3d", c="09:48", voice="second",
            s3d=cls(yaw=(-0.4, -0.75), smoke=(0.4, 0.5), alarm=True, scared=1, look=-0.9)),
          S("Feueralarm bei euch?? Geht's dir gut???", "3d", c="09:48", voice="mama",
            phone=("Mama", ["Feueralarm bei euch??", "Geht's dir gut??? 😰"], 64),
            s3d=cls(yaw=(-0.6, -0.65), smoke=(0.5, 0.55), alarm=True, scared=1, look=-0.9, pitch=-0.35)),
          S("Im Flur siehst du deine eigene Hand kaum noch.", "3d", c="09:49", ctx="FLUR · 2. STOCK",
            s3d=hall(smoke=(0.45, 0.65))),
          S("Dann die Klassengruppe: Treppe A ist voller Rauch. Und: Wo ist Lena?", "3d", c="09:49",
            phone=("Klasse 10b", ["Tyler: TREPPE A IST VOLL RAUCH", "Mia: wo ist Lena???"], 61), s3d=hall(smoke=(0.65, 0.7), z0=-3.5, dz=-1.5)),
          S("Lena war auf dem Klo. Sie ist nicht bei euch.", "3d", c="09:49", fx="shake", big=("LENA", "FEHLT"),
            s3d=hall(smoke=(0.7, 0.8), z0=-5, dz=-1)),
          S("Und genau zur Treppe A rennt gerade die halbe Schule.", "3d", c="09:49", s3d=hall(smoke=(0.8, 0.85), z0=-6, dz=-3)),
          S("Dann gehen die Lichter aus.", "3d", c="09:50", fx="dark", card=("TEIL 2", "MORGEN · 20:30 UHR"),
            s3d=hall(smoke=(0.85, 0.9), z0=-9, dz=-0.5, dark=True)),
      ]),
]


def main():
    out = []
    for n, d in enumerate(POV3D, start=1):
        d = dict(d, day=n, id=f"p3d{n:02d}-{d['slug']}", hook=True, pov=True, series="ZEITZEUGE · POV", badge=f"POV · TEIL {n}",
                 next=None, punch={"word": "RAUCH.", "match": "rauch"} if n == 1 else None, date="2026-11-12", post_time="20:30")
        out.append(d)
    json.dump(out, open(os.path.join(HERE, "pov3d.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(out), "3D-POV")


if __name__ == "__main__":
    main()
