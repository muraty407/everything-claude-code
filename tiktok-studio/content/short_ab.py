# -*- coding: utf-8 -*-
"""Kurzfassung ab 11.11. (Ziel: Ø angeschaut > 50 %): ~20 s statt ~30 s + A/B-Frage am Ende (mehr Kommentare).

Regel: Hook (Segment 0) bleibt, von den 4 Mittel-Segmenten bleiben die 2 mit den stärksten Fakten
(Zahl/Statistik/Karte vor Karte vor reinem Text), Reihenfolge bleibt. Teil 1 von Zweiteilern behält
3 Mittel-Segmente und den Cliffhanger. Im letzten Segment bleibt die Auflösung, die Frage wird zur A/B-Frage.
"""
import re

SHORT_FROM = "2026-11-11"

# slug: (Frage, A, B)
AB = {
    "blackout": ("Was hättest du gemacht", "Vorräte holen", "Zuhause bleiben"),
    "schwarzes-loch": ("Was wäre dir lieber", "Schwarzes Loch", "Sonne"),
    "thai-hoehle-teil-2": ("Hättest du getaucht", "Ja, sofort", "Nein, warten"),
    "todeszone-everest": ("Würdest du hochsteigen", "Mit Sauerstoff", "Niemals"),
    "riesenameise": ("Wer gewinnt", "Du", "Die Riesenameise"),
    "erde-stoppt": ("Wo wärst du lieber", "Am Äquator", "Am Nordpol"),
    "marianengraben": ("Würdest du runtertauchen", "Ja", "Auf keinen Fall"),
    "venus-landung": ("Was ist schlimmer", "Venus", "Mars"),
    "chile-bergleute-teil-2": ("Wie lange hättest du durchgehalten", "Unter 30 Tage", "Alle 69 Tage"),
    "keine-bienen": ("Worauf verzichtest du zuerst", "Äpfel", "Kaffee"),
    "mond-verschwindet": ("Was würdest du mehr vermissen", "Den Mond", "Die Sterne"),
    "lichtgeschwindigkeit": ("Würdest du einsteigen", "Ja, sofort", "Zu gefährlich"),
    "asteroid": ("Wo versteckst du dich", "Im Keller", "Im Bunker"),
    "erde-ohne-menschen": ("Was hält am längsten", "Pyramiden", "Plastik"),
    "yellowstone": ("Wohin flüchtest du", "Europa", "Südamerika"),
    "gagarin-teil-2": ("Wärst du mitgeflogen", "Ja", "Nein"),
    "eifel-vulkan": ("Wusstest du, dass die Eifel aktiv ist", "Ja", "Nein"),
    "antarktis-schmilzt": ("Wohnst du sicher", "Ja, hoch genug", "Nein, an der Küste"),
    "jupiter-landung": ("Was ist schlimmer", "Jupiter", "Venus"),
    "sonnensturm": ("Was fehlt dir zuerst", "Handy", "Strom"),
    "shackleton-teil-2": ("Hättest du überlebt", "Ja", "Nein"),
    "alien-signal": ("Sollen wir antworten", "Ja", "Nein, lieber still sein"),
    "golfstrom": ("Wohin ziehst du", "Nach Süden", "Bleibe hier"),
    "gammablitz": ("Was macht dir mehr Angst", "Gammablitz", "Asteroid"),
    "tschernobyl": ("Würdest du Tschernobyl besuchen", "Ja", "Nie im Leben"),
    "apollo-13": ("Hättest du die Nerven gehabt", "Ja", "Nein"),
    "archipow-teil-2": ("Hättest du so entschieden wie er", "Ja", "Nein"),
    "mondlandung": ("Wärst du mitgeflogen", "Ja", "Nein"),
    "sturmflut-hamburg": ("Was rettest du zuerst", "Familie", "Papiere und Handy"),
    "mauerfall": ("Wo wärst du gewesen", "An der Mauer", "Zu Hause vorm TV"),
    "hindenburg": ("Würdest du heute Zeppelin fliegen", "Ja", "Nein"),
    "krakatau": ("Was ist lauter", "Krakatau", "Ein Düsenjet"),
    "tutanchamun-teil-2": ("Glaubst du an den Fluch", "Ja", "Nein"),
    "pest-1349": ("Was hättest du gemacht", "Fliehen", "Bleiben"),
    "lissabon-1755": ("Wohin rennst du", "Zum Hafen", "Auf den Hügel"),
    "brand-london": ("Was rettest du zuerst", "Geld", "Haustier"),
    "jahr-ohne-sommer": ("Was fehlt dir mehr", "Sommer", "Sonne"),
    "pyramiden-bau": ("Wer hat sie gebaut", "Bezahlte Arbeiter", "Sklaven"),
    "brueder-wright": ("Wärst du mitgeflogen", "Ja", "Nein"),
    "everest-1953": ("Wer war zuerst oben", "Hillary", "Norgay"),
    "vasa": ("Hättest du gewarnt", "Ja", "Nein"),
    "penicillin": ("Glück oder Genie", "Glück", "Genie"),
    # Bonus
    "ohne-essen": ("Wie lange hast du schon gefastet", "Unter 1 Tag", "Über 1 Tag"),
    "auto-unter-wasser": ("Hast du einen Nothammer im Auto", "Ja", "Nein"),
    "hai": ("Schwimmst du noch im Meer", "Ja", "Nie wieder"),
    "flugzeugtuer": ("Hörst du der Sicherheitsansage zu", "Ja", "Nie"),
    "aufzug-seil": ("Nimmst du den Aufzug", "Aufzug", "Treppe"),
    "luft-anhalten": ("Wie lange schaffst du", "Unter 1 Minute", "Über 1 Minute"),
    "verliebt": ("Bist du gerade verliebt", "Ja", "Nein"),
    "lotto": ("Was machst du zuerst", "Job kündigen", "Niemandem sagen"),
    "zu-viel-kaffee": ("Wie viele Tassen trinkst du", "Unter 4", "Über 4"),
    "regel-der-drei": ("Was suchst du zuerst", "Essen", "Schutz"),
    "erdbeben": ("Was machst du", "Rausrennen", "Unter den Tisch"),
    "hitze-50-grad": ("Was ist schlimmer", "50 Grad", "Minus 30 Grad"),
    "fastfood": ("Wie oft isst du Fast Food", "Selten", "Jede Woche"),
    "tunnel-durch-erde": ("Würdest du springen", "Ja", "Nein"),
    "mond-springen": ("Was machst du auf dem Mond", "Springen", "Foto von der Erde"),
    "oimjakon": ("Würdest du dort leben", "Für Geld ja", "Niemals"),
    "herzstillstand": ("Kannst du Erste Hilfe", "Ja", "Nein"),
    "klippensprung": ("Würdest du springen", "Ja", "Niemals"),
    "ein-jahr-all": ("Würdest du ein Jahr ins All", "Ja", "Nein"),
    "tsunami": ("Hättest du es gewusst", "Ja", "Nein"),
    "hudson": ("Hättest du die Nerven gehabt", "Ja", "Nein"),
    "wueste": ("Hättest du überlebt", "Ja", "Nein"),
    "sturz-10000m": ("Glück oder Wunder", "Glück", "Wunder"),
    "hoehle-ohne-zeit": ("Wie gut ist dein Zeitgefühl", "Sehr gut", "Schlecht"),
    "stratosphaere": ("Würdest du springen", "Ja", "Nein"),
}

