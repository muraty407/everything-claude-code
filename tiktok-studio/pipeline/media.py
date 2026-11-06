# -*- coding: utf-8 -*-
"""Plan B: echte Bilder statt Grafiken.

Lädt pro Segment ein passendes, GEMEINFREIES Bild aus
  • Wikimedia Commons  (Abfrage "wm:<Suchbegriff>" oder "file:<Dateiname>")
  • NASA Image Library (Abfrage "nasa:<Suchbegriff>", NASA-Bilder sind gemeinfrei)
und legt es als remotion/public/media/<id>/segNN.jpg ab. Die Quellen landen in
content/media/<id>.json (für Bildnachweise in der Caption).

Die Suchbegriffe stehen in content/media_queries.py:  {slug: [query_seg0, query_seg1, ...]}

    python3 pipeline/media.py --source content/days.json --days 3
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "content"))
from media_queries import QUERIES  # noqa: E402

UA = "ZeitzeugeVideoBot/1.0 (https://github.com/muraty407/everything-claude-code; educational short videos)"
PUBLIC = os.path.join(ROOT, "remotion", "public", "media")
OK_LICENSES = ("public domain", "pd", "cc0", "no restrictions")


def get(url, tries=4):
    for k in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and k < tries - 1:
                time.sleep(15 * (k + 1))
                continue
            raise


def wm_candidates(query, file=False):
    if file:
        params = {"action": "query", "format": "json", "titles": "File:" + query,
                  "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": "1920"}
    else:
        params = {"action": "query", "format": "json", "generator": "search", "gsrnamespace": "6",
                  "gsrsearch": query + " filetype:bitmap", "gsrlimit": "15",
                  "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": "1920"}
    data = json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    out = []
    for p in pages:
        if "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]
        meta = ii.get("extmetadata", {})
        lic = re.sub("<[^>]+>", "", meta.get("LicenseShortName", {}).get("value", "")).strip()
        if not lic.lower().startswith(OK_LICENSES):
            continue
        if ii.get("width", 0) < 900 or ii.get("height", 0) < 600:
            continue
        artist = re.sub("<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()
        # Wikimedia bittet um Thumbnails in Standardgrößen statt Originalen (w.wiki/GHai)
        url = (ii.get("thumburl") or ii["url"]).split("?")[0].replace("//thumb.wikimedia.org/", "//upload.wikimedia.org/")
        out.append({"url": url, "page": "https://commons.wikimedia.org/wiki/" + p["title"].replace(" ", "_"), "title": p["title"], "license": lic,
                    "author": artist[:80], "source": "Wikimedia Commons"})
    return out


def nasa_candidates(query):
    data = json.loads(get("https://images-api.nasa.gov/search?" + urllib.parse.urlencode({"q": query, "media_type": "image"})))
    out = []
    for it in data["collection"]["items"][:15]:
        meta = it["data"][0]
        href = it["links"][0]["href"].replace("~thumb", "~large")
        out.append({"url": href, "title": meta.get("title", ""), "license": "Public domain (NASA)",
                    "author": meta.get("center", "NASA"), "source": "NASA Image Library"})
    return out


def fetch_day(day, used):
    qs = QUERIES.get(day["slug"])
    if not qs:
        print(f"  (keine Bild-Abfragen für {day['slug']})")
        return None
    outdir = os.path.join(PUBLIC, day["id"])
    os.makedirs(outdir, exist_ok=True)
    credits = []
    for i, q in enumerate(qs):
        if not q:
            credits.append(None)
            continue
        kind, _, term = q.partition(":")
        cands = nasa_candidates(term) if kind == "nasa" else wm_candidates(term, file=(kind == "file"))
        cands = [c for c in cands if c["url"] not in used] or cands
        if not cands:
            print(f"  seg{i}: nichts gefunden für {q!r}")
            credits.append(None)
            continue
        c = cands[0]
        used.add(c["url"])
        raw = os.path.join(outdir, f"seg{i:02d}.src")
        with open(raw, "wb") as f:
            f.write(get(c["url"]))
        dst = os.path.join(outdir, f"seg{i:02d}.jpg")
        # auf max. 2400 px Höhe verkleinern (genug für langsamen Zoom/Pan in 1080×1920)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-vf",
                        "scale='if(gt(ih,2400),-2,iw)':'min(ih,2400)',format=yuvj420p", "-q:v", "3", dst], check=True)
        os.remove(raw)
        credits.append({**c, "file": f"media/{day['id']}/seg{i:02d}.jpg"})
        print(f"  seg{i}: {c['title'][:60]}  [{c['license']}]")
        time.sleep(4)
    os.makedirs(os.path.join(ROOT, "content", "media"), exist_ok=True)
    with open(os.path.join(ROOT, "content", "media", day["id"] + ".json"), "w", encoding="utf-8") as f:
        json.dump(credits, f, ensure_ascii=False, indent=1)
    return credits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="content/days.json")
    ap.add_argument("--days", default="1-30")
    args = ap.parse_args()
    sel = set()
    for part in args.days.split(","):
        a, _, b = part.partition("-")
        sel.update(range(int(a), int(b or a) + 1))
    used = set()
    for d in json.load(open(os.path.join(ROOT, args.source), encoding="utf-8")):
        if d["day"] in sel:
            print(f"{d['id']}:")
            fetch_day(d, used)


if __name__ == "__main__":
    main()
