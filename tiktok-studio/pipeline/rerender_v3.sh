#!/usr/bin/env bash
# Rendert die kommenden Videos mit v3-Einstieg neu (Stimme aus dem Cache = keine ElevenLabs-Kosten) und pusht nach jedem Block.
#   bash pipeline/rerender_v3.sh "<quelle> <tage>" ...   z. B. "content/schedule.json 11-14"
set -uo pipefail
cd "$(dirname "$0")/.."
for job in "$@"; do
  set -- $job
  python3 pipeline/make_all.py --source "$1" --days "$2" --force 2>&1 | grep -E "✓|Error|Traceback"
  cd .. && git add tiktok-studio/output/videos tiktok-studio/content && git commit -qm "v3-Einstieg: $1 $2 neu gerendert

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0132bTE2M3jVWVFSo1s7Z6AE"
  for i in 1 2 3 4; do git pull -q --rebase origin claude/tiktok-video-editor-30days-25xb1d && git push -q -u origin claude/tiktok-video-editor-30days-25xb1d && break; sleep 8; done
  cd tiktok-studio
done
