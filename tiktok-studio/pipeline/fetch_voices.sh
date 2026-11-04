#!/usr/bin/env bash
# Lädt die deutschen Piper-Stimmen (nicht im Git, ~60 MB pro Stimme).
# Erzähler: Thorsten (CC0) · Zitat-Stimme: Ramona (M-AILABS-Datensatz)
set -euo pipefail
cd "$(dirname "$0")/../assets/voices"
for v in de-thorsten-low de-ramona-low; do
  [ -f "$v.onnx" ] && continue
  curl -sSL -o "/tmp/$v.tar.gz" "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-$v.tar.gz"
  tar xzf "/tmp/$v.tar.gz" "$v.onnx" "$v.onnx.json"
  rm "/tmp/$v.tar.gz"
done
ls -la
