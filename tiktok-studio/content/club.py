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


# Abstimmungen: die Zuschauer entscheiden per Kommentar (A/B/C) – jede Nacht ein anderes Thema.
POLLS = [
    ("TOMORROW'S MUSIC", "What do we play tomorrow?", [("A", "DEEP HOUSE"), ("B", "TECH HOUSE"), ("C", "DISCO HOUSE")]),
    ("DRESS CODE", "Tomorrow's dress code?", [("A", "ALL BLACK"), ("B", "ALL WHITE"), ("C", "GOLD ONLY")]),
    ("NEXT PURCHASE", "What do I buy with your money?", [("A", "BIGGER CHANDELIER"), ("B", "CHAMPAGNE TOWER"), ("C", "A SECOND BOUNCER")]),
    ("TOMORROW'S MUSIC", "You're the DJ. What's next?", [("A", "DEEP HOUSE"), ("B", "TECH HOUSE"), ("C", "DISCO HOUSE")]),
    ("WHO GETS IN FREE", "Who gets in free tomorrow?", [("A", "FIRST 10 COMMENTS"), ("B", "EVERYONE WHO SHARES"), ("C", "NOBODY. PAY.")]),
]
MUSIC = {"deep": ("club/deep.wav", 122), "tech": ("club/tech.wav", 126), "disco": ("club/disco.wav", 120)}
LIKE_REWARDS = ["free champagne for everyone", "I smile. Once.", "the bartender gets a day off", "we open the VIP rope for one night"]


def door(queue, yaw=(0.0, 0.0), z=5.6, dz=-1.4):
    return {"room": "clubdoor", "queue": queue, "cam": {"pos": [0.2, 1.7, z], "yaw": list(yaw), "pitch": 0.0, "move": [0, 0, dz]}}


def inside(guests, dj=False, cam="wide", bpm=122):
    c = {"wide": {"pos": [5.2, 3.0, 3.6], "yaw": [0.62, 0.48], "pitch": -0.32},
         "floor": {"pos": [0.0, 1.5, 2.6], "yaw": [-0.25, 0.25], "pitch": -0.1},
         "bar": {"pos": [-2.5, 1.6, 1.5], "yaw": [0.9, 0.7], "pitch": -0.08}}[cam]
    return {"room": "club", "guests": guests, "dj": dj, "bpm": bpm, "cam": c}


ENTRY, DRINKS = 10, 8          # $ pro Gast: Eintritt + Getränke im Schnitt
RENT, BARTENDER = 500, 120     # $ pro Nacht
UPGRADE_COST = {10: 300, 25: 400, 50: 1500, 100: 3000, 250: 8000, 500: 15000, 1000: 40000, 5000: 250000}


def finances(followers, cash_before):
    income = followers * (ENTRY + DRINKS)
    staff = BARTENDER * (2 if followers >= 10 else 1) + (400 if followers >= 50 else 0)
    costs = RENT + staff
    return income, costs, cash_before + income - costs