SCORE = {"big": 3, "stat": 3, "map": 3, "card": 2, "quote": 1}


def seg_score(s):
    return max([SCORE[k] for k in SCORE if s.get(k)] or [0])


def ab_segment(last, slug, accent_scene=None):
    q, a, b = AB[slug]
    sentences = re.split(r"(?<=[.!?])\s+", last["text"].strip())
    keep = [x for x in sentences if not x.endswith("?") and not x.lower().startswith(("schreib", "welches", "markier", "schick"))]
    text = " ".join(keep + [f"{q}? A: {a}. Oder B: {b}? Schreib A oder B."])
    seg = {k: v for k, v in last.items() if k not in ("card", "stat", "big", "quote", "map")}
    seg["text"] = text
    seg["card"] = {"kicker": "SCHREIB A ODER B", "title": f"A: {a.upper()} · B: {b.upper()}"}
    return seg


def shorten(e):
    """Gibt die gekürzte Fassung eines Plan-Eintrags zurück (oder None, wenn nicht betroffen)."""
    if e["date"] < SHORT_FROM or e.get("short") or e.get("pov") or len(e["segments"]) < 6:
        return None
    segs = e["segments"]
    teil1 = "teil-1" in e["slug"]
    n_keep = 3 if teil1 else 2
    mids = list(range(1, len(segs) - 1))
    best = sorted(mids, key=lambda i: (-seg_score(segs[i]), i))[:n_keep]
    keep = [segs[0]] + [segs[i] for i in sorted(best)]
    if teil1 or e["slug"] not in AB:
        keep.append(segs[-1])
    else:
        keep.append(ab_segment(segs[-1], e["slug"]))
    return keep
