#!/usr/bin/env bash
# reproduce.sh — Brand-code spec verification + summary
#
# Validates brand.json is well-formed JSON, lists the eight spectral
# dimensions and palette, and logs the run to output/logs/master_run.log.
# Conforms to PUBLIC_MIRROR_STANDARD.md v1.0.0.
#
# Usage:
#   ./reproduce.sh                  # Validate spec + emit summary
#   ./reproduce.sh --check-only     # Dependency check only

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

mkdir -p output/figures output/tables output/logs
LOG_FILE="output/logs/master_run.log"

echo "==================================================" | tee -a "$LOG_FILE"
echo "Pipeline run: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
echo "Repo: $REPO_ROOT" | tee -a "$LOG_FILE"
echo "Git SHA: $(git rev-parse HEAD 2>/dev/null || echo 'not-a-repo')" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"

CHECK_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --check-only) CHECK_ONLY=1 ;;
    *) echo "Unknown flag: $arg"; exit 2 ;;
  esac
done

# 1. Dependency check
echo ">>> Checking dependencies..." | tee -a "$LOG_FILE"
HAVE_JQ=0
if command -v jq >/dev/null 2>&1; then
  HAVE_JQ=1
  echo "jq: $(jq --version)" | tee -a "$LOG_FILE"
else
  echo "jq: not found (optional; spec summary will be reduced)" | tee -a "$LOG_FILE"
fi

if [[ "$CHECK_ONLY" == "1" ]]; then
  echo ">>> Check-only mode; exiting before validation." | tee -a "$LOG_FILE"
  exit 0
fi

# 2. Validate brand.json
echo ">>> Validating brand.json..." | tee -a "$LOG_FILE"
if [[ ! -f brand.json ]]; then
  echo "ERROR: brand.json missing at repo root" | tee -a "$LOG_FILE"
  exit 1
fi

if [[ "$HAVE_JQ" == "1" ]]; then
  if ! jq empty brand.json 2>>"$LOG_FILE"; then
    echo "ERROR: brand.json is not valid JSON" | tee -a "$LOG_FILE"
    exit 1
  fi
  echo "brand.json: valid JSON" | tee -a "$LOG_FILE"

  echo ">>> Spec summary:" | tee -a "$LOG_FILE"
  jq -r '
    "name: \(.name // "n/a")",
    "version: \(.version // "n/a")",
    "dimensions: \(.dimensions // [] | length)",
    "palette entries: \(.palette // {} | length)"
  ' brand.json 2>/dev/null | tee -a "$LOG_FILE" || true
else
  python3 -c "import json,sys; json.load(open('brand.json')); print('brand.json: valid JSON')" \
    2>&1 | tee -a "$LOG_FILE"
fi

# 3. Emit spec snapshot to output/tables/
cp brand.json output/tables/brand_spec_snapshot.json
echo ">>> Snapshot written: output/tables/brand_spec_snapshot.json" | tee -a "$LOG_FILE"

echo "==================================================" | tee -a "$LOG_FILE"
echo "Pipeline complete: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"
