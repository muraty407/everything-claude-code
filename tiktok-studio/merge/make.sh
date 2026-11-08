#!/usr/bin/env bash
# Komplettes Merge-Video: Simulation → Remotion → Sound → MP4 (+ Cover aus dem Finale)
#   bash merge/make.sh planeten [--search 1-40] [--min 57 --max 70]
set -euo pipefail
cd "$(dirname "$0")/.."
theme=$1; shift
b=build/merge-$theme; mkdir -p $b output/merge
node merge/sim.mjs merge/themes/$theme.json $b/sim.json ${@:---search 1-40 --min 57 --max 70}
python3 -c "import json,sys;d=json.load(open('$b/sim.json'));d['__comp']='MergeSim';json.dump(d,open('$b/props.json','w'))"
(cd remotion && node render.mjs ../$b/props.json ../$b/render.mp4) 2>&1 | grep -v -i "memory\|docker\|calculation" | tail -2
python3 merge/audio.py $b/sim.json $b/audio.wav
ffmpeg -v error -y -i $b/render.mp4 -i $b/audio.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5:LRA=11 -movflags +faststart -shortest output/merge/$theme.mp4
top=$(python3 -c "import json;print(json.load(open('$b/sim.json'))['topAt'])")
ffmpeg -v error -y -ss $(python3 -c "print(($top+45)/30)") -i output/merge/$theme.mp4 -frames:v 1 output/merge/$theme.png
echo "✓ output/merge/$theme.mp4"
