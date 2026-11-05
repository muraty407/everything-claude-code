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


def mix_audio(day, timeline, voice_wav, out_wav):
    dur = timeline["duration"]
    inputs = ["-i", voice_wav, "-stream_loop", "-1", "-i", os.path.join(SFX, "bed.wav")]
    events = []  # (datei, startzeit, lautstärke)
    for seg, ts in zip(day["segments"], timeline["segments"]):
        fx = seg.get("fx", [])
        if ts["i"] > 0:
            events.append(("whoosh.wav", max(0, ts["start"] - 0.3), 0.35))
        if "shake" in fx or "flash" in fx or (ts["i"] == 0 and day.get("hook")):
            events.append(("boom.wav", ts["start"], 0.9 if ts["i"] == 0 else 0.8))
        if seg.get("card") or seg.get("stat") or seg.get("big"):
            events.append(("pop.wav", ts["start"] + 0.15, 0.45))
    if day["hud"].get("tick") == "down":
        t = 1.0
        while t < dur - 1.5:
            events.append(("tick.wav", t, 0.12))
            t += 1.0
    for f, _, _ in events:
        inputs += ["-i", os.path.join(SFX, f)]

    fc = [
        "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vsc]",
        f"[1:a]atrim=0:{dur:.3f},afade=t=out:st={max(0, dur - 1.5):.3f}:d=1.5,volume=0.22[bed]",
        "[bed][vsc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[bedd]",
    ]
    labels = ["[v]", "[bedd]"]
    for k, (_, start, vol) in enumerate(events):
        ms = int(start * 1000)
        fc.append(f"[{k + 2}:a]adelay={ms}|{ms},volume={vol}[e{k}]")
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
