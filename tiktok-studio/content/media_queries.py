# -*- coding: utf-8 -*-
"""Plan B – Bild-Abfragen pro Segment (gleiche Reihenfolge wie die Segmente).

"file:<Name>"  = exakte Datei auf Wikimedia Commons
"wm:<Suche>"   = erste gemeinfreie Trefferdatei auf Wikimedia Commons
"nasa:<Suche>" = erstes Bild der NASA Image Library
None           = Grafik-Szene behalten
"""

QUERIES = {
    "titanic": [
        "file:RMS Titanic 3.jpg",
        "wm:Titanic iceberg 1912",
        "wm:Titanic lifeboat 1912 Carpathia",
        "wm:Titanic collapsible lifeboat",
        "wm:Untergang der Titanic Stöwer",
        "wm:Carpathia Titanic survivors",
    ],
}
