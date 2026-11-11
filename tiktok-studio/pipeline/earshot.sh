#!/usr/bin/env bash
# Earshot (github.com/Leonxlnx/earshot) – „Ohren“ für die Videos: Ton beschreiben, bewerten, mit Bild abgleichen.
#   bash pipeline/earshot.sh critique output/videos/<id>.mp4     # Scorecard + konkrete Fixes
#   bash pipeline/earshot.sh timeline <video>                    # Was passiert wann im Ton
#   bash pipeline/earshot.sh describe <audio>                    # Wie klingt ein Sound
#   bash pipeline/earshot.sh setup                               # einmalig installieren (neue Session)
# Braucht im Netzwerk: huggingface.co, us.aws.cdn.hf.co, download.pytorch.org, download-r2.pytorch.org
set -euo pipefail
ENV=/opt/earshot-env; SRC=/opt/earshot-src
export EARSHOT_HOME=/opt/earshot-cache HF_HUB_DISABLE_XET=1
if [ "${1:-}" = setup ]; then
  [ -d $SRC ] || git clone -q --depth 1 https://github.com/Leonxlnx/earshot.git $SRC
  [ -x $ENV/bin/python ] || python3 -m venv $ENV
  $ENV/bin/pip install -q --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
  $ENV/bin/pip install -q --no-cache-dir -e $SRC
  $ENV/bin/earshot doctor --fetch | grep -E "^fetched|^problems"
  exit 0
fi
[ -x $ENV/bin/earshot ] || { echo "Earshot fehlt – erst: bash pipeline/earshot.sh setup"; exit 1; }
HF_HUB_OFFLINE=1 exec $ENV/bin/earshot "$@"
