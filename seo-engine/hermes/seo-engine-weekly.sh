#!/bin/zsh
# ─────────────────────────────────────────────────────────────────────────────
# SEO Engine Weekly Job — Hermes runner
# Runs: FursBliss generator + CardSnap card-entry generator + social drafts
# Schedule: Sunday at 9:00 AM local time
#
# Add to Hermes with:
#   hermes skill add seo-engine-weekly
#   hermes cron add "0 9 * * 0" seo-engine-weekly
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

SEO_ENGINE_DIR="${SEO_ENGINE_DIR:-$HOME/projects/seo-engine}"
LOG_DIR="${SEO_ENGINE_DIR}/logs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${LOG_DIR}/seo-weekly-${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "[$(date)] === SEO Engine Weekly Start ==="

LOCK="${SEO_ENGINE_DIR}/.seo-weekly.lock"
if ! mkdir "${LOCK}" 2>/dev/null; then
  echo "Another SEO weekly run is active. Exiting."
  exit 0
fi
trap 'rmdir "${LOCK}" 2>/dev/null || true' EXIT

cd "${SEO_ENGINE_DIR}"

# ── 1. FursBliss — Breed pages (no medical review required) ──────────────────
echo ""
echo "[$(date)] Step 1: FursBliss Breed Generator"
npx tsx generators/fursbliss-generator.ts --type breed --max 3 || echo "FursBliss breed generator failed — continuing"

# ── 2. FursBliss — Supplement pages ──────────────────────────────────────────
echo ""
echo "[$(date)] Step 2: FursBliss Supplement Generator"
npx tsx generators/fursbliss-generator.ts --type supplement --max 2 || echo "FursBliss supplement generator failed — continuing"

# ── 3. FursBliss — Glossary pages ────────────────────────────────────────────
echo ""
echo "[$(date)] Step 3: FursBliss Glossary Generator"
npx tsx generators/fursbliss-generator.ts --type glossary --max 2 || echo "FursBliss glossary generator failed — continuing"

# ── 4. NOTE: FursBliss Symptom pages are NOT auto-generated ──────────────────
# Symptom content requires manual creation + safety-check + vet review.
# To generate: npx tsx generators/fursbliss-generator.ts --type symptom --max 1
# Then: npx tsx reviewers/safety-check.ts --file outputs/fursbliss/fursbliss-symptom-*.json
echo ""
echo "[$(date)] Step 4: Symptom pages — SKIPPED (manual review required)"

# ── 5. CardSnap Card Entry Generator ─────────────────────────────────────────
echo ""
echo "[$(date)] Step 5: CardSnap Card Entry Generator"
npx tsx generators/cardsnap-generator.ts --mode card-entry --max 5 || echo "CardSnap card entry generator failed — continuing"

# ── 6. FursBliss Safety Check ────────────────────────────────────────────────
echo ""
echo "[$(date)] Step 6: Safety check on FursBliss outputs"
LATEST_FURSBLISS=$(ls -t outputs/fursbliss/*.json 2>/dev/null | head -1)
if [[ -n "${LATEST_FURSBLISS}" ]]; then
  npx tsx reviewers/safety-check.ts --file "${LATEST_FURSBLISS}" || echo "Safety check flagged issues — review before publishing"
fi

# ── 7. Validate all outputs ───────────────────────────────────────────────────
echo ""
echo "[$(date)] Step 7: Validate all outputs"
npx tsx reviewers/validate.ts || echo "Validation found issues"

# ── 8. Summary notification ───────────────────────────────────────────────────
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
  MSG="✅ SEO Engine Weekly complete. FursBliss + CardSnap cards generated. Review outputs before publishing — medical content requires vet check."
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${MSG}" > /dev/null || true
fi

echo ""
echo "[$(date)] === SEO Engine Weekly Done ==="
