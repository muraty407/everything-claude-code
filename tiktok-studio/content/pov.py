# -*- coding: utf-8 -*-
"""POV-Storys (Test ab 09.11.): Ich-Perspektive, Handy-Nachrichten von „Mama“, 3 Teile mit Cliffhanger.

Inspiriert vom Aufbau viraler POV-Videos (nicht vom Inhalt): Geschichte statt Fakten-Liste,
eigener Arm im Bild, Push-Nachrichten zum Mitlesen, ~70 s pro Teil.
Stimmen: Erzähler = Brian, "mama" = Matilda, "second" = Daniel (Leon / Radio).
"""
from lib import S, V

Q = lambda t: ("FRAGE", t)  # noqa: E731
HUD = ("UHRZEIT", None)
CTX = "POV · BLACKOUT IN DEUTSCHLAND"

POV = [
    # Teil 1 ---------------------------------------------------------------
    V("blackout-pov-teil-1", "POV: Blackout in Deutschland – Teil 1", "#ffbe0b", HUD,
      ("POV: STROM", "WEG", "TEIL 1", "DEUTSCHLAND", "city:night,blackout"),
      "POV: In ganz Deutschland fällt der Strom aus – und du bist 9 km von zu Hause weg. Teil 1 🔦",
      ["blackout", "pov", "stromausfall", "deutschland"],
      [
          S("Siebzehn Uhr zweiundvierzig. Du sitzt in der Straßenbahn. Und plötzlich geht überall das Licht aus.",
            "city:dusk,blackout", c="17:42", ctx=CTX, fx="shake"),
          S("Die Bahn bleibt mitten auf der Kreuzung stehen. Die Ampeln sind aus. Die ganze Straße ist dunkel.",
            "city:dusk,blackout", c="17:43"),
          S("Bist du okay? Bei uns ist auch alles aus.", "room:dark", c="17:46", voice="mama",
            phone=("Mama", ["Bist du ok? Bei uns ist auch alles aus 😟"], 23)),
          S("Du willst sie anrufen. Aber der Anruf geht nicht durch. Alle versuchen gleichzeitig zu telefonieren.",
            "city:dusk,blackout", c="17:50", card=("NETZ", "ÜBERLASTET")),
          S("Alter, die ganze Stadt ist dunkel. Sogar die Tankstelle hat zu.", "city:dusk,blackout", c="17:58", voice="second",
            phone=("Leon", ["Alter die ganze Stadt ist dunkel", "Sogar die Tanke hat zu 💀"], 19)),
          S("Du steigst aus. Bis nach Hause sind es neun Kilometer. Zu Fuß.",
            "city:dusk,blackout", c="18:05", big=("9 KM", "BIS NACH HAUSE")),
          S("Es wird Nacht. Keine Straßenlaterne, kein Schaufenster. Nur Scheinwerfer im Stau.",
            "city:night,blackout", c="18:40"),
          S("Die Handymasten haben Notstrom. Aber nur für ein paar Stunden. Und du hast noch zwölf Prozent Akku.",
            "city:night,blackout", c="19:05", fx="red", big=("12 %", "AKKU – KEIN STROM ZUM LADEN")),
          S("Komm nicht über die Hauptstraße. Da ist Chaos.", "city:night,blackout", c="19:12", voice="mama",
            phone=("Mama", ["Komm nicht über die Hauptstraße. Da ist Chaos."], 12)),
          S("Also nimmst du die Abkürzung. Am Supermarkt vorbei.",
            "city:night,blackout", c="19:20"),
          S("Die Scheibe ist eingeschlagen. Drinnen bewegen sich Taschenlampen.",
            "city:night,blackout", c="19:21", fx="shake"),
          S("Dann ruft jemand deinen Namen. Du drehst dich um. Und erkennst, wer da steht.",
            "city:night,blackout", c="19:22", fx="dark", card=("TEIL 2", "MORGEN · 20:30 UHR")),
      ]),
    # Teil 2 ---------------------------------------------------------------
    V("blackout-pov-teil-2", "POV: Blackout in Deutschland – Teil 2", "#ffbe0b", HUD,
      ("POV: AKKU", "3 %", "TEIL 2", "DEUTSCHLAND", "city:night,blackout"),
      "Teil 2: Dein Kumpel will, dass du in den Supermarkt mitkommst. Und dein Akku stirbt. Was hättest du gemacht? 🔦",
      ["blackout", "pov", "stromausfall", "deutschland"],
      [
          S("Es ist Leon. Mit einer Taschenlampe. Und einem Sixpack Wasser in der Hand.",
            "city:night,blackout", c="19:22", ctx="POV · BLACKOUT · TEIL 2", fx="shake"),
          S("Komm rein. Bezahlen kann eh keiner. Morgen ist hier alles leer.", "city:night,blackout", c="19:23",
            voice="second"),
          S("Die Kassen gehen nicht. Kartenzahlung geht nicht. Und Bargeld hat kaum jemand dabei.",
            "city:night,blackout", c="19:24", stat=("SUPERMARKT", [("KASSEN", "AUS"), ("KARTE", "GEHT NICHT"), ("KÜHLUNG", "AUS")])),
          S("Du stehst vor der kaputten Scheibe. Und musst dich entscheiden.",
            "city:night,blackout", c="19:25", card=("DEINE ENTSCHEIDUNG", "REIN ODER WEITER?")),
          S("Wo bist du? Papa holt dich mit dem Auto.", "city:night,blackout", c="19:26", voice="mama",
            phone=("Mama", ["Wo bist du?", "Papa holt dich mit dem Auto!"], 6)),
          S("Du sagst Leon, er soll mitkommen. Er schüttelt nur den Kopf und verschwindet im Laden.",
            "city:night,blackout", c="19:27"),
          S("Du schickst Mama deinen Standort. Der Kreis dreht sich. Und dreht sich.",
            "city:night,blackout", c="19:28",
            phone=("Mama", ["📍 Standort wird gesendet …"], 3, "KEIN NETZ")),
          S("Dann wird der Bildschirm schwarz. Akku leer.",
            "city:night,blackout", c="19:29", fx="dark", big=("0 %", "AKKU LEER")),
          S("Du bist allein. Im Dunkeln. Und du weißt nicht, ob die Nachricht angekommen ist.",
            "city:night,blackout", c="19:40", fx="dark"),
          S("Hinter dir quietschen Reifen. Ein Auto hält direkt neben dir. Die Tür geht auf.",
            "city:night,blackout", c="19:51", fx="shake", card=("TEIL 3", "MORGEN · 20:30 UHR")),
      ]),
    # Teil 3 ---------------------------------------------------------------
    V("blackout-pov-teil-3", "POV: Blackout in Deutschland – Teil 3", "#ffbe0b", HUD,
      ("POV: 3 TAGE", "OHNE STROM", "TEIL 3", "DEUTSCHLAND", "room:night,candle"),
      "Teil 3 (Finale): Du bist zu Hause – aber dann kommt die Durchsage im Radio. Wie lange würdest du durchhalten? 🕯️",
      ["blackout", "pov", "stromausfall", "deutschland"],
      [
          S("Es ist Papa. Die Nachricht ist angekommen. Gerade noch.",
            "city:night,blackout", c="19:51", ctx="POV · BLACKOUT · TEIL 3", fx="shake"),
          S("Die Fahrt dauert eine Stunde. Ohne Ampeln ist jede Kreuzung ein Risiko.",
            "city:night,blackout", c="20:30", card=("KEINE AMPELN", "JEDE KREUZUNG = RISIKO")),
          S("Zu Hause brennen Kerzen. Mama hat das alte Batterieradio aus dem Keller geholt.",
            "room:night,candle", c="21:05"),
          S("Der Stromausfall betrifft weite Teile Deutschlands. Mit einer Rückkehr ist frühestens in drei Tagen zu rechnen.",
            "room:night,candle", c="21:10", voice="second",
            quote=("Mit einer Rückkehr ist frühestens in drei Tagen zu rechnen.", "Radio-Durchsage")),
          S("Drei Tage. Ohne Kühlschrank, ohne Heizung, ohne Handy.",
            "room:night,candle", c="21:11", stat=("3 TAGE OHNE STROM", [("KÜHLSCHRANK", "AUS"), ("HEIZUNG", "AUS"), ("HANDY", "LEER")])),
          S("Und in vielen Hochhäusern kommt ohne Strom bald kein Wasser mehr aus dem Hahn. Ihr habt noch zwei Flaschen.",
            "room:night,candle", c="21:15", fx="red", big=("2 FLASCHEN", "WASSER FÜR 3 TAGE?")),
          S("Das Bundesamt für Bevölkerungsschutz empfiehlt Vorräte für zehn Tage. Wasser, Essen, Kerzen und ein Radio mit Batterien.",
            "room:night,candle", c="21:20", stat=("VORRAT FÜR 10 TAGE", [("WASSER", "2 L / TAG"), ("ESSEN", "10 TAGE"), ("RADIO", "BATTERIE")])),
          S("Wie viele Tage würdest du zu Hause durchhalten? Und welche POV-Geschichte soll als Nächstes kommen?",
            "room:night,candle", c="21:30", card=Q("WIE LANGE HÄLTST DU DURCH?")),
      ]),
]
