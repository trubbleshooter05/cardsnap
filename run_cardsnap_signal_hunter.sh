#!/bin/zsh

LOGFILE="$HOME/ObsidianVault/hermes_system/logs/cardsnap_signal_hunter.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

log "RUN START"

cd ~/projects/cardsnap
if [ $? -ne 0 ]; then
  log "ERROR: Could not change to ~/projects/cardsnap"
  exit 1
else
  log "SUCCESS: Changed to ~/projects/cardsnap"
fi

log "START: Running cardsnap_signal_hunter_DATASEO.py"
python3 cardsnap_signal_hunter_DATASEO.py >> "$LOGFILE" 2>&1
STATUS=$?

if [ $STATUS -eq 0 ]; then
  log "SUCCESS: cardsnap_signal_hunter_DATASEO.py finished"
else
  log "ERROR: cardsnap_signal_hunter_DATASEO.py failed with code $STATUS"
fi

log "RUN COMPLETE"
exit 0
