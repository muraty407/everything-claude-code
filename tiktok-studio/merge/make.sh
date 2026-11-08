#!/usr/bin/env bash
# Komplettes Merge-Video: Simulation → Remotion → Sound → MP4 (+ Cover)
#   bash merge/make.sh <theme> [<wort>|auto] [sim-Optionen, z. B. --search 1-40 --min 54 --max 66]
# Jedes Video bekommt einen anderen viralen Begriff (merge/voices.py); "auto" nimmt den nächsten unbenutzten.
set -euo pipefail
cd "$(dirname "$0")/.."
theme=$1; word=${2:-auto}; shift; [ $# -gt 0 ] && shift
if [ "$word" = auto ]; then
  word=$(python3 -c "
import json,os,sys;sys.path.insert(0,'merge');from voices import WORDS
u=json.load(open('merge/used.json')) if os.path.exists('merge/used.json') else []
print(next((w for w in WORDS if w not in u), list(WORDS)[len(u)%len(WORDS)]))")
fi
name=$theme-$word
b=build/merge-$name; mkdir -p $b output/merge
python3 -c "import json;t=json.load(open('merge/themes/$theme.json'));t['voice']='assets/merge/$word.wav';t['word']='$word';json.dump(t,open('$b/theme.json','w'))"
# jedes Video eigener Seed-Bereich → nie zweimal dieselbe Physik
n=$(python3 -c "import json,os;print(len(json.load(open('merge/used.json'))) if os.path.exists('merge/used.json') else 0)")
node merge/sim.mjs $b/theme.json $b/sim.json ${@:---search $((n*100+1))-$((n*100+100)) --min 54 --max 66}
python3 -c "import json;d=json.load(open('$b/sim.json'));d['__comp']='MergeSim';json.dump(d,open('$b/props.json','w'))"
(cd remotion && node render.mjs ../$b/props.json ../$b/render.mp4) 2>&1 | grep -v -i "memory\|docker\|calculation" | tail -2
python3 merge/audio.py $b/sim.json $b/audio.wav
ffmpeg -v error -y -i $b/render.mp4 -i $b/audio.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5:LRA=11 -movflags +faststart -shortest output/merge/$name.mp4
ffmpeg -v error -y -ss 0.5 -i output/merge/$name.mp4 -frames:v 1 output/merge/$name.png
python3 -c "
import json,os;p='merge/used.json';u=json.load(open(p)) if os.path.exists(p) else []
u.append('$word') if '$word' not in u else None;json.dump(u,open(p,'w'))"
echo "✓ output/merge/$name.mp4  (Begriff: $word)"
