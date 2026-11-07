# -*- coding: utf-8 -*-
"""Neue Reihenfolge ab Sa 07.11.2026 (nach Analyse der ersten 5 Videos):
Themen, die DICH direkt betreffen (Körper, Überleben, Alltag) und Wissenschaft zuerst,
Geschichte nur dazwischen bzw. am Ende. Zweiteiler bleiben an zwei aufeinanderfolgenden Abenden.

Jeder Tag hat zwei Slots: früh (Mo–Fr 12:00 · Sa/So 11:00) und abends (Mo–Fr 17:00 · Sa/So 18:00).
Bereits gepostet (nicht in der Liste): Tag 1–3 (Pompeji, Sonne, Titanic), Extra 1–2 (Gladiator, Schlaf).
"""
START = "2026-11-07"
FIRST_EPISODE = 6  # Folge 1–5 sind schon online

ORDER = [
    # (früh, abends)
    ("blitzschlag", "flight-19-teil-1"),            # Sa 07.11.
    ("internet-weg", "flight-19-teil-2"),           # So 08.11.
    ("treibsand", "mars-ohne-anzug"),               # Mo 09.11.
    ("lawine", "blackout"),                         # Di 10.11.
    ("schwarzes-loch", "thai-hoehle-teil-1"),       # Mi 11.11.
    ("todeszone-everest", "thai-hoehle-teil-2"),    # Do 12.11.
    ("riesenameise", "erde-stoppt"),                # Fr 13.11.
    ("marianengraben", "chile-bergleute-teil-1"),   # Sa 14.11.
    ("venus-landung", "chile-bergleute-teil-2"),    # So 15.11.
    ("keine-bienen", "mond-verschwindet"),          # Mo 16.11.
    ("lichtgeschwindigkeit", "asteroid"),           # Di 17.11.
    ("erde-ohne-menschen", "gagarin-teil-1"),       # Mi 18.11.
    ("yellowstone", "gagarin-teil-2"),              # Do 19.11.
    ("eifel-vulkan", "antarktis-schmilzt"),         # Fr 20.11.
    ("jupiter-landung", "shackleton-teil-1"),       # Sa 21.11.
    ("sonnensturm", "shackleton-teil-2"),           # So 22.11.
    ("alien-signal", "golfstrom"),                  # Mo 23.11.
    ("gammablitz", "tschernobyl"),                  # Di 24.11.
    ("apollo-13", "archipow-teil-1"),               # Mi 25.11.
    ("mondlandung", "archipow-teil-2"),             # Do 26.11.
    ("sturmflut-hamburg", "mauerfall"),             # Fr 27.11.
    ("hindenburg", "tutanchamun-teil-1"),           # Sa 28.11.
    ("krakatau", "tutanchamun-teil-2"),             # So 29.11.
    ("pest-1349", "lissabon-1755"),                 # Mo 30.11.
    ("brand-london", "jahr-ohne-sommer"),           # Di 01.12.
    ("pyramiden-bau", "brueder-wright"),            # Mi 02.12.
    ("everest-1953", "vasa"),                       # Do 03.12.
    ("penicillin", None),                           # Fr 04.12.
]

# BONUS-Slot (drittes Video, Wunsch 07.11.: 3 pro Tag) – 20:30 Uhr, nur TikTok + YouTube Shorts.
# (datum, uhrzeit, slug) – am 07.11. zwei Bonus-Uploads (15:00 und 20:30).
BONUS = [
    ("2026-11-07", "15:00", "kein-wasser"),
    ("2026-11-07", "20:30", "eiswasser"),
    ("2026-11-08", "20:30", "ohne-essen"),
    ("2026-11-09", "20:30", "auto-unter-wasser"),
    ("2026-11-10", "20:30", "hai"),
    ("2026-11-11", "20:30", "flugzeugtuer"),
    ("2026-11-12", "20:30", "aufzug-seil"),
    ("2026-11-13", "20:30", "luft-anhalten"),
    ("2026-11-14", "20:30", "verliebt"),
    ("2026-11-15", "20:30", "lotto"),
    ("2026-11-16", "20:30", "zu-viel-kaffee"),
    ("2026-11-17", "20:30", "regel-der-drei"),
    ("2026-11-18", "20:30", "erdbeben"),
    ("2026-11-19", "20:30", "hitze-50-grad"),
    ("2026-11-20", "20:30", "fastfood"),
    ("2026-11-21", "20:30", "tunnel-durch-erde"),
    ("2026-11-22", "20:30", "mond-springen"),
    ("2026-11-23", "20:30", "oimjakon"),
    ("2026-11-24", "20:30", "herzstillstand"),
    ("2026-11-25", "20:30", "klippensprung"),
    ("2026-11-26", "20:30", "ein-jahr-all"),
    ("2026-11-27", "20:30", "tsunami"),
    ("2026-11-28", "20:30", "hudson"),
    ("2026-11-29", "20:30", "wueste"),
    ("2026-11-30", "20:30", "sturz-10000m"),
    ("2026-12-01", "20:30", "hoehle-ohne-zeit"),
    ("2026-12-02", "20:30", "stratosphaere"),
]
