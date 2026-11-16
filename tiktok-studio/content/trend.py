# -*- coding: utf-8 -*-
"""Trend-Videos (aus dem wöchentlichen Trend-Check, plan/trends/). Tagesaktuelle Themen außerhalb des 30-Tage-Plans.

    python3 content/trend.py   →  content/trend.json
Aufbau nach der Dopamin-Loop-Regel: Einsatz/Frage → Fakt → Finte („Du denkst … Falsch.“) → A/B-Frage.
"""
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import S, V  # noqa: E402
import build  # noqa: E402

AB = lambda a, b: ("SCHREIB A ODER B", f"A: {a} · B: {b}")  # noqa: E731

TREND = [
    # Anlass: NASA feiert am 17.11.2026 „Voyager 1 ist einen Lichttag entfernt“
    ("2026-11-17", "12:00", "1 LICHTTAG ENTFERNT", "dieses",
     V("voyager-lichttag", "Voyager 1 ist jetzt einen Lichttag entfernt", "#4cc9f0",
       ("ENTFERNUNG", "up"),
       ("1 LICHTTAG", "ENTFERNT", "VOYAGER 1", "HEUTE", "space:stars"),
       "Dieses Signal ist 24 Stunden unterwegs – von einer Maschine aus dem Jahr 1977. 🛰️ Sollen Außerirdische sie finden?",
       ["voyager", "weltall", "nasa", "wissen"],
       [
           S("Dieses Funksignal ist seit vierundzwanzig Stunden unterwegs. Und es kommt von einer Maschine aus dem Jahr 1977.",
             "space:stars", c="24:00:00", ctx="VOYAGER 1 · NOVEMBER 2026", fx="shake"),
           S("Voyager eins ist jetzt einen ganzen Lichttag von der Erde entfernt. Das sind rund sechsundzwanzig Milliarden Kilometer.",
             "space:earth", c="26 MRD. KM", big=("26 MRD. KM", "WEITER WEG ALS ALLES, WAS MENSCHEN JE GEBAUT HABEN")),
           S("Du denkst, nach fast fünfzig Jahren ist sie längst tot. Falsch. Sie funkt immer noch. Ihr Sender hat nur etwa zwanzig Watt.",
             "space:stars", c="49 JAHRE", stat=("VOYAGER 1", [("START", "1977"), ("SENDER", "≈ 20 WATT"), ("STATUS", "FUNKT NOCH")])),
           S("An Bord ist eine goldene Schallplatte. Mit Grüßen in fünfundfünfzig Sprachen. Sollen Außerirdische sie finden? A: Ja. Oder B: Lieber nicht? Schreib A oder B.",
             "space:stars", c="—", card=AB("JA", "LIEBER NICHT")),
       ])),
    # Anlass: Leoniden-Maximum in der Nacht 17./18.11.2026
    ("2026-11-17", "20:30", "STERNSCHNUPPEN STURM", "heute",
     V("leoniden-sturm", "Heute Nacht: Sternschnuppen – 1833 dachten Menschen an den Weltuntergang", "#ffd166",
       ("STERNSCHNUPPEN", "up"),
       ("STERNSCHNUPPEN", "STURM", "HEUTE NACHT", "LEONIDEN", "space:stars"),
       "Heute Nacht fallen die Leoniden. 1833 fielen so viele, dass Menschen an den Weltuntergang glaubten. 🌠 Schaust du hoch?",
       ["sternschnuppen", "leoniden", "weltall", "wissen"],
       [
           S("Heute Nacht fallen Sternschnuppen über Deutschland. 1833 fielen so viele, dass Menschen dachten, die Welt geht unter.",
             "city:night", c="HEUTE NACHT", ctx="LEONIDEN · 17. NOVEMBER", fx="shake"),
           S("In einer Novembernacht 1833 sahen Menschen in Nordamerika zehntausende Sternschnuppen pro Stunde.",
             "space:stars", c="1833", big=("1833", "ZEHNTAUSENDE STERNSCHNUPPEN PRO STUNDE")),
           S("Du denkst, das sind große Steine. Falsch. Die meisten sind kleiner als ein Sandkorn. Aber sie treffen die Luft mit siebzig Kilometern pro Sekunde.",
             "space:earth", c="70 KM/S", stat=("LEONIDEN", [("GRÖSSE", "WIE EIN SANDKORN"), ("TEMPO", "70 KM PRO SEKUNDE")])),
           S("Heute Nacht sind es nur etwa zehn bis fünfzehn pro Stunde. Am besten nach Mitternacht. Schaust du hoch? A: Ja. Oder B: Zu kalt? Schreib A oder B.",
             "city:night", c="—", card=AB("JA", "ZU KALT")),
       ])),
]


def main():
    out = []
    for n, (date, time, word, match, v) in enumerate(TREND, 1):
        v["hook"] = True
        e = build.enrich(v, day=n, id_=f"t{n:02d}-{v['slug']}", date=dt.date.fromisoformat(date), post_time=time,
                         series="ZEITZEUGE · AKTUELL", nxt="", badge="AKTUELL", brand="ZEITZEUGE")
        e.update(punch={"word": word, "match": match}, short=True, loop=True, trend=True)
        out.append(e)
    json.dump(out, open(os.path.join(HERE, "trend.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("trend.json:", [e["id"] for e in out])


if __name__ == "__main__":
    main()
