# Laufende Dienste für den Nutzer (Stand 13.11.2026)

1. **Tägliche Lieferungen** (geplante Aufgaben in dieser Session): Zeitzeuge 12/17/20:30 (Wochenende 11/18). Daddyverse Merge (15:00/22:00) und Sync (18:30) seit 13.11. auf Wunsch des Nutzers pausiert – nur noch Club.
2. **Club Daddyverse**: täglich 18:45 Push-Erinnerung → Nutzer schickt Follower-Zahl, Abstimmung (A/B/C), Likes, Namen → `content/club.py` → rendern → liefern.
3. **Kommentar-Service** (auf Zuruf): Nutzer schickt Screenshot der Kommentare → fertige Antworten zum Kopieren.
   - Zeitzeuge: freundlich, kurz, mit Gegenfrage (bringt weitere Kommentare), deutsch, „du“.
   - Daddyverse / Club: englisch; Club-Kommentare beantwortet „der Türsteher“ (trocken, frech, nie beleidigend gegen Personen).
   - Keine Antworten auf Hass/Provokation schreiben – stattdessen „ignorieren/löschen“ empfehlen.
4. **Trend-Check** montags: Websuche nach Trends in beiden Nischen → 5 Themenvorschläge je Kanal → `plan/trends/<datum>.md`.
5. **Wochenbericht** sonntags: aus `plan/STATS.md` (Zahlen aus Screenshots) → beste/schlechteste Videos, was wir ändern.

Statistik, die der Nutzer schickt, immer in `plan/STATS.md` nachtragen.
Ton prüfen: `pipeline/earshot.sh critique <video>`; Sprache transkribieren: `pipeline/listen.py <video>`.

## Erzähl-Regel „Dopamin-Loop“ (vom Nutzer am 15.11. gewünscht, für alle kommenden Skripte)
Quelle: Storytelling-Video, das der Nutzer geschickt hat. Jedes Skript hat mindestens eine Schleife aus 4 Schritten:
1. **Einsatz** – eine Figur zum Mitfiebern, etwas steht auf dem Spiel, Zeitdruck (Club: Vinnie, Schulden, Frist; Zeitzeuge: „du“, Überleben, Countdown).
2. **Große Frage** – nur so viel Kontext, dass eine Frage im Kopf entsteht (nicht sofort beantworten).
3. **Finte** – alles deutet auf A, dann kommt B (die überraschende Wendung, der eigentliche Fakt).
4. **Rehook** – sofort die nächste Frage öffnen (Cliffhanger, Abstimmung, „morgen …“).
Lange Videos: mehrere Schleifen hintereinander. Club-Folgen: höchstens 6 kurze Szenen, Ziel unter 35 Sekunden.

## Regel für Club-Abstimmungen (seit 17.11.)
TikTok hat am 17.11. den Umfrage-Kommentar „What do I do with Marz? Ban him / Make him supervisor / Charge him Rent“ als „Belästigung und Mobbing“ entfernt.
- Keine Abstimmung, in der über einen namentlich genannten Zuschauer negativ entschieden wird (ban, kick, fire, punish …).
- Abstimmungen über Personen nur positiv (wer bekommt den Job) oder über Dinge (Kauf, Musik, Dresscode).
- In Umfrage-Kommentaren keine Namen zusammen mit negativen Wörtern; im Zweifel nur „A / B / C“ als Optionen.

## Stand 17.11. abends – Entscheidung des Nutzers
- **Schwerpunkt: Club Daddyverse.** Zeitzeuge auf TikTok pausiert, nur noch 1 Video pro Tag auf YouTube Shorts (Mo–Fr 17:00, Sa/So 18:00; Teil 2 folgt immer am Tag nach Teil 1). Die Lieferungen 12:00, Sa/So 11:00 und 20:30 sind deaktiviert (nicht gelöscht).
- **Ziele Daddyverse bis 1.12.:** 300 Follower zusammen (TikTok + YouTube; Stand 17.11.: 80), eine Folge über 3.000 Aufrufe, Ø Wiedergabe auf TikTok über 10 Sekunden. Zwei von drei erreicht = weitermachen.
- **Ab Night 7 in jeder Folge:** (1) starkes Bild in der ersten Sekunde (volle Tanzfläche von oben, wachsende Schlange), (2) ein Satz am Anfang, der die Idee für neue Zuschauer erklärt, (3) Anlass zum Teilen („Tag a friend …“). Höchstens 5 Szenen.
- Offene Bewerber: Timber, Escapo (Security), ANS (Barkeeper). Marz-Abstimmung in Night 7 freundlich auflösen.
