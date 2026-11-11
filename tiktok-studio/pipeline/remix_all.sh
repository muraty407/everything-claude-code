#!/usr/bin/env bash
# Ton aller kommenden Videos neu mischen, mit Earshot prüfen, blockweise pushen.
set -uo pipefail
cd "$(dirname "$0")/.."
REP=build/earshot_report.txt; : > $REP
for job in "content/schedule.json 13-20" "content/pov3d.json 1-3" "content/bonus.json 3-8" "content/schedule.json 21-32" "content/bonus.json 9-16" "content/schedule.json 33-46" "content/bonus.json 17-27" "content/schedule.json 47-60"; do
  set -- $job
  python3 pipeline/remix.py "$1" "$2" 2>&1 | grep -E "✓|übersprungen|Error|Traceback" | while read -r line; do
    echo "$line"
    id=$(echo "$line" | awk '{print $NF}')
    [ -f output/videos/$id.mp4 ] && echo "$id: $(bash pipeline/earshot.sh critique output/videos/$id.mp4 2>&1 | grep -m1 VERDICT)" >> $REP
  done
  cd .. && git add tiktok-studio/output/videos && git commit -qm "Neuer Ton (Stereo-Musik + Effekte): $1 $2

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0132bTE2M3jVWVFSo1s7Z6AE"
  for i in 1 2 3 4; do git pull -q --rebase --autostash origin claude/tiktok-video-editor-30days-25xb1d && git push -q -u origin claude/tiktok-video-editor-30days-25xb1d && break; sleep 8; done
  cd tiktok-studio
done
