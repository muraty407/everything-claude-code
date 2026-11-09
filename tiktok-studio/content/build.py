# -*- coding: utf-8 -*-
"""Baut den Upload-Plan aus allen Skripten.

Slot A (Tag 1–30):   content/days.json    · Mo–Fr 17:00, Sa/So 11:00
Slot B (Extra 1–30): content/days_b.json  · Mo–Fr 12:00, Sa/So 18:00 (Start einen Tag nach Slot A)

Schreibt außerdem plan/30-TAGE-PLAN.md mit Captions für TikTok, Instagram Reels und YouTube Shorts.

    python3 content/build.py [--start 2026-11-04]
"""
import argparse
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from days_01_10 import DAYS as D1  # noqa: E402
from days_11_20 import DAYS as D2  # noqa: E402
from days_21_30 import DAYS as D3  # noqa: E402
from days_b import DAYS_B  # noqa: E402
from days_c import DAYS_C  # noqa: E402
from pov import POV  # noqa: E402
from v2_overrides import OVERRIDES  # noqa: E402
import schedule_order  # noqa: E402
import short_ab  # noqa: E402

V3_FROM = "2026-11-10"  # ab hier neuer Einstieg (Sprache ab Frame 0 + Schlagwort)
WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
# Posting-Zeiten (Wunsch des Kanals). Nach ~2 Wochen mit Analytics → Follower-Aktivität prüfen.
POST_TIME_A = {0: "17:00", 1: "17:00", 2: "17:00", 3: "17:00", 4: "17:00", 5: "11:00", 6: "11:00"}
POST_TIME_B = {0: "12:00", 1: "12:00", 2: "12:00", 3: "12:00", 4: "12:00", 5: "18:00", 6: "18:00"}


def words(seg_list):
    return sum(len(s["text"].split()) for s in seg_list)


def fit100(text, tail):
    """YouTube-Texte immer ≤ 100 Zeichen (Wunsch des Nutzers): Text kürzen, Hashtags hinten behalten."""
    room = 100 - len(tail) - 1
    if len(text) > room:
        text = text[: room - 1].rsplit(" ", 1)[0].rstrip(" ,.–-") + "…"
    return f"{text} {tail}"


