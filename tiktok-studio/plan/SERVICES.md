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
