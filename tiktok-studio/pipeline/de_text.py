# -*- coding: utf-8 -*-
"""Text-Normalisierung für deutsche TTS (Piper/espeak liest Jahreszahlen sonst
als "eintausend achthundert sechzehn")."""
import re

_EINER = ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun",
          "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn",
          "achtzehn", "neunzehn"]
_ZEHNER = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]

COUNT_NOUNS = ("Fässer", "Menschen", "Kilometer", "Kilometern", "Meter", "Metern", "Häuser",
               "Busse", "Soldaten", "Siedler", "Tote", "Jahre", "Jahren", "Kilogramm", "Grad")


def cardinal(n: int) -> str:
    if n < 20:
        return "eins" if n == 1 else _EINER[n]
    return _card(n)


def _card(n: int) -> str:
    if n < 20:
        return _EINER[n]
    if n < 100:
        z, e = divmod(n, 10)
        return (_EINER[e] + "und" if e else "") + _ZEHNER[z]
    if n < 1000:
        h, r = divmod(n, 100)
        return _EINER[h] + "hundert" + (_card(r) if r else "")
    if n < 1_000_000:
        t, r = divmod(n, 1000)
        return ("" if t == 1 else _card(t)) + "tausend" + (_card(r) if r else "")
    m, r = divmod(n, 1_000_000)
    head = "eine Million" if m == 1 else _card(m) + " Millionen"
    return head + (" " + _card(r) if r else "")


def year(n: int) -> str:
    if 1100 <= n <= 1999:
        h, r = divmod(n, 100)
        return _card(h) + "hundert" + (_card(r) if r else "")
    return cardinal(n)


# Aussprache-Lexikon: Fremdwörter/Namen so schreiben, wie ein deutscher Sprecher sie sagt.
# (Nur für die Sprachausgabe – Untertitel zeigen weiter die echte Schreibweise.)
LEXIKON = [
    ("St.-Paul's-Kathedrale", "Sänt-Pols-Kathedrale"),
    ("Yellowstone-Nationalpark", "Jellostoun-Nationalpark"), ("Yellowstone", "Jellostoun"),
    ("Mount St. Helens", "Maunt Sänt Hellens"), ("Mount Everest", "Maunt Everest"),
    ("Houston", "Hjuhsten"), ("Tranquility", "Tränkwilliti"), ("Eagle", "Iegel"),
    ("Neil Armstrong", "Niel Armstrong"), ("Jack Swigert", "Dschäck Swiggert"),
    ("One-Way-Ticket", "Wann-Wäi-Ticket"), ("WhatsApp", "Wotsäpp"), ("TikTok", "Tick-Tock"),
    ("Mary Shelley", "Märri Schelli"), ("New York", "Nju-Jork"), ("New Jersey", "Nju-Dschörsi"),
    ("Lakehurst", "Läikhörst"), ("Carpathia", "Karpatia"), ("Pudding Lane", "Pudding Läin"),
    ("Thomas Bloodworth", "Tommas Bladwörs"), ("Herbert Morrison", "Hörbert Morrisen"),
    ("Voltaire", "Woltär"), ("Munchs", "Munks"), ("Challengertief", "Tschällendscher-Tief"),
    ("quaranta giorni", "kwaranta dschorni"), ("Crew", "Kru"), ("Blackouts", "Bläckauts"),
    ("Shanghai", "Schanghai"), ("Titanic", "Titanik"), ("Schabowski", "Schabofski"),
    ("DART-Mission", "Dart-Mission"), ("NASA", "Nasa"), ("NATO", "Nato"),
    ("GPS", "Ge-Pe-Es"), ("UKW", "U-Ka-We"), ("UV-Strahlung", "U-Fau-Strahlung"),
    ("US-Geologen", "U-Es-Geologen"), ("US-Ostküste", "U-Es-Ostküste"), ("USA", "U-Es-A"),
    ("Was-wäre-wenn", "Was wäre wenn"), ("Zwölf-null-zwei", "Zwölf null zwei"),
]


def normalize(text: str) -> str:
    t = text
    for a, b in LEXIKON:
        t = re.sub(rf"(?<![\w-]){re.escape(a)}(?![\w])", b, t)
    # Uhrzeiten: 10:02 Uhr -> zehn Uhr zwei ; 01:23 Uhr -> ein Uhr dreiundzwanzig
    def _uhr(m):
        h, mi = int(m.group(1)), int(m.group(2))
        hs = "ein" if h == 1 else cardinal(h)
        return f"{hs} Uhr" + (f" {cardinal(mi)}" if mi else "")
    t = re.sub(r"\b(\d{1,2}):(\d{2})\s*Uhr", _uhr, t)
    # Dezimal: 5,70 -> fünf Komma siebzig ; 3,8 -> drei Komma acht
    def _dez(m):
        a, b = m.group(1), m.group(2)
        frac = cardinal(int(b)) if not b.startswith("0") else " ".join(cardinal(int(c)) for c in b)
        return f"{cardinal(int(a))} Komma {frac}"
    t = re.sub(r"\b(\d+),(\d+)\b", _dez, t)
    # Tausenderpunkte: 13.200 -> 13200
    t = re.sub(r"\b(\d{1,3})\.(\d{3})(?:\.(\d{3}))?\b", lambda m: m.group(0).replace(".", ""), t)
    # Ordinalzahlen beim Datum: "1. November", "26. April"
    MONATE = "Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember"
    ORD = {1: "erste", 2: "zweite", 3: "dritte", 7: "siebte", 8: "achte"}
    def _ord(m):
        n = int(m.group(1))
        w = ORD.get(n) or (cardinal(n) + ("ste" if n >= 20 else "te"))
        before = t[max(0, m.start() - 5):m.start()].lower()
        if re.search(r"\b(am|vom|zum|den|im)\s*$", before):
            w += "n"
        return f"{w} {m.group(2)}"
    t = re.sub(rf"\b(\d{{1,2}})\.\s*({MONATE})", _ord, t)
    # Zahlen + Zählnomen -> Kardinal, sonst 4-stellig = Jahr
    def _num(m):
        n = int(m.group(1))
        after = t[m.end():m.end() + 14].lstrip()
        if 1000 <= n <= 2099 and not after.startswith(COUNT_NOUNS):
            return year(n)
        return cardinal(n)
    t = re.sub(r"\b(\d+)\b", _num, t)
    t = t.replace("%", " Prozent").replace("°C", " Grad").replace("&", " und ")
    t = t.replace("–", ",").replace("…", ",")
    return re.sub(r"\s+", " ", t).strip()


if __name__ == "__main__":
    for s in ["Im Jahr 1816 starben 1178 Menschen.", "13.200 Häuser, 87 Kirchen", "um 10:02 Uhr",
              "5,70 Meter", "3,8 Zentimeter", "Am 1. November 1755", "2022 und 640.000 Jahre", "01:23 Uhr"]:
        print(s, "->", normalize(s))
