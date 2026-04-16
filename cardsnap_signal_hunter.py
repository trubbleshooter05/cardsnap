#!/usr/bin/env python3
"""
CardSnap Signal Hunter - Find public web opportunities for sports card grading discussions
No login, no API, no browser automation. Just smart searching and copy generation.
"""

import requests
import re
import json
import datetime
from pathlib import Path
from urllib.parse import urljoin, quote
from bs4 import BeautifulSoup
import os
import sys

# Configuration
SEARCH_QUERIES = [
    'site:reddit.com/r/sportscards "worth grading"',
    'site:reddit.com/r/baseballcards "worth grading"',
    'site:reddit.com/r/basketballcards "worth grading"',
    'site:reddit.com/r/footballcards "worth grading"',
    'site:reddit.com/r/pokemontcg "worth grading"',
    '"sports card grading" facebook group',
    '"baseball card grading" facebook group',
    '"basketball card grading" facebook group',
    '"pokemon grading" facebook group',
    '"PSA grading advice" facebook',
    '"should I grade this card" facebook',
    '"worth grading PSA 10" forum',
]

GRADING_KEYWORDS = [
    'worth grading', 'should grade', 'grade this', 'grading advice',
    'PSA 10', 'PSA 9', 'raw vs graded', 'grading ROI', 'grading cost',
    'grade value', 'grading expensive', 'grading worth', 'condition',
    'BGS', 'SGC', 'Beckett', 'card grade', 'card value', 'investment'
]

VAULT_PATH = Path.home() / 'ObsidianVault'
CARDSNAP_PATH = VAULT_PATH / 'cardsnap'
LOGS_PATH = VAULT_PATH / 'logs'

# Create directories if missing
CARDSNAP_PATH.mkdir(parents=True, exist_ok=True)
LOGS_PATH.mkdir(parents=True, exist_ok=True)


