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


def crawl(z0=-9, dz=-3, smoke=(0.85, 0.9), door=None):
    return {"room": "hallway", "cam": {"pos": [0.3, 0.45, z0], "yaw": [0.03, -0.03], "pitch": 0.05, "walk": 1, "move": [0, 0, dz]},
            "smoke": list(smoke), "alarm": True, "dark": True, "torch": True, **({"door": door} if door else {})}


def door(z0=-30.5, dz=-0.8, yaw=(0, 0)):
    return {"room": "hallway", "cam": {"pos": [0, 0.9, z0], "yaw": list(yaw), "pitch": 0.0, "move": [0, 0, dz]},
            "smoke": [0.6, 0.7], "alarm": True, "dark": True, "torch": True, "door": "TREPPE B"}


def bath(yaw=(0.1, 0.5), smoke=(0.5, 0.6), z=-1.0, pitch=-0.25):
    return {"room": "bathroom", "cam": {"pos": [0.2, 1.0, z], "yaw": list(yaw), "pitch": pitch}, "smoke": list(smoke), "dark": True, "torch": True}


def yard(yaw=(0.2, -0.2)):
    return {"room": "yard", "cam": {"pos": [0, 1.6, 2.5], "yaw": list(yaw), "pitch": 0.05}, "smoke": [0, 0]}


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
    V("feuer-pov-teil-2", "POV: Feueralarm – keine Übung · Teil 2", "#ff5a1f", ("UHRZEIT", None),
      ("POV: LENA", "FEHLT", "TEIL 2", "KEINE ÜBUNG", "city:night"),
      "Teil 2: Stockdunkel, überall Rauch – und Lena ist noch irgendwo im Gebäude. Hättest du sie gesucht? 🔥",
      ["pov", "feueralarm", "schule", "deutschland"],
      [
          S("Stockdunkel. Der Rauch brennt in den Augen. Und Lena ist noch irgendwo hier drin.", "3d", c="09:50", ctx="FLUR · 2. STOCK",
            s3d=crawl(z0=-9, dz=-1.5)),
          S("Runter auf den Boden. Rauch steigt nach oben, unten ist noch Luft.", "3d", c="09:50", card=("ÜBERLEBENS-TIPP", "UNTEN IST NOCH LUFT"),
            s3d=crawl(z0=-10.5, dz=-2)),
          S("Du kriechst zum Mädchenklo am Ende des Flurs.", "3d", c="09:51", s3d=crawl(z0=-12.5, dz=-4)),
          S("Hier! Ich bin hier! Ich hab die Tür nicht aufgekriegt!", "3d", c="09:51", voice="girl", fx="shake",
            s3d=bath(yaw=(0.2, 0.55))),
          S("Lena hockt zitternd unter den Waschbecken. Du nimmst ihre Hand.", "3d", c="09:51", s3d=bath(yaw=(0.55, 0.75), z=-2.2, pitch=-0.4)),
          S("Bitte antworte!!! Wo bist du???", "3d", c="09:52", voice="mama", phone=("Mama", ["Bitte antworte!!!", "Wo bist du??? 😭"], 41),
            s3d=crawl(z0=-20, dz=-3)),
          S("Treppe A ist dicht. Bleibt nur noch Treppe B.", "3d", c="09:52", big=("TREPPE B", "DIE LETZTE CHANCE"), s3d=door(z0=-29, dz=-1.5)),
          S("Du legst den Handrücken an die Tür. Sie ist heiß.", "3d", c="09:52", card=("ÜBERLEBENS-TIPP", "TÜR ERST MIT HANDRÜCKEN PRÜFEN"),
            s3d=door(z0=-31.5, dz=-0.6)),
          S("Und von der anderen Seite hörst du ein lautes Knacken.", "3d", c="09:53", fx="shake", card=("TEIL 3", "MORGEN · 20:30 UHR"),
            s3d=door(z0=-32.2, dz=-0.2)),
      ]),
    V("feuer-pov-teil-3", "POV: Feueralarm – keine Übung · Teil 3", "#ff5a1f", ("UHRZEIT", None),
      ("POV: NICHT", "ÖFFNEN", "FINALE", "KEINE ÜBUNG", "city:day"),
      "Finale: Die Tür ist heiß – und hinter euch der Rauch. Hättest du die Tür geöffnet? A oder B? 🔥",
      ["pov", "feueralarm", "schule", "deutschland"],
      [
          S("Nicht öffnen. Hinter dieser Tür brennt es.", "3d", c="09:53", ctx="TREPPE B · 2. STOCK", fx="shake", s3d=door(z0=-32.2, dz=0.6)),
          S("Zurück in Raum hundertvierzehn. Tür zu. Jacken in den Spalt.", "3d", c="09:54", card=("ÜBERLEBENS-TIPP", "TÜRSPALT ABDICHTEN"),
            s3d=cls(yaw=(-0.6, -0.2), smoke=(0.5, 0.4), alarm=True, dark=True)),
          S("Fenster auf. Winken. Schreien. So laut ihr könnt.", "3d", c="09:55", fx="shake",
            s3d=cls(yaw=(0.6, 1.25), smoke=(0.4, 0.35), alarm=True, dark=True)),
          S("Da! Die Feuerwehr!", "3d", c="09:56", voice="girl", s3d={**cls(yaw=(1.25, 1.35), smoke=(0.35, 0.3), alarm=True, dark=True), "ladder": True}),
          S("Die Drehleiter fährt direkt an euer Fenster im zweiten Stock.", "3d", c="09:57",
            s3d={**cls(yaw=(1.3, 1.45), smoke=(0.3, 0.3), alarm=True, dark=True), "ladder": True}),
          S("Einer nach dem anderen! Ganz ruhig, wir haben euch!", "3d", c="09:57", voice="second",
            s3d={**cls(yaw=(1.45, 1.5), smoke=(0.3, 0.3), alarm=True, dark=True), "ladder": True}),
          S("Unten auf dem Schulhof wird gezählt. Achtundzwanzig von achtundzwanzig. Auch Lena.", "3d", c="10:06", ctx="SCHULHOF · SAMMELPLATZ",
            big=("28 / 28", "ALLE GERETTET"), s3d=yard(yaw=(0.25, -0.15))),
          S("Ich bin auf dem Weg. Ich hab dich lieb.", "3d", c="10:07", voice="mama", phone=("Mama", ["Ich bin auf dem Weg ❤️", "Ich hab dich lieb"], 9),
            s3d=yard(yaw=(-0.1, -0.2))),
          S("Hättest du die heiße Tür geöffnet? A: Ja. Oder B: Nein? Schreib A oder B.", "3d", c="10:08",
            card=("SCHREIB A ODER B", "A: TÜR AUF · B: FENSTER"), s3d=yard(yaw=(-0.2, 0.1))),
      ]),
]


def main():
    out = []
    for n, d in enumerate(POV3D, start=1):
        d = dict(d, day=n, id=f"p3d{n:02d}-{d['slug']}", hook=True, pov=True, series="ZEITZEUGE · POV", badge=f"POV · TEIL {n}",
                 next=None, punch=[{"word": "RAUCH.", "match": "rauch"}, {"word": "STOCKDUNKEL.", "match": "stockdunkel"}, {"word": "NICHT ÖFFNEN.", "match": "nicht"}][n - 1], date=f"2026-11-{11 + n}", post_time="20:30")
        out.append(d)
    json.dump(out, open(os.path.join(HERE, "pov3d.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(out), "3D-POV")


if __name__ == "__main__":
    main()