def episode(night, followers, prev, vip, cash_before=0, music="deep", winner="", likes=None, like_goal=None):
    nxt = next((m for m in MILESTONES if m[0] > followers), MILESTONES[-1])
    new = max(0, followers - prev)
    dj = followers >= 50
    B = "bouncer"
    track, bpm = MUSIC[music]
    _inside = globals()["inside"]

    def inside(g, d=False, cam="wide"):  # Takt der gewählten Musik an die Lichter geben
        return _inside(g, d, cam, bpm)
    income, costs, cash = finances(followers, cash_before)
    ptitle, pq, popts = POLLS[(night - 1) % len(POLLS)]
    poll = S(f"You decide. {pq} " + " ".join(f"{k}: {v.title()}." for k, v in popts) + " Comment your letter.", "3d", c="YOU DECIDE", voice=B,
             stat=(ptitle + " · COMMENT TO VOTE", [(k, v) for k, v in popts]), s3d=inside(followers, dj, "floor"))
    goal = like_goal or max(25, int(round(followers * 2, -1)) or 25)
    reward = LIKE_REWARDS[(night - 1) % len(LIKE_REWARDS)]
    like_seg = S(f"And if this video hits {goal} likes: {reward}.", "3d", c="LIKE GOAL", voice=B, big=(f"{goal} ❤", "LIKE GOAL · " + reward.upper()[:34]),
                 s3d=inside(followers, dj, "wide"))
    money_line = S(f"We made {income} dollars. Rent and staff cost {costs}. " + ("Do the math." if income < costs else "For once, we're in profit. Don't get used to it."),
                   "3d", c="CASH", voice=B, stat=("TONIGHT'S MONEY", [(f"{followers} GUESTS × ${ENTRY + DRINKS}", f"+${income}"), ("RENT + STAFF", f"−${costs}"),
                                                                       ("BALANCE", ("−$" if cash < 0 else "$") + f"{abs(cash):,}")]),
                   s3d=inside(followers, dj, "bar"))
    if night == 1:
        loss = costs - income
        segs = [
            # Hook: sofort drinnen (hell, Bewegung), Verlust als Schlagzeile – erst danach die Erklärung
            S(f"My nightclub loses {loss} dollars a night. Because it has exactly {followers} guests.", "3d", c="NIGHT 1",
              ctx="CLUB DADDYVERSE · 1 FOLLOWER = 1 GUEST", voice=B, fx="shake", s3d=inside(followers, dj, "floor")),
            S("Every follower gets in. I'm the bouncer. I decide who stays.", "3d", c=f"{followers} INSIDE", voice=B,
              s3d=door(followers, yaw=(0.05, -0.05))),
            S("Two guests. That's not a party. That's a meeting.", "3d", c=f"{followers} INSIDE", voice=B,
              big=(str(followers), "GUESTS INSIDE"), s3d=inside(followers, dj, "wide")),
            money_line,
            S(f"At {nxt[0]} followers, I hire {nxt[1].lower()}. If we can pay for it.", "3d", c=f"{followers} / {nxt[0]}", voice=B,
              stat=("NEXT UPGRADE", [(f"{nxt[0]} FOLLOWERS", nxt[1]), ("RIGHT NOW", f"{followers}")]), s3d=inside(followers, dj, "floor")),
            poll,
            S(f"{goal} likes, and there's {reward}. Follow, and you're in. Comment your name for the guest list.", "3d", c="GUEST LIST", voice=B,
              card=("COMMENT YOUR NAME", "GET ON THE GUEST LIST"), s3d=door(0, yaw=(-0.1, 0.1), z=4.4, dz=-1.0)),
        ]
    else:
        names = [n.strip() for n in vip.split(",") if n.strip()]
        mood = ("They know what they did." if new < 0 else "The bartender is talking to himself." if new == 0 else "I let them in. Reluctantly.")
        # Hook (Regel für alle Folgen): sofort drinnen, die stärkste Zahl des Abends als Schlagzeile, erst dann erklären
        hit = next((m for m in MILESTONES if prev < m[0] <= followers), None)
        if hit:
            head, pw = f"We just hit {hit[0]} followers. So I had to hire {hit[1].lower()}.", f"{hit[0]} FOLLOWERS"
        elif new < 0:
            head, pw = f"We lost {-new} guests last night. I threw them out myself.", f"{new} GUESTS"
        elif new == 0:
            head, pw = "Nobody new came in last night. Nobody. I stood there for nothing.", "0 NEW GUESTS"
        elif cash < 0:
            head, pw = f"{new} new guests walked in. And the club is still {abs(cash):,} dollars in debt.", f"−${abs(cash):,}"
        else:
            head, pw = f"{new} new guests walked in. And for the first time, the club is making money.", f"+{new} GUESTS"
        segs = [
            S(head, "3d", c=f"NIGHT {night}", ctx="CLUB DADDYVERSE · 1 FOLLOWER = 1 GUEST", voice=B, fx="shake", s3d=inside(followers, dj, "floor")),
            S(f"Night {night}. {followers} guests inside. " + mood, "3d", c=f"{followers} INSIDE", voice=B,
              big=(f"+{new}" if new >= 0 else str(new), "SINCE LAST NIGHT"), s3d=door(min(max(new, 0), 12), yaw=(0.05, -0.05))),
        ]
        if winner:
            segs.append(S(f"You voted. Tonight: {winner}. Don't blame me.", "3d", c="YOUR VOTE", voice=B, card=("YOU VOTED", winner.upper()), s3d=inside(followers, dj, "floor")))
        if likes is not None:
            segs.append(S(f"Last night got {likes} likes. " + ("Goal reached. A deal is a deal." if likes >= (like_goal or 0) else "Not enough. No champagne."), "3d",
                          c="LIKES", voice=B, big=(f"{likes} ❤", "LAST NIGHT"), s3d=inside(followers, dj, "bar")))
        if names:
            segs.append(S(f"On the guest list tonight: {', '.join(names)}. VIP. Don't touch the ropes.", "3d", c="GUEST LIST", voice=B,
                          stat=("GUEST LIST", [(n.upper(), "VIP ✓") for n in names[:4]]), s3d=inside(followers, dj, "floor")))
        segs += [
            money_line,
            S(f"{nxt[0] - followers} more followers, and I hire {nxt[1].lower()}.", "3d", c=f"{followers} / {nxt[0]}", voice=B,
              stat=("NEXT UPGRADE", [(f"{nxt[0]} FOLLOWERS", nxt[1]), ("MISSING", str(nxt[0] - followers))]), s3d=inside(followers, dj, "bar")),
            poll,
            S(f"{goal} likes, and {reward}. Follow, and you're in. Comment your name for the guest list.", "3d", c="GUEST LIST", voice=B,
              card=("COMMENT YOUR NAME", "GET ON THE GUEST LIST"), s3d=door(0, yaw=(-0.1, 0.1), z=4.4, dz=-1.0)),
        ]
    d = V(f"club-night-{night}", f"Club Daddyverse – Night {night}", "#d4af37", ("TONIGHT", None),
          ("CLUB", "DADDYVERSE", f"NIGHT {night}", "1 FOLLOWER = 1 GUEST", "city:night"),
          f"Every follower gets into my club. Night {night}: {followers} guests 🪩 Comment your name for the guest list",
          ["club", "followers", "nightclub", "series"], segs)
    d.update(day=night, id=f"club{night:02d}", hook=True, series=f"CLUB DADDYVERSE · NIGHT {night}", badge=f"NIGHT {night}", brand="DADDYVERSE",
             next=f"Night {night + 1}: will the club fill up?", next_label="TOMORROW · NIGHT", followLabel="FOLLOW = YOU'RE IN",
             punch={"word": f"−${costs - income} A NIGHT", "match": "loses"} if night == 1 else {"word": pw, "match": segs[0]["text"].split()[1].lower().strip(".,")}, music=track,
             followers=followers, cash=cash,
             money={"label": "CLUB CASH", "values": [cash if (night == 1 or i >= segs.index(money_line)) else cash_before for i in range(len(segs))]},
             hashtags=["#club", "#nightclub", "#followers", "#series", "#fyp"])
    return d


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--night", type=int, required=True)
    ap.add_argument("--followers", type=int, required=True)
    ap.add_argument("--prev", type=int, default=0)
    ap.add_argument("--vip", default="")
    ap.add_argument("--music", default="deep", choices=list(MUSIC), help="gewählte Musik (Ergebnis der Abstimmung)")
    ap.add_argument("--winner", default="", help="Text des Abstimmungs-Siegers von gestern, z. B. 'Tech House'")
    ap.add_argument("--likes", type=int, default=None, help="Likes des gestrigen Videos")
    ap.add_argument("--like-goal", type=int, default=None, help="Like-Ziel von gestern (zum Vergleich)")
    ap.add_argument("--cash", type=int, default=None, help="Kontostand vor dieser Nacht (Standard: aus der letzten Folge)")
    a = ap.parse_args()
    p = os.path.join(HERE, "club.json")
    eps = [e for e in (json.load(open(p, encoding="utf-8")) if os.path.exists(p) else []) if e["day"] != a.night]
    before = a.cash if a.cash is not None else next((e["cash"] for e in reversed(sorted(eps, key=lambda e: e["day"])) if e["day"] < a.night), 0)
    eps.append(episode(a.night, a.followers, a.prev, a.vip, before, a.music, a.winner, a.likes, a.like_goal))
    json.dump(sorted(eps, key=lambda e: e["day"]), open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("club.json: Night", a.night, "·", a.followers, "followers · cash", eps[-1]["cash"])
