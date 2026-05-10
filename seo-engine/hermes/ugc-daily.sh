#!/bin/zsh
# ─────────────────────────────────────────────────────────────────────────────
# CardSnap UGC Daily Job — Hermes runner
# Generates 3 UGC videos (funny/angry/urgent) with fresh Claude scripts + TTS
# Schedule: daily at 7:00 AM
#
# Register with Hermes:
#   hermes skills add --name cardsnap-ugc-daily --script ~/projects/cardsnap/seo-engine/hermes/ugc-daily.sh
#   hermes cron add "0 7 * * *" cardsnap-ugc-daily
#
# Manual run:
#   zsh ~/projects/cardsnap/seo-engine/hermes/ugc-daily.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

CARDSNAP_DIR="${CARDSNAP_DIR:-$HOME/projects/cardsnap}"
LOG_DIR="${CARDSNAP_DIR}/logs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DATE="$(date +%Y-%m-%d)"
LOG_FILE="${LOG_DIR}/ugc-daily-${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "[$(date)] === CardSnap UGC Daily Start ==="

# ── Lock file ─────────────────────────────────────────────────────────────────
LOCK="${CARDSNAP_DIR}/.ugc-daily.lock"
if ! mkdir "${LOCK}" 2>/dev/null; then
  echo "Another UGC daily run is active. Exiting."
  exit 0
fi
trap 'rmdir "${LOCK}" 2>/dev/null || true' EXIT

cd "${CARDSNAP_DIR}"

# ── Load env ──────────────────────────────────────────────────────────────────
if [[ -f ".env.local" ]]; then
  set -o allexport
  source .env.local
  set +o allexport
fi

# ── Run UGC pipeline ──────────────────────────────────────────────────────────
echo "[$(date)] Running ugc:daily..."
npm run ugc:daily -- --date="${DATE}"

# ── Summary to stdout (Hermes routes to Telegram via deliver:telegram) ────────
VIDEO_COUNT=$(ls -1 "${CARDSNAP_DIR}/out/cardsnap-ugc-"*"-${DATE}.mp4" 2>/dev/null | wc -l | tr -d ' ')
echo "=== CardSnap UGC Daily Done ==="
echo "Date: ${DATE}"
echo "Videos rendered: ${VIDEO_COUNT}/3"
echo "Copy pack: docs/growth/ugc-daily-pack-${DATE}.md"
echo "Videos: out/cardsnap-ugc-{funny,angry,urgent}-${DATE}.mp4"
echo "Log: ${LOG_FILE}"
