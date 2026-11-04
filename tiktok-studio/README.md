# TikTok-Studio · „WAS WÄRE WENN – Geschichte & Wissenschaft hautnah“

30 fertige deutsche TikTok-Videos (1080×1920, 30 fps, Sprecher und eingebrannte
Untertitel) plus 30 Thumbnails und ein Upload-Plan. Dazu die komplette Pipeline,
mit der du weitere Folgen erzeugen kannst.

* **Upload-Plan:** [`plan/30-TAGE-PLAN.md`](plan/30-TAGE-PLAN.md) – Datum, Uhrzeit, Caption und Hashtags pro Tag
* **Videos:** `output/videos/tagNN-*.mp4`
* **Thumbnails / Cover:** `output/thumbnails/tagNN-*.png`

## Format (aus deinen Referenzvideos abgeleitet, nicht kopiert)

| Referenz-Merkmal | Umsetzung hier |
|---|---|
| Szenario in der Du-Perspektive („What if…“, „Du bist…“) | eigene Themen: Pompeji, Titanic, Mauerfall, Sonnensturm … |
| Laufende Uhr / Countdown oben links | HUD mit Countdown, Uhrzeit, Höhe oder Tiefe |
| Infokarten („Rule #1“), Statistik-Panels, Karten mit Markern | `card`, `stat`, `big`, `map` als Overlays |
| Fette Untertitel mit 2–3 Wörtern, ein Wort farbig | Anton, Schlüsselwort in Akzentfarbe |
| Flacher 2D-Illustrationslook | eigene SVG-Szenenbibliothek (16 Szenen, über 100 Varianten) |
| Cliffhanger und Kommentarfrage am Ende | Abschlussfrage, Vorschau auf morgen, Folgen-CTA |

## Pipeline

```
content/days_*.py ──build.py──► content/days.json
        │
        ├─ pipeline/voice.py      Piper-TTS (Deutsch) → FFmpeg-Veredelung → Timing
        │                         (Wort-Timing via faster-whisper, falls ein Modell erreichbar ist)
        ├─ remotion/              Animation, HUD, Untertitel, Overlays (React/SVG)
        ├─ pipeline/mix.py        FFmpeg: Musik-Ducking, SFX, -14 LUFS, H.264-Export
        └─ pipeline/thumbnails.py Remotion-Hintergrund + HyperFrames-Typo-Overlay → PNG
pipeline/analyze_refs.py          yt-dlp + FFmpeg + faster-whisper: Referenzvideos analysieren
```

### Setup

```bash
pip install -r requirements.txt
bash pipeline/fetch_voices.sh
(cd remotion && npm install) && (cd thumbnails && npm install)
```

### Erzeugen

```bash
python3 content/build.py --start 2026-11-05   # Plan und days.json neu bauen
python3 pipeline/make_all.py                  # alle Videos (überspringt vorhandene)
python3 pipeline/make_all.py --days 7 --force # einzelnes Video neu
python3 pipeline/thumbnails.py                # alle Thumbnails
cd remotion && npx remotion studio src/index.ts   # Live-Vorschau / Feinschliff
```

### Neue Folge schreiben

Ein `V(...)`-Block in `content/days_*.py` ergibt ein Video. Jedes `S(...)` ist ein
Sprecher-Satz plus Bild:

```python
S("Um 10:02 Uhr explodiert die Vulkaninsel.", "ocean:day,island,erupt",
  c="10:02", fx="flash,shake", big=("4.800 KM", "HÖRWEITE"))
```

Szenen: `city oldtown volcano ocean space earth room plant airship mountains mars underwater wall control map dark`
(Varianten wie `night`, `storm`, `flood`, `fire`, `blackout` siehe `remotion/src/scenes.tsx`).

## Hinweise

* **ElevenLabs (empfohlen):** `ELEVENLABS_API_KEY` setzen und `api.elevenlabs.io` im Netzwerk freigeben.
  `python3 pipeline/el_voices.py` erzeugt Hörproben, `ELEVENLABS_VOICE_ID=<id>` wählt die Stimme.
  Mit ElevenLabs sind die Untertitel exakt wortgenau, weil die API Zeitstempel pro Zeichen liefert.
  Bereits erzeugte Sätze werden in `build/_tts_cache` gespeichert und nicht doppelt bezahlt.
* **Offline-Stimmen:** Erzähler „Thorsten“ (Datensatz CC0) und für Zitate „Ramona“ (M-AILABS-Datensatz),
  beide aus Piper. Die Stimmen sind „low quality“ (16 kHz). Für einen natürlicheren
  Klang kannst du in `pipeline/voice.py` eine bessere Piper-Stimme (`*-medium`/`-high`)
  oder eine eigene Aufnahme einsetzen; das Timing passt sich automatisch an.
* **Wort-Timing:** In der Cloud-Umgebung waren die Whisper-Modelle (Hugging Face) gesperrt.
  Deshalb sind die Untertitel an der Silbenlänge des bekannten Skripts ausgerichtet. Lokal mit
  `pip install faster-whisper` nutzt `voice.py` automatisch echte Wort-Zeitstempel.
* **Musik und SFX** werden komplett mit FFmpeg synthetisiert, es gibt also keine Lizenzprobleme.
* **Fakten:** Die Zahlen sind gängige Literaturwerte. Wo Quellen auseinandergehen, steht
  „etwa“, „rund“ oder „laut Berichten“. Vor dem Posten kurz gegenlesen lohnt sich trotzdem.
* TikTok-Label: Wenn du KI-generierte Stimmen nutzt, setze beim Upload „KI-generierter Inhalt“.
