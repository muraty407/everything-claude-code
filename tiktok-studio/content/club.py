# -*- coding: utf-8 -*-
"""CLUB DADDYVERSE – Follower-Serie für Kanal 2 (englisch): jeder Follower = ein Gast im Club.

    python3 content/club.py --night 1 --followers 2 [--prev 0] [--vip "Name1,Name2"]

Schreibt content/club.json (ein Eintrag = die Folge des Tages). Rendern:
    python3 pipeline/make_all.py --source content/club.json --days <night> --batch 1
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import S, V  # noqa: E402

MILESTONES = [(10, "A SECOND BARTENDER"), (25, "A SMOKE MACHINE"), (50, "A REAL DJ"), (100, "LASER SHOW"), (250, "VIP LOUNGE"),
              (500, "SECOND DANCE FLOOR"), (1000, "ROOFTOP BAR"), (5000, "WE BUY THE BUILDING NEXT DOOR")]


def door(queue, yaw=(0.0, 0.0), z=5.6, dz=-1.4):
    return {"room": "clubdoor", "queue": queue, "cam": {"pos": [0.4, 1.55, z], "yaw": list(yaw), "pitch": 0.02, "move": [0, 0, dz]}}


def inside(guests, dj=False, cam="wide"):
    c = {"wide": {"pos": [5.2, 3.0, 3.6], "yaw": [0.62, 0.48], "pitch": -0.32},
         "floor": {"pos": [0.0, 1.5, 2.6], "yaw": [-0.25, 0.25], "pitch": -0.1},
         "bar": {"pos": [-2.5, 1.6, 1.5], "yaw": [0.9, 0.7], "pitch": -0.08}}[cam]
    return {"room": "club", "guests": guests, "dj": dj, "bpm": 124, "cam": c}


def episode(night, followers, prev, vip):
    nxt = next((m for m in MILESTONES if m[0] > followers), MILESTONES[-1])
    new = max(0, followers - prev)
    dj = followers >= 50
    B = "bouncer"
    if night == 1:
        segs = [
            S(f"Welcome to Club Daddyverse. Every follower gets in. Tonight we have {followers} guests.", "3d", c="NIGHT 1",
              ctx="CLUB DADDYVERSE · 1 FOLLOWER = 1 GUEST", voice=B, s3d=door(followers, yaw=(0.05, -0.05))),
            S("Two. That's not a party. That's a meeting.", "3d", c=f"{followers} INSIDE", voice=B,
              big=(str(followers), "GUESTS INSIDE"), s3d=inside(followers, dj, "wide")),
            S("The bartender is polishing the same glass for three hours.", "3d", c=f"{followers} INSIDE", voice=B, s3d=inside(followers, dj, "bar")),
            S(f"At {nxt[0]} followers, I hire {nxt[1].lower()}.", "3d", c=f"{followers} / {nxt[0]}", voice=B,
              stat=("NEXT UPGRADE", [(f"{nxt[0]} FOLLOWERS", nxt[1]), ("RIGHT NOW", f"{followers}")]), s3d=inside(followers, dj, "floor")),
            S("Follow, and you're in. Comment your name, and you're on the guest list. I check it. Every night.", "3d", c="GUEST LIST", voice=B,
              card=("COMMENT YOUR NAME", "GET ON THE GUEST LIST"), s3d=door(0, yaw=(-0.1, 0.1), z=4.4, dz=-1.0)),
        ]
    else:
        names = [n.strip() for n in vip.split(",") if n.strip()]
        mood = ("We lost guests. I had to throw them out. They know what they did." if new < 0 else
                "Nobody new tonight. I'm standing here for nothing." if new == 0 else
                f"{new} new guests tonight. I let them in. Reluctantly.")
        segs = [
            S(f"Night {night} at Club Daddyverse. {followers} guests inside.", "3d", c=f"NIGHT {night}", ctx="CLUB DADDYVERSE · 1 FOLLOWER = 1 GUEST",
              voice=B, s3d=door(min(new, 12), yaw=(0.05, -0.05))),
            S(mood, "3d", c=f"{followers} INSIDE", voice=B, big=(f"+{new}" if new >= 0 else str(new), "SINCE LAST NIGHT"), s3d=inside(followers, dj, "wide")),
        ]
        if names:
            segs.append(S(f"On the guest list tonight: {', '.join(names)}. VIP. Don't touch the ropes.", "3d", c="GUEST LIST", voice=B,
                          stat=("GUEST LIST", [(n.upper(), "VIP ✓") for n in names[:4]]), s3d=inside(followers, dj, "floor")))
        segs += [
            S(f"{nxt[0] - followers} more followers, and I hire {nxt[1].lower()}.", "3d", c=f"{followers} / {nxt[0]}", voice=B,
              stat=("NEXT UPGRADE", [(f"{nxt[0]} FOLLOWERS", nxt[1]), ("MISSING", str(nxt[0] - followers))]), s3d=inside(followers, dj, "bar")),
            S("Follow, and you're in. Comment your name for the guest list.", "3d", c="GUEST LIST", voice=B,
              card=("COMMENT YOUR NAME", "GET ON THE GUEST LIST"), s3d=door(0, yaw=(-0.1, 0.1), z=4.4, dz=-1.0)),
        ]
    d = V(f"club-night-{night}", f"Club Daddyverse – Night {night}", "#ff2fd6", ("TONIGHT", None),
          ("CLUB", "DADDYVERSE", f"NIGHT {night}", "1 FOLLOWER = 1 GUEST", "city:night"),
          f"Every follower gets into my club. Night {night}: {followers} guests 🪩 Comment your name for the guest list",
          ["club", "followers", "nightclub", "series"], segs)
    d.update(day=night, id=f"club{night:02d}", hook=True, series=f"CLUB DADDYVERSE · NIGHT {night}", badge=f"NIGHT {night}", brand="DADDYVERSE",
             next=f"Night {night + 1}: will the club fill up?", next_label="TOMORROW · NIGHT", followLabel="FOLLOW = YOU'RE IN",
             punch={"word": f"{followers} GUESTS", "match": "welcome" if night == 1 else "night"}, music="club/club1.wav",
             followers=followers, hashtags=["#club", "#nightclub", "#followers", "#series", "#fyp"])
    return d


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--night", type=int, required=True)
    ap.add_argument("--followers", type=int, required=True)
    ap.add_argument("--prev", type=int, default=0)
    ap.add_argument("--vip", default="")
    a = ap.parse_args()
    p = os.path.join(HERE, "club.json")
    eps = [e for e in (json.load(open(p, encoding="utf-8")) if os.path.exists(p) else []) if e["day"] != a.night]
    eps.append(episode(a.night, a.followers, a.prev, a.vip))
    json.dump(sorted(eps, key=lambda e: e["day"]), open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("club.json: Night", a.night, "·", a.followers, "followers")