def enrich(d, *, day, id_, date, post_time, series, nxt, badge=None, brand=None, next_label=None):
    d = dict(d)
    d.update(day=day, id=id_, date=date.isoformat(), weekday=WOCHENTAGE[date.weekday()],
             post_time=post_time, series=series, next=nxt, word_count=words(d["segments"]))
    if badge:
        d["badge"] = badge
    if brand:
        d["brand"] = brand
    if next_label:
        d["next_label"] = next_label
    # Plan B: echte Fotos (pipeline/media.py) einhängen + Bildnachweis merken
    mpath = os.path.join(HERE, "media", id_ + ".json")
    if os.path.exists(mpath):
        credits = json.load(open(mpath, encoding="utf-8"))
        d["segments"] = [dict(s, img=c["file"]) if c else s for s, c in zip(d["segments"], credits + [None] * len(d["segments"]))]
        d["photo_credits"] = sorted({f"{c['source']}" for c in credits if c})
    base = d["caption"].split(" #")[0]
    topic = ["#" + t for t in d["tags"][:3]]
    # TikTok: 5 passende Hashtags statt #fyp/#fürdich (siehe Analyse Tag 1)
    d["hashtags"] = topic + ["#waswärewenn", "#zeitzeuge"]
    # Instagram Reels: 3–5 Hashtags
    ig_tags = topic + ["#zeitzeuge", "#wissen" if "#geschichte" in topic else ("#geschichte" if "geschichte" in d["tags"] else "#wissenschaft")]
    d["ig_caption"] = (base + "\n\nSchreib deine Antwort in die Kommentare 👇\nFolge für jeden Tag ein neues Szenario ⏳"
                       + ("\nAls Nächstes: " + nxt if nxt else "") + "\n\n" + " ".join(ig_tags))
    # YouTube Shorts: Titel ≤ 100 Zeichen, Beschreibung mit #shorts
    d["yt_title"] = fit100(d["title"], "#shorts")
    d["yt_description"] = fit100(base, " ".join(topic[:2] + ["#shorts"]))
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2026-11-04")
    args = ap.parse_args()
    start = dt.date.fromisoformat(args.start)

    # ---- Slot A
    days = D1 + D2 + D3
    assert len(days) == 30, len(days)
    out = []
    for i, d in enumerate(days):
        d = dict(d)
        if d["slug"] in OVERRIDES:  # v2-Retention-Format (kürzer, Cold Open, Hook-Titel)
            d["segments"] = OVERRIDES[d["slug"]]
            d["hook"] = True
        date = start + dt.timedelta(days=i)
        out.append(enrich(d, day=i + 1, id_=f"tag{i + 1:02d}-{d['slug']}", date=date,
                          post_time=POST_TIME_A[date.weekday()], series=f"WAS WÄRE WENN · TAG {i + 1}/30",
                          nxt=days[i + 1]["title"] if i + 1 < len(days) else None))

    # ---- Slot B
    assert len(DAYS_B) == 30, len(DAYS_B)
    out_b = []
    for k, d in enumerate(DAYS_B, start=1):
        d = dict(d, hook=True)
        date = start + dt.timedelta(days=k)
        out_b.append(enrich(d, day=k, id_=f"extra{k:02d}-{d['slug']}", date=date,
                            post_time=POST_TIME_B[date.weekday()], series=f"ZEITZEUGE · EXTRA {k}/30",
                            nxt=DAYS_B[k]["title"] if k < len(DAYS_B) else None,
                            badge=f"EXTRA {k}/30", brand="ZEITZEUGE", next_label="MORGEN · EXTRA"))

    # ---- Neuer Gesamtplan ab 07.11. (schedule.json) – eine Liste, zwei Slots pro Tag
    pool = {d["slug"]: d for d in out + out_b}
    slots = []
    day0 = dt.date.fromisoformat(schedule_order.START)
    for k, pair in enumerate(schedule_order.ORDER):
        date = day0 + dt.timedelta(days=k)
        wk = date.weekday() >= 5
        for which, slug in zip(("früh", "abends"), pair):
            if slug:
                slots.append((date, ("11:00" if wk else "12:00") if which == "früh" else ("18:00" if wk else "17:00"), slug))
    assert len({s for _, _, s in slots}) == len(slots), "Thema doppelt im Plan"
    schedule = []
    for n, (date, time, slug) in enumerate(slots):
        num = schedule_order.FIRST_EPISODE + n
        src = {k: v for k, v in pool[slug].items() if k not in ("photo_credits",)}
        nxt = pool[slots[n + 1][2]]["title"] if n + 1 < len(slots) else None
        e = enrich(src, day=num, id_=f"f{num:02d}-{slug}", date=date, post_time=time,
                   series=f"ZEITZEUGE · FOLGE {num}", nxt=nxt, badge=f"FOLGE {num}", brand="ZEITZEUGE",
                   next_label="ALS NÄCHSTES · FOLGE")
        e["hook"] = True
        schedule.append(e)

    # ---- Neu-Uploads einschieben (v3-Remakes): spätere Folgen rücken je einen Slot weiter
    def slot_times(d0):
        d = d0
        while True:
            wk = d.weekday() >= 5
            yield d, ("11:00" if wk else "12:00")
            yield d, ("18:00" if wk else "17:00")
            d += dt.timedelta(days=1)
    remakes = {d["id"]: d for d in json.load(open(os.path.join(HERE, "remake.json"), encoding="utf-8"))} if os.path.exists(os.path.join(HERE, "remake.json")) else {}
    for date_s, time_s, rid, cap, tags in getattr(schedule_order, "INSERTS", []):
        k = next((i for i, e in enumerate(schedule) if (e["date"], e["post_time"]) >= (date_s, time_s)), len(schedule))
        r = enrich({kk: v for kk, v in remakes[rid].items() if kk not in ("photo_credits",)}, day=remakes[rid]["day"], id_=rid,
                   date=dt.date.fromisoformat(date_s), post_time=time_s, series="ZEITZEUGE", nxt=schedule[k]["title"] if k < len(schedule) else None,
                   badge="NEU · v3")
        r["caption"] = cap + " " + " ".join(tags)
        r["hashtags"] = tags
        r["yt_title"] = fit100(cap.split(" ☀️")[0], "#shorts")
        r["yt_description"] = fit100(cap, " ".join(tags[:2] + ["#shorts"]))
        times = slot_times(dt.date.fromisoformat(date_s))
        next(times) if time_s in ("17:00", "18:00") else None
        nt = next(times)  # Slot des Remakes
        for e in schedule[k:]:
            d2, t2 = next(times)
            e["date"], e["post_time"], e["weekday"] = d2.isoformat(), t2, WOCHENTAGE[d2.weekday()]
        schedule.insert(k, r)

    # ---- BONUS-Slot (3. Video am Tag) → bonus.json
    cpool = {d["slug"]: d for d in DAYS_C}
    bonus = []
    for n, (date, time, slug) in enumerate(schedule_order.BONUS, start=1):
        nxt = cpool[schedule_order.BONUS[n][2]]["title"] if n < len(schedule_order.BONUS) else None
        e = enrich(dict(cpool[slug], hook=True), day=n, id_=f"b{n:02d}-{slug}", date=dt.date.fromisoformat(date),
                   post_time=time, series=f"ZEITZEUGE · BONUS {n}", nxt=nxt, badge=f"BONUS {n}", brand="ZEITZEUGE",
                   next_label="ALS NÄCHSTES · BONUS")
        bonus.append(e)

    # ---- POV-Storys → pov.json (Rendern) + zusätzlich in bonus.json (Lieferung 20:30)
    ppool = {d["slug"]: d for d in POV}
    pov = []
    for n, (date, time, slug) in enumerate(schedule_order.POV, start=1):
        nxt = ppool[schedule_order.POV[n][2]]["title"] if n < len(schedule_order.POV) else None
        e = enrich(dict(ppool[slug], hook=True, pov=True), day=n, id_=f"p{n:02d}-{slug}", date=dt.date.fromisoformat(date),
                   post_time=time, series="ZEITZEUGE · POV", nxt=nxt, badge=f"POV · TEIL {n}", brand="ZEITZEUGE",
                   next_label="MORGEN 20:30 · TEIL")
        e["hashtags"] = ["#pov", "#blackout", "#stromausfall", "#deutschland", "#zeitzeuge"]
        pov.append(e)
    bonus = sorted(bonus + [dict(e, day=100 + e["day"]) for e in pov], key=lambda d: (d["date"], d["post_time"]))

    # ---- v3-Hook für alles, was ab V3_FROM gepostet wird (Test 09.11.: 2,5× Wiedergabezeit)
    def add_punch(e):
        if e["date"] >= V3_FROM and not e.get("punch"):
            first = e["segments"][0]["text"].split()[0]
            e["punch"] = {"word": f"{e['thumb']['top']} {e['thumb']['bottom']}".strip(),
                          "match": "".join(ch for ch in first.lower() if ch.isalpha())}
    for e in schedule + bonus + pov:
        add_punch(e)
    # ---- Kurzfassung ~20 s + A/B-Frage ab short_ab.SHORT_FROM (Ziel: Ø angeschaut > 50 %)
    for e in schedule + bonus:
        segs = short_ab.shorten(e)
        if segs:
            e["segments"], e["short"] = segs, True
            e["word_count"] = words(segs)
            if e["slug"] in short_ab.AB:
                q, a, b = short_ab.AB[e["slug"]]
                e["pin"] = f"{q}? A: {a} oder B: {b}? 👇"

    for name, data in (("days.json", out), ("days_b.json", out_b), ("schedule.json", schedule), ("bonus.json", bonus), ("pov.json", pov)):
        with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)

    # ---- Plan
    posted = [d for d in out[:3]] + [d for d in out_b[:2]]  # bereits online
    allp = sorted(posted + schedule + bonus, key=lambda d: (d["date"], d["post_time"]))
    os.makedirs(os.path.join(ROOT, "plan"), exist_ok=True)
    lines = [
        "# Upload-Plan · ZEITZEUGE – „Was wäre wenn“ (2 Videos pro Tag)",
        "",
        f"Start: **{WOCHENTAGE[start.weekday()]}, {start.strftime('%d.%m.%Y')}**. Slot A (Tag 1–30): Mo–Fr 17:00, Sa/So 11:00. "
        "Slot B (Extra 1–30, ab dem Folgetag): Mo–Fr 12:00, Sa/So 18:00.",
        "",
        "Format 1080×1920, 30 fps, Stimme: ElevenLabs „Brian“, Untertitel eingebrannt. Posten auf TikTok, "
        "Instagram Reels und YouTube Shorts (immer die Originaldatei, nie mit Wasserzeichen).",
        "",
        "| Datum | Uhrzeit | Folge | Thema | Video | Cover |",
        "|---|---|---|---|---|---|",
    ]
    for d in allp:
        label = d.get("badge") or f"TAG {d['day']}/30"
        lines.append(
            f"| {d['weekday']} {dt.date.fromisoformat(d['date']).strftime('%d.%m.')} | {d['post_time']} | {label} | "
            f"{d['title']} | [mp4](../output/videos/{d['id']}.mp4) | [png](../output/thumbnails/{d['id']}.png) |")
    lines += ["", "## Texte zum Kopieren", ""]
    for d in allp:
        label = d.get("badge") or f"Tag {d['day']}/30"
        lines += [
            f"### {label} – {d['title']}",
            f"**Posten:** {d['weekday']} {dt.date.fromisoformat(d['date']).strftime('%d.%m.%Y')}, {d['post_time']} Uhr",
            "", "**TikTok:**", "", "```", d["caption"].split(" #")[0] + "\n\n" + " ".join(d["hashtags"]), "```",
            "", "**Instagram Reel:**", "", "```", d["ig_caption"], "```",
            "", "**YouTube Shorts:**", "", "```", "Titel: " + d["yt_title"] + "\n\n" + d["yt_description"], "```",
            "", "<details><summary>Sprechertext</summary>", "", " ".join(s["text"] for s in d["segments"]), "",
            "</details>", "",
        ]
    with open(os.path.join(ROOT, "plan", "30-TAGE-PLAN.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Plan: {len(posted)} online + {len(schedule)} geplant (Folge {schedule[0]['day']}–{schedule[-1]['day']}, bis {schedule[-1]['date']})")


if __name__ == "__main__":
    main()
