#!/bin/zsh
# ─────────────────────────────────────────────────────────────────────────────
# CardSnap UGC Daily Job — Hermes runner
# Generates 3 UGC videos (almost-overpaid / psa9-destroyer / mistake-avoided) via Remotion + TTS
# Schedule: daily at 7:30 AM
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
touch "${LOG_FILE}"
printf '[%s] === CardSnap UGC Daily Start ===\n' "$(date)" >> "${LOG_FILE}"

# ── Lock file ─────────────────────────────────────────────────────────────────
LOCK="${CARDSNAP_DIR}/.ugc-daily.lock"
if ! mkdir "${LOCK}" 2>/dev/null; then
  echo "CardSnap UGC approval pack skipped for ${DATE} | reason=lock_active | log=${LOG_FILE}"
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
printf '[%s] Running ugc:daily...\n' "$(date)" >> "${LOG_FILE}"
set +e
RUN_OUTPUT="$(npm run ugc:daily -- --date="${DATE}" 2>&1)"
RUN_STATUS=$?
set -e

printf '%s\n' "${RUN_OUTPUT}" >> "${LOG_FILE}"
SUMMARY_LINE="$(printf '%s\n' "${RUN_OUTPUT}" | tail -n 1)"

if [[ -z "${SUMMARY_LINE}" ]]; then
  SUMMARY_LINE="CardSnap UGC approval pack failed for ${DATE} | error=no stdout summary emitted | log=${LOG_FILE}"
fi

echo "${SUMMARY_LINE}"
exit "${RUN_STATUS}"
