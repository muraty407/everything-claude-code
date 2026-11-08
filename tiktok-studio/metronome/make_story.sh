#!/usr/bin/env bash
# Sync-Story-Video: bash metronome/make_story.sh <name> <washer|fan> "<TITEL>" "<untertitel>" [--seed N]
set -euo pipefail
cd "$(dirname "$0")/.."
name=$1; kind=$2; t1=$3; t2=$4; shift 4
b=build/sync-$name; mkdir -p $b output/metronome
python3 metronome/story.py $b/sim.json "$@" > /dev/null
python3 -c "
import json,sys;d=json.load(open('$b/sim.json'));d.update(__comp='SyncGrid',kind='$kind',title=[sys.argv[1],sys.argv[2]]);json.dump(d,open('$b/props.json','w'))" "$t1" "$t2"
(cd remotion && node render.mjs ../$b/props.json ../$b/render.mp4) 2>&1 | grep -E "fertig" || true
python3 metronome/story_audio.py $b/sim.json $b/audio.wav
ffmpeg -v error -y -i $b/render.mp4 -i $b/audio.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5:LRA=11 -movflags +faststart -shortest output/metronome/$name.mp4
ffmpeg -v error -y -ss 0.3 -i output/metronome/$name.mp4 -frames:v 1 output/metronome/$name.png
echo "✓ output/metronome/$name.mp4"
