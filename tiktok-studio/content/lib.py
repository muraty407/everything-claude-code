# -*- coding: utf-8 -*-
"""Kleine Helfer, damit die Skripte lesbar bleiben.

S(...) = ein Segment (ein Sprecher-Block + Bild)
V(...) = ein komplettes Video

Szenen-String: "preset:flag1,flag2"  z. B. "city:night,blackout"  "ocean:storm,liner"
Presets: oldtown, volcano, space, earth, city, ocean, room, plant, airship,
         mountains, mars, underwater, map, wall, dark
Overlays: card=(kicker, titel)  stat=(titel, [(label, wert), ...])
          big=(wert, unterzeile)  quote=(zitat, wer)  map=(label, unterzeile)
fx: "shake", "flash", "ash", "snow", "rain", "embers", "dark", "red", "glitch"
voice: None = Erzähler, "second" = zweite Stimme (Zitate)
"""


def S(text, scene, c=None, ctx=None, card=None, stat=None, big=None,
      quote=None, map=None, fx=None, voice=None, you=False, phone=None, s3d=None):
    seg = {"text": text, "scene": scene}
    if c is not None:
        seg["clock"] = c
    if ctx:
        seg["ctx"] = ctx
    if card:
        seg["card"] = {"kicker": card[0], "title": card[1]}
    if stat:
        seg["stat"] = {"title": stat[0], "rows": [list(r) for r in stat[1]]}
    if big:
        seg["big"] = {"value": big[0], "sub": big[1]}
    if quote:
        seg["quote"] = {"text": quote[0], "who": quote[1]}
    if map:
        seg["map"] = {"label": map[0], "sub": map[1]}
    if fx:
        seg["fx"] = [f.strip() for f in fx.split(",") if f.strip()]
    if voice:
        seg["voice"] = voice
    if you:
        seg["you"] = True
    if s3d:  # 3D-POV-Szene (remotion/src/three/World.tsx)
        seg["s3d"] = s3d
    if phone:  # (absender, [nachrichten], akku%, netz-hinweis)
        seg["phone"] = {"from": phone[0], "msgs": list(phone[1])}
        if len(phone) > 2 and phone[2] is not None:
            seg["phone"]["battery"] = phone[2]
        if len(phone) > 3 and phone[3]:
            seg["phone"]["net"] = phone[3]
    return seg


def V(slug, title, accent, hud, thumb, caption, tags, segs):
    return {
        "slug": slug,
        "title": title,
        "accent": accent,
        "hud": {"label": hud[0], "tick": hud[1]},
        "thumb": {"top": thumb[0], "bottom": thumb[1], "tag": thumb[2],
                  "kicker": thumb[3], "scene": thumb[4]},
        "caption": caption,
        "tags": tags,
        "segments": segs,
    }
