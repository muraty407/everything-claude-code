# -*- coding: utf-8 -*-
"""Schritt 3: Audio-Mix + finaler Export mit FFmpeg.

voice.wav (Sprecher) + Musikbett (Ducking per Sidechain) + SFX an den Schnitten
→ Lautheit -14 LUFS (TikTok) → mit dem stummen Remotion-Render muxen,
Filmkorn hinzufügen, H.264/AAC, faststart.
"""
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = os.path.join(ROOT, "assets", "sfx")


MUSIC = os.path.join(ROOT, "assets", "music")
SFX2 = os.path.join(ROOT, "assets", "sfx2")  # aus der Earshot-Bank gerendert (pipeline/earshot.sh sfx render …)


def _sfx(name):
    p = os.path.join(SFX2, name)
    return p if os.path.exists(p) else os.path.join(SFX, {"whoosh_a.wav": "whoosh.wav", "whoosh_b.wav": "whoosh.wav",
                                                          "whoosh_c.wav": "whoosh.wav", "hit.wav": "boom.wav",
                                                          "sub.wav": "boom.wav", "riser.wav": "whoosh.wav"}.get(name, name))


def mix_audio(day, timeline, voice_wav, out_wav):
    """Sprecher (Mitte) + durchgehende Stereo-Musik (unter der Stimme geduckt) + Effekte an den Schnitten (im Stereo verteilt).
    Mit Earshot geprüft (pipeline/earshot.sh critique): Musik durchgehend hörbar, Stereo-Breite, -14 LUFS."""
    dur = timeline["duration"]
    tracks = sorted(f for f in os.listdir(MUSIC) if f.endswith(".wav") and f.startswith("track")) if os.path.isdir(MUSIC) else []
    music = os.path.join(MUSIC, tracks[sum(map(ord, day["id"])) % len(tracks)]) if tracks else os.path.join(SFX, "bed.wav")
    if day.get("music") and os.path.exists(os.path.join(MUSIC, day["music"])):
        music = os.path.join(MUSIC, day["music"])  # z. B. club/club1.wav
    inputs = ["-i", voice_wav, "-stream_loop", "-1", "-i", music]
    events = []  # (datei, startzeit, lautstärke, pan −1..1)
    stop = None  # „Stop-down“: Musik setzt kurz vor dem großen Knall aus → der Knall wirkt stärker
    whooshes = ["whoosh_a.wav", "whoosh_b.wav", "whoosh_c.wav"]
    for seg, ts in zip(day["segments"], timeline["segments"]):
        fx = seg.get("fx", [])
        i = ts["i"]
        if i > 0:
            w = whooshes[i % 3]
            events.append((w, max(0, ts["start"] - (0.45 if w == "whoosh_c.wav" else 0.12)), 0.5, 0.6 if i % 2 else -0.6))
            events.append(("sub.wav", ts["start"], 0.35, 0.0))  # jeder Schnitt bekommt einen weichen Treffer
        if "shake" in fx or "flash" in fx:
            events.append(("hit.wav" if i else "boom.wav", ts["start"], 0.8, 0.0))
        if seg.get("card") or seg.get("stat") or seg.get("big") or seg.get("phone"):
            events.append(("pop.wav", ts["start"] + 0.15, 0.6, 0.3 if i % 2 else -0.3))
    if day.get("punch"):
        m = day["punch"]["match"]
        for ts in timeline["segments"]:
            hit = [w for w in ts["words"] if "".join(ch for ch in w["w"].lower() if ch.isalpha()) == m]
            if hit:
                t = max(0.3, hit[0]["s"])
                events.append(("riser.wav", max(0, t - 0.95), 0.5, 0.0))
                events.append(("boom.wav", t, 1.0, 0.0))
                stop = (max(0.0, t - 0.3), t)
                break
    elif day.get("hook"):
        events.append(("boom.wav", 0.0, 0.9, 0.0))
    if day["hud"].get("tick") == "down":
        t = 1.0
        while t < dur - 1.5:
            events.append((os.path.join(SFX, "tick.wav"), t, 0.12, 0.4 if int(t) % 2 else -0.4))
            t += 1.0
    for f, *_ in events:
        inputs += ["-i", f if os.path.isabs(f) else _sfx(f)]

    fc = [
        "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vsc]",
        f"[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{dur:.3f},afade=t=in:d=0.15,"
        f"afade=t=out:st={max(0, dur - 1.2):.3f}:d=1.2,volume=0.75[bed]",
        "[bed][vsc]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=300:makeup=1"
        + (f",volume=0:enable='between(t,{stop[0]:.3f},{stop[1]:.3f})'" if stop else "") + "[bedd]",
    ]
    labels = ["[v]", "[bedd]"]
    for k, (_, start, vol, pan) in enumerate(events):
        ms = int(start * 1000)
        l, r = (1 - pan) / 2 * 2, (1 + pan) / 2 * 2  # pan 0 → 1/1
        fc.append(f"[{k + 2}:a]aformat=sample_rates=48000:channel_layouts=stereo,pan=stereo|c0={l:.2f}*c0|c1={r:.2f}*c1,"
                  f"adelay={ms}|{ms},volume={vol}[e{k}]")
        labels.append(f"[e{k}]")
    fc.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=first,"
              "loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc),
                    "-map", "[out]", "-t", f"{dur:.3f}", "-ac", "2", out_wav], check=True)


def finalize(video_in, audio_in, out_mp4):
    os.makedirs(os.path.dirname(out_mp4), exist_ok=True)
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", video_in, "-i", audio_in,
        "-vf", "format=yuv420p",
        # Hohe Upload-Qualität: TikTok komprimiert ohnehin neu – je sauberer die Quelle, desto schärfer das Ergebnis.
        "-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", "16",
        "-maxrate", "20M", "-bufsize", "40M", "-profile:v", "high", "-level", "4.2",
        "-r", "30", "-g", "60", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
        "-movflags", "+faststart", "-shortest", out_mp4], check=True)


if __name__ == "__main__":
    import sys
    days = {d["id"]: d for d in json.load(open(os.path.join(ROOT, "content/days.json"), encoding="utf-8"))}
    did = sys.argv[1]
    b = os.path.join(ROOT, "build", did)
    tl = json.load(open(os.path.join(b, "timeline.json"), encoding="utf-8"))
    mix_audio(days[did], tl, os.path.join(b, "voice.wav"), os.path.join(b, "mix.wav"))
    print("ok")
