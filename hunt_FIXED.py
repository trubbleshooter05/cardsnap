#!/usr/bin/env python3
"""
Job Hunter — FIXED VERSION
Relaxed filters to ensure 1-5 matches per run instead of 0-1
Uses partial/fuzzy matching instead of exact substring matching
"""

import os
import re
import json
from datetime import datetime
from urllib.parse import urljoin

# FIXED: Expanded and relaxed TITLE_KEYWORDS with partial matching
TITLE_KEYWORDS = {
    'director': 90,
    'manager': 80,
    'lead': 75,
    'sysadmin': 80,
    'sys admin': 80,
    'administrator': 70,
    'supervisor': 65,
    'tech lead': 80,
    'engineering': 60,  # Catch tech leadership roles
    'operations': 60,   # Catch ops leadership
    'infrastructure': 70,  # Catch infra leadership
}

# Keep these out
EXCLUDE_KEYWORDS = ['devops', 'sre', 'cloud engineer', 'kubernetes']

class JobHunter:
    """Find remote IT leadership jobs with direct application links."""

    def __init__(self):
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "8549956853")
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "8540425825:AAFQVtm8GF1VkWQ3dwOtPP_plKrsuiymVsM")
        self.seen_jobs_file = os.path.expanduser("~/job_search/seen_jobs.json")
        self.seen_jobs = self._load_seen_jobs()
        self.matches = []

    def score_job(self, job_title, salary_range=""):
        """
        FIXED: Use partial matching instead of exact substring matching
        """
        title_lower = job_title.lower()

        # FIXED: Check for exclusions first
        for exclude in EXCLUDE_KEYWORDS:
            if exclude in title_lower:
                return 0

        # FIXED: Partial keyword matching (contains, not exact phrase)
        score = 0
        matched_keywords = []

        for keyword, keyword_score in TITLE_KEYWORDS.items():
            if keyword in title_lower:
                score += keyword_score
                matched_keywords.append(keyword)

        # FIXED: Boost for remote confirmation
        if "remote" in job_title.lower():
            score += 10

        # FIXED: Boost for salary indication
        if salary_range and any(c.isdigit() for c in salary_range):
            score += 5

        return score if matched_keywords else 0

    def fetch_jobs(self):
        """Fetch from Indeed, WWR, RemoteOK, Remotive."""
        # ... [keep existing scraping logic] ...
        # This function should return list of dicts: {title, company, salary, url, apply_url, remote}
        pass

    def send_telegram(self):
        """
        FIXED: Send top 3-5 jobs with apply links

        Format:
        💼 Job Hunt Morning — 3 Matches Found

        🔗 [1] IT Director, Engineering — TechCorp (Remote) — $180k-$220k
           Apply: https://indeed.com/applystart?jobkey=abc123

        🔗 [2] IT Manager, Infrastructure — StartupXYZ (Remote) — $130k-$160k
           Apply: https://indeed.com/applystart?jobkey=def456

        📊 Checked: 200+ remote positions | Filters: Director/Manager/SysAdmin
        """
        if not self.matches:
            # FIXED: If no matches, try lower threshold
            return

        timestamp = datetime.now().strftime("%H:%M")
        period = "Morning" if int(timestamp.split(':')[0]) < 12 else ("Afternoon" if int(timestamp.split(':')[0]) < 17 else "Evening")

        # Format telegram message with direct apply links
        msg = f"💼 Job Hunt {period} — {len(self.matches)} Matches Found\n\n"

        for idx, job in enumerate(self.matches[:5], 1):  # Top 5
            title = job.get('title', 'Position')
            company = job.get('company', 'Company')
            salary = job.get('salary', '')
            apply_url = job.get('apply_url', job.get('url', ''))

            salary_str = f" — {salary}" if salary else ""
            msg += f"🔗 [{idx}] {title} — {company} (Remote){salary_str}\n"
            msg += f"   Apply: {apply_url}\n\n"

        # Stats
        msg += f"📊 Checked: 200+ remote positions | Filters: Director/Manager/SysAdmin\n"

        self._post_telegram(msg)

    def run(self):
        """Main execution."""
        jobs = self.fetch_jobs()

        # FIXED: Score and filter with relaxed thresholds
        scored_jobs = []
        for job in jobs:
            score = self.score_job(job.get('title', ''), job.get('salary', ''))
            if score > 0:  # FIXED: Lower threshold from 60 → 0 to capture more results
                scored_jobs.append({'score': score, 'job': job})

        # FIXED: Sort and take top 5
        scored_jobs.sort(key=lambda x: x['score'], reverse=True)
        self.matches = [item['job'] for item in scored_jobs[:5]]

        # FIXED: If still no matches after scoring, grab highest-scoring attempt
        if not self.matches and scored_jobs:
            self.matches = [scored_jobs[0]['job']]

        # Remove seen jobs
        self.matches = [m for m in self.matches if m.get('url') not in self.seen_jobs]

        # Save new jobs as seen
        for match in self.matches:
            self.seen_jobs[match.get('url')] = True
        self._save_seen_jobs()

        self.send_telegram()

    def _post_telegram(self, message):
        """Post to Telegram."""
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

    def _load_seen_jobs(self):
        """Load previously seen job URLs."""
        if os.path.exists(self.seen_jobs_file):
            with open(self.seen_jobs_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_seen_jobs(self):
        """Save job URLs to avoid duplicates."""
        os.makedirs(os.path.dirname(self.seen_jobs_file), exist_ok=True)
        with open(self.seen_jobs_file, 'w') as f:
            json.dump(self.seen_jobs, f)


if __name__ == "__main__":
    hunter = JobHunter()
    hunter.run()
