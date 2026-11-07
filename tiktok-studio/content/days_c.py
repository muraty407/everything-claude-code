# -*- coding: utf-8 -*-
"""Slot C – BONUS-Folgen (drittes Video am Tag, 20:30 Uhr; TikTok + YouTube Shorts).

Nur „Was passiert mit DIR“-Themen: Körper, Überleben, Alltag – laufen laut Analyse am besten.
v2-Format: 6 Segmente, ~25–32 s, Cold Open, Hook-Titel auf Frame 0.
"""
from lib import S, V

Q = lambda t: ("FRAGE", t)  # noqa: E731

DAYS_C = [
    # 1 ------------------------------------------------------------------
    V("kein-wasser", "Was wäre, wenn du 3 Tage nichts trinkst?", "#3a86ff",
      ("OHNE WASSER", "up"),
      ("3 TAGE", "OHNE WASSER", "DEIN KÖRPER", "WAS WÄRE WENN", "city:day"),
      "Ohne Essen überlebst du Wochen. Ohne Wasser nur ein paar Tage. So reagiert dein Körper 💧",
      ["wasser", "körper", "wissen", "überleben"],
      [
          S("Du hast seit einem ganzen Tag keinen einzigen Schluck getrunken. Und dein Körper schlägt jetzt Alarm.",
            "city:day", c="24:00:00", ctx="DEIN KÖRPER · OHNE WASSER", fx="shake", you=True),
          S("Schon wenn du zwei Prozent deines Körperwassers verlierst, kannst du dich schlechter konzentrieren.",
            "city:day", c="12:00:00", big=("2 %", "WASSERVERLUST = KONZENTRATION SINKT")),
          S("Nach einem Tag: Kopfschmerzen, trockener Mund, dein Urin wird dunkel. Dein Blut wird dicker.",
            "room:day", c="24:00:00", card=("TAG 1", "KOPFSCHMERZEN & DICKES BLUT")),
          S("Nach zwei bis drei Tagen arbeiten deine Nieren kaum noch. Du wirst verwirrt, dein Herz rast.",
            "room:dark", c="60:00:00", fx="red", stat=("DEIN KÖRPER", [("NIEREN", "VERSAGEN"), ("HERZ", "RAST"), ("GEHIRN", "VERWIRRT")])),
          S("Als grobe Regel gilt: Ohne Wasser überlebst du nur etwa drei Tage. Bei Hitze sogar weniger.",
            "city:day", c="72:00:00", big=("3 TAGE", "ÜBERLEBST DU OHNE WASSER")),
          S("Und jetzt ehrlich: Wie viel hast du heute schon getrunken? Schreib es in die Kommentare.",
            "room:day", c="—", card=Q("WIE VIEL HAST DU HEUTE GETRUNKEN?")),
      ]),
    # 2 ------------------------------------------------------------------
    V("eiswasser", "Was passiert, wenn du in eiskaltes Wasser fällst?", "#48cae4",
      ("IM EISWASSER", "up"),
      ("EISWASSER", "1 – 10 – 1", "ÜBERLEBEN", "WAS WÄRE WENN", "mountains:snow"),
      "Du brichst durchs Eis. Diese 3 Zahlen entscheiden, ob du überlebst 🧊 Kanntest du die 1-10-1-Regel?",
      ["eis", "überleben", "wissen", "körper"],
      [
          S("Du brichst durchs Eis. Das Wasser hat null Grad. Und jetzt zählt jede Sekunde.",
            "mountains:snow,ice", c="00:00:00", ctx="ÜBERLEBEN · EISWASSER", fx="shake,snow", you=True),
          S("In der ersten Minute kommt der Kälteschock. Du schnappst nach Luft und atmest viel zu schnell.",
            "mountains:snow,ice", c="00:01:00", big=("1 MINUTE", "KÄLTESCHOCK – ATMUNG KONTROLLIEREN")),
          S("Das Wichtigste: Ruhig bleiben, nicht panisch strampeln. Die Atmung beruhigt sich wieder.",
            "mountains:snow,ice", c="00:01:00", card=("REGEL 1", "NICHT IN PANIK GERATEN")),
          S("Dann hast du etwa zehn Minuten, in denen deine Arme und Beine noch funktionieren. Nutze sie, um rauszukommen.",
            "mountains:snow,ice", c="00:10:00", fx="snow", big=("10 MINUTEN", "BEWEGUNG – RAUS AUS DEM WASSER")),
          S("Bis du durch Unterkühlung bewusstlos wirst, dauert es oft bis zu einer Stunde. Das ist die Eins, Zehn, Eins Regel.",
            "mountains:snow,ice", c="01:00:00", stat=("1 – 10 – 1", [("1 MIN", "KÄLTESCHOCK"), ("10 MIN", "BEWEGUNG"), ("1 STD", "BIS ZUR BEWUSSTLOSIGKEIT")])),
          S("Kanntest du diese Regel schon? Schick das Video jemandem, der im Winter gern aufs Eis geht.",
            "mountains:snow", c="—", card=Q("KANNTEST DU DIE REGEL?")),
      ]),
]
