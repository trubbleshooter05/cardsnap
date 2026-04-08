#!/bin/zsh
# ─────────────────────────────────────────────────────────────────────────────
# SEO Engine Daily Job — Hermes runner
# Runs: opportunity discovery + SnapBrand + CardSnap generation
# Schedule: daily at 8:00 AM local time
#
# Add to Hermes with:
#   hermes skill add seo-engine-daily
#   hermes cron add "0 8 * * *" seo-engine-daily
#
# Manual run:
#   zsh ~/projects/seo-engine/hermes/seo-engine-daily.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

SEO_ENGINE_DIR="${SEO_ENGINE_DIR:-$HOME/projects/seo-engine}"
LOG_DIR="${SEO_ENGINE_DIR}/logs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${LOG_DIR}/seo-daily-${TIMESTAMP}.log"
MAX_NEW_SNAPBRAND="${MAX_NEW_SNAPBRAND:-5}"
MAX_NEW_CARDSNAP="${MAX_NEW_CARDSNAP:-3}"

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "[$(date)] === SEO Engine Daily Start ==="
echo "SEO_ENGINE_DIR: ${SEO_ENGINE_DIR}"

# ── Lock file ─────────────────────────────────────────────────────────────────
LOCK="${SEO_ENGINE_DIR}/.seo-daily.lock"
if ! mkdir "${LOCK}" 2>/dev/null; then
  echo "Another SEO daily run is active. Exiting."
  exit 0
fi
trap 'rmdir "${LOCK}" 2>/dev/null || true' EXIT

cd "${SEO_ENGINE_DIR}"

# ── 1. Opportunity Discovery ──────────────────────────────────────────────────
echo ""
echo "[$(date)] Step 1: Opportunity Discovery"
npx tsx generators/opportunity-discovery.ts || echo "Discovery failed — continuing"

# ── 2. SnapBrand Generator ────────────────────────────────────────────────────
echo ""
echo "[$(date)] Step 2: SnapBrand Generator (max ${MAX_NEW_SNAPBRAND})"
npx tsx generators/snapbrand-generator.ts --max "${MAX_NEW_SNAPBRAND}" || echo "SnapBrand generator failed — continuing"

# ── 3. CardSnap Grade-or-Skip Generator ──────────────────────────────────────
echo ""
echo "[$(date)] Step 3: CardSnap Grade-or-Skip Generator (max ${MAX_NEW_CARDSNAP})"
npx tsx generators/cardsnap-generator.ts --mode grade-or-skip --max "${MAX_NEW_CARDSNAP}" || echo "CardSnap generator failed — continuing"

# ── 4. Validate All New Outputs ───────────────────────────────────────────────
echo ""
echo "[$(date)] Step 4: Validating outputs"
npx tsx reviewers/validate.ts || echo "Validation found issues — check outputs before merging"

# ── 5. Telegram notification ──────────────────────────────────────────────────
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
  NEW_FILES=$(ls -1 outputs/snapbrand/ outputs/cardsnap/ 2>/dev/null | wc -l | tr -d ' ')
  MSG="✅ SEO Engine Daily complete. New output files: ${NEW_FILES}. Review at: ${SEO_ENGINE_DIR}/outputs/"
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${MSG}" > /dev/null || true
fi

echo ""
echo "[$(date)] === SEO Engine Daily Done ==="
echo "Log: ${LOG_FILE}"
echo "Review outputs: ${SEO_ENGINE_DIR}/outputs/"
