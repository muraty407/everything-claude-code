#!/usr/bin/env bash
# Metronom-Video: Simulation → Remotion → Ticks → MP4
#   bash metronome/make.sh <name> [--seed N --n 100 --dur 24]
set -euo pipefail
cd "$(dirname "$0")/.."
name=$1; shift
b=build/met-$name; mkdir -p $b output/metronome
python3 metronome/sim.py $b/sim.json "$@"
python3 -c "import json;d=json.load(open('$b/sim.json'));d['__comp']='Metronome';json.dump(d,open('$b/props.json','w'))"
(cd remotion && node render.mjs ../$b/props.json ../$b/render.mp4) 2>&1 | grep -E "fertig" || true
python3 metronome/audio.py $b/sim.json $b/audio.wav
ffmpeg -v error -y -i $b/render.mp4 -i $b/audio.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5:LRA=11 -movflags +faststart -shortest output/metronome/$name.mp4
ffmpeg -v error -y -ss 0.3 -i output/metronome/$name.mp4 -frames:v 1 output/metronome/$name.png
echo "✓ output/metronome/$name.mp4"
