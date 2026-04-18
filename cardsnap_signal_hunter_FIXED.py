#!/usr/bin/env python3
"""
CardSnap Signal Hunter — FIXED VERSION
Sends direct opportunity links instead of just report location
"""

import os
import re
import json
from datetime import datetime
from urllib.parse import quote

# ... [keep all existing imports and helper functions from original script] ...

class CardSnapSignalHunter:
    """Discovers sports card grading opportunities with direct links."""

    def __init__(self):
        self.results = []
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "8549956853")
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "8540425825:AAFQVtm8GF1VkWQ3dwOtPP_plKrsuiymVsM")

    # ... [keep existing search and ranking logic] ...

    def send_telegram(self):
        """
        FIXED: Send direct opportunity links instead of just report location

        Format:
        🎯 CardSnap Signal Hunter — 20 Opportunities Found

        Top Opportunities:
        🔗 [1] Baseball Card PSA Grade 10 Discussion — https://reddit.com/r/sportscard/...
        🔗 [2] Grading Cost Comparison Thread — https://forums.psacard.com/...

        📊 Stats: 62 recent-dated, 8 new niches
        """
        if not self.results:
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        report_path = f"~/ObsidianVault/cardsnap/cardsnap_signal_report_{timestamp}.md"

        # Extract top opportunities with direct links
        top_opportunities = self.results[:10] if len(self.results) >= 10 else self.results

        # Build message with DIRECT LINKS to opportunities
        msg = f"🎯 CardSnap Signal Hunter — {len(self.results)} Opportunities Found\n\n"
        msg += "Top Opportunities:\n"

        for idx, opp in enumerate(top_opportunities, 1):
            # FIXED: Extract the actual opportunity URL from the result
            title = opp.get('title', 'Untitled')
            url = opp.get('url', '')  # Direct link to the opportunity
            source = opp.get('source', 'Unknown')  # Reddit, forum, Facebook, etc.

            if url:
                msg += f"🔗 [{idx}] {title} — {source}\n   {url}\n"
            else:
                msg += f"🔗 [{idx}] {title} — {source}\n"

        # Add summary stats
        recent_count = len([r for r in self.results if r.get('is_recent')])
        new_niches = len(set(r.get('niche') for r in self.results))

        msg += f"\n📊 Stats: {recent_count} recent-dated, {new_niches} unique niches\n"
        msg += f"🔗 Full Report: {report_path}\n"

        # Send to Telegram
        self._post_telegram(msg)

    def _post_telegram(self, message):
        """Post message to Telegram."""
        import requests
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            data = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            requests.post(url, data=data, timeout=10)
        except Exception as e:
            print(f"Telegram send failed: {e}")


if __name__ == "__main__":
    hunter = CardSnapSignalHunter()
    hunter.run()
    hunter.send_telegram()