class SignalHunter:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.session.timeout = 10
        self.results = []
        self.seen_urls = set()
        self.run_timestamp = datetime.datetime.now()

    def search_duckduckgo(self, query):
        """Search DuckDuckGo and extract URLs from HTML"""
        urls = []
        try:
            search_url = f"https://duckduckgo.com/html?q={quote(query)}"
            resp = self.session.get(search_url, timeout=10)
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, 'html.parser')

            # Extract URLs from result links
            for link in soup.find_all('a', {'class': 'result__url'}):
                href = link.get('href')
                if href and href.startswith('http'):
                    urls.append(href)

            return urls[:10]  # Limit to top 10 per query
        except requests.RequestException as e:
            print(f"  ⚠ DuckDuckGo search failed: {e}")
            return []

    def search_bing(self, query):
        """Search Bing and extract URLs from HTML"""
        urls = []
        try:
            search_url = f"https://www.bing.com/search?q={quote(query)}"
            resp = self.session.get(search_url, timeout=10)
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, 'html.parser')

            # Extract URLs from result citations
            for item in soup.find_all('li', {'class': 'b_algo'}):
                link = item.find('a')
                if link and link.get('href'):
                    urls.append(link['href'])

            return urls[:10]
        except requests.RequestException as e:
            print(f"  ⚠ Bing search failed: {e}")
            return []

    def search(self, query):
        """Search and return deduplicated URLs"""
        print(f"  🔍 Searching: {query}")

        # Try DuckDuckGo first, fallback to Bing
        urls = self.search_duckduckgo(query)
        if not urls:
            urls = self.search_bing(query)

        # Deduplicate
        new_urls = [u for u in urls if u not in self.seen_urls]
        self.seen_urls.update(urls)

        print(f"     → Found {len(new_urls)} new URLs")
        return new_urls

    def score_url(self, title, snippet):
        """Score a URL by keyword relevance"""
        text = (title + ' ' + snippet).lower()
        score = 0

        for keyword in GRADING_KEYWORDS:
            if keyword.lower() in text:
                score += 1

        return score

    def extract_snippet(self, url):
        """Try to fetch and extract snippet from URL"""
        try:
            resp = self.session.get(url, timeout=8)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')

            # Try to get description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                return meta_desc.get('content', '')[:200]

            # Fall back to first text
            text = ' '.join(soup.stripped_strings)[:200]
            return text
        except:
            return "..."

    def generate_copy(self, title, url, source):
        """Generate 1-2 non-spammy reply/post drafts"""

        if 'reddit' in url.lower():
            options = [
                "I usually compare raw vs 9 vs 10 before sending to a grader. If a 9 doesn't work financially, I usually pass. What's your take on this one?",
                "Built a small calculator myself to avoid guessing on grading ROI. The condition on this looks solid - have you checked comps for the grade?",
            ]
        elif 'facebook' in url.lower():
            options = [
                "Does anyone else calculate the ROI before grading? I've found comparing raw price vs 10 condition usually tells me if it's worth the fee.",
                "This reminds me - for cards like this, I usually compare what a PSA 9 vs 10 would be worth. Helps me decide if it's worth the risk.",
            ]
        else:
            options = [
                "Before sending to a grader, I always look at comparables for different grades. The upside has to justify the fee.",
                "I use a simple calculator for this - raw value vs potential graded value. Helps remove the guesswork.",
            ]

        return options

    def run(self):
        """Execute full signal hunt"""
        print("\n🚀 CardSnap Signal Hunter Starting...\n")
        print(f"📅 Run time: {self.run_timestamp.isoformat()}\n")

        all_urls = set()

        for query in SEARCH_QUERIES:
            urls = self.search(query)
            all_urls.update(urls)

        print(f"\n📊 Total unique URLs found: {len(all_urls)}\n")

        # Score and rank results
        scored_results = []
        for url in list(all_urls)[:50]:  # Limit to top 50 to avoid too much processing
            # Extract source from URL
            if 'reddit' in url:
                source = 'Reddit'
            elif 'facebook' in url:
                source = 'Facebook'
            elif 'forum' in url:
                source = 'Forum'
            else:
                source = 'Web'

            # Extract title (from URL structure)
            title = url.split('/')[-1][:80] if '/' in url else url[:80]

            # Score based on keywords
            score = self.score_url(title, '')

            if score > 0:
                scored_results.append({
                    'url': url,
                    'title': title,
                    'source': source,
                    'score': score,
                })

        # Sort by score
        scored_results.sort(key=lambda x: x['score'], reverse=True)
        self.results = scored_results[:20]  # Top 20

        print(f"✅ Scored and ranked {len(self.results)} high-relevance results\n")

        return self.results

    def generate_report(self):
        """Generate markdown report"""
        now = self.run_timestamp
        timestamp_str = now.strftime('%Y%m%d_%H%M')
        report_path = CARDSNAP_PATH / f'cardsnap_signal_report_{timestamp_str}.md'

        # Build report
        lines = [
            f"# CardSnap Signal Hunt Report",
            f"**Generated:** {now.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Found:** {len(self.results)} high-relevance opportunities",
            "",
            "## Top Opportunities",
            "",
            "| Score | Source | Title | URL |",
            "|-------|--------|-------|-----|",
        ]

        for result in self.results[:10]:
            safe_title = result['title'].replace('|', '\\|')[:60]
            safe_url = result['url'].replace('|', '\\|')[:80]
            lines.append(f"| {result['score']} | {result['source']} | {safe_title} | [{safe_url}]({result['url']}) |")

        lines.extend([
            "",
            "## Detailed Opportunities",
            "",
        ])

        for i, result in enumerate(self.results[:15], 1):
            copy_options = self.generate_copy(result['title'], result['url'], result['source'])

            lines.extend([
                f"### {i}. {result['title'][:80]}",
                f"**URL:** {result['url']}",
                f"**Source:** {result['source']}",
                f"**Relevance Score:** {result['score']}/10",
                f"**Why it matters:** This discussion involves sports card grading ROI decisions - exactly where CardSnap value shines.",
                "",
                "**Suggested Reply Option 1:**",
                f"> {copy_options[0]}",
                "",
                "**Suggested Reply Option 2:**",
                f"> {copy_options[1]}",
                "",
            ])

        lines.extend([
            "## Notes",
            "- All copy suggestions are non-promotional and helpful in tone",
            "- Only share CardSnap after building context and trust",
            "- Suggestions are for manual posting only - do not automate replies",
            "- Respect community rules before posting",
            "",
            f"*Report generated by CardSnap Signal Hunter v1.0*",
        ])

        report_text = '\n'.join(lines)
        report_path.write_text(report_text)

        print(f"📄 Report saved: {report_path}\n")
        return report_path

    def update_automation_log(self, report_path):
        """Add entry to automation_runs.md"""
        log_file = LOGS_PATH / 'automation_runs.md'

        # Ensure file exists
        if not log_file.exists():
            log_file.write_text("# Automation Runs Log\n\n")

        entry = f"- **{self.run_timestamp.strftime('%Y-%m-%d %H:%M')}** — CardSnap Signal Hunter — Found {len(self.results)} opportunities — [[{report_path.name}]]\n"

        content = log_file.read_text()
        # Insert after header
        lines = content.split('\n')
        if len(lines) > 2:
            lines.insert(2, entry)
        else:
            lines.append(entry)

        log_file.write_text('\n'.join(lines))
        print(f"📝 Updated automation log\n")

    def update_opportunity_inbox(self):
        """Update opportunity_inbox.md with new URLs"""
        inbox_file = CARDSNAP_PATH / 'opportunity_inbox.md'

        # Ensure file exists
        if not inbox_file.exists():
            inbox_file.write_text("# Opportunity Inbox\n\nSignal hunting results go here.\n\n")

        # Add new entries
        new_entries = []
        for result in self.results[:5]:
            entry = f"- [ ] [{result['title'][:60]}]({result['url']}) (Score: {result['score']}, {result['source']})\n"
            new_entries.append(entry)

        if new_entries:
            content = inbox_file.read_text()
            lines = content.split('\n')

            # Find insertion point (after header)
            insert_idx = 2
            for i, line in enumerate(lines):
                if line.startswith('- [ ]'):
                    insert_idx = i
                    break

            for entry in reversed(new_entries):
                lines.insert(insert_idx, entry)

            inbox_file.write_text('\n'.join(lines))
            print(f"📬 Updated opportunity inbox\n")

    def send_telegram(self):
        """Send summary to Telegram if configured"""
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID')

        if not (bot_token and chat_id):
            print("⏭️  Telegram not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing)\n")
            return

        try:
            message = f"🚀 **CardSnap Signal Hunt Complete**\n\n"
            message += f"Found {len(self.results)} high-relevance opportunities\n\n"
            message += "**Top 5 Results:**\n\n"

            for i, result in enumerate(self.results[:5], 1):
                message += f"{i}. [{result['title'][:50]}]({result['url']})\n"
                message += f"   Score: {result['score']}/10 | {result['source']}\n\n"

            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'Markdown',
                'disable_web_page_preview': True,
            }

            resp = requests.post(url, json=payload, timeout=10)
            resp.raise_for_status()
            print(f"✉️  Telegram message sent\n")
        except Exception as e:
            print(f"⚠️  Telegram send failed: {e}\n")


def main():
    try:
        hunter = SignalHunter()
        hunter.run()

        if not hunter.results:
            print("❌ No results found\n")
            sys.exit(1)

        report_path = hunter.generate_report()
        hunter.update_automation_log(report_path)
        hunter.update_opportunity_inbox()
        hunter.send_telegram()

        print(f"✨ Signal hunt complete - {len(hunter.results)} results\n")

    except KeyboardInterrupt:
        print("\n⏸️  Interrupted by user\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        sys.exit(1)


if __name__ == '__main__':
    main()
