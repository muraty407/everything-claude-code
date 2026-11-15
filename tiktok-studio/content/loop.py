# -*- coding: utf-8 -*-
"""Erzähl-Regel „Dopamin-Loop“ ab 17.11. (Wunsch des Nutzers vom 15.11.): Einsatz → große Frage → Finte → Rehook.

Die Kurzfassungen hatten Hook und A/B-Frage, aber meist keine Finte. Hier wird je Video ein Mittel-Segment so
umgeschrieben, dass erst die naheliegende Erwartung kommt („Du denkst …“) und dann die Wendung („Falsch.“).
Fakten bleiben dieselben wie im Original-Skript. slug: {Segment-Index der Kurzfassung: neuer Text}
"""
LOOP_FROM = "2026-11-17"

LOOP = {
    "riesenameise": {1: "Du denkst: Sie ist stärker als du. Eine Ameise trägt ja ein Vielfaches ihres Gewichts.",
                     2: "Falsch. Wird sie zweihundertmal größer, wird sie acht Millionen Mal schwerer."},
    "chile-bergleute-teil-2": {1: "Ganz Chile jubelt. Alle denken: In ein paar Tagen sind sie draußen. Falsch. Die Rettung durch siebenhundert Meter Fels dauert noch Wochen."},
    "keine-bienen": {1: "Du denkst: Dann gibt es eben keinen Honig mehr. Falsch. Bienen und andere Bestäuber helfen bei rund drei Vierteln der wichtigsten Nutzpflanzen."},
    "mond-verschwindet": {1: "Du denkst: Dann ist es nachts eben dunkler. Das ist das kleinste Problem. Ebbe und Flut schrumpfen auf etwa ein Drittel."},
    "lichtgeschwindigkeit": {2: "Du denkst: Ein Jahr Flug, ein Jahr älter. Falsch. Bei neunundneunzig Prozent vergeht für dich ein Jahr, auf der Erde sind es etwa sieben."},
    "erde-ohne-menschen": {2: "Du denkst: Unsere Städte bleiben für immer. Falsch. Nach zehntausend Jahren bleiben: Pyramiden, Teile der Chinesischen Mauer und jede Menge Plastik."},
    "yellowstone": {2: "Du denkst: Amerika ist weit weg. Falsch. Schwefel kühlt die ganze Erde ab. Auch bei uns: kalte Sommer, schlechte Ernten."},
    "eifel-vulkan": {1: "Du denkst: Die Vulkane dort sind längst erloschen. Falsch. Der letzte große Ausbruch war vor rund dreizehntausend Jahren. Daraus entstand der Laacher See."},
    "antarktis-schmilzt": {2: "Du denkst: Das trifft nur die Küste. Falsch. Die Nordsee reicht weit nach Niedersachsen hinein. Münster läge fast am Meer."},
    "jupiter-landung": {1: "Du denkst: Dann fliege ich eben einfach durch. Falsch. Jupiter ist ein Gasriese. Du sinkst immer tiefer durch dicke Wolken."},
    "ohne-essen": {1: "Du denkst: Der Hunger wird jeden Tag schlimmer. Falsch. Er wird sogar oft schwächer. Aber du frierst, wirst müde und schwach."},
    "auto-unter-wasser": {1: "Du denkst: Tür aufdrücken. Falsch. Der Wasserdruck hält sie zu. Die Regel heißt: Gurt, Fenster, raus."},
    "verliebt": {1: "Du denkst, das ist dein Herz. Falsch. Es ist dein Gehirn. Dort wird jetzt viel Dopamin ausgeschüttet. Dasselbe Belohnungssystem, auf das auch Drogen wirken."},
}


def apply(e):
    """Schreibt die Finte in die Kurzfassung. Gibt True zurück, wenn etwas geändert wurde."""
    if e["date"] < LOOP_FROM or e["slug"] not in LOOP or not e.get("short"):
        return False
    for i, text in LOOP[e["slug"]].items():
        e["segments"][i] = dict(e["segments"][i], text=text)
    e["loop"] = True
    return True
