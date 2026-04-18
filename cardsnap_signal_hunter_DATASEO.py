#!/usr/bin/env python3
"""
CardSnap Signal Hunter — DataForSEO Version
Searches for Reddit/Facebook posts about card grading using web search
Sends direct post links + excerpts
"""

import os
import requests
import json
import base64
from datetime import datetime, timedelta
from urllib.parse import quote
from dotenv import load_dotenv

# Load .env from ~/.hermes
load_dotenv(os.path.expanduser("~/.hermes/.env"))

class CardSnapSignalHunter:
    """Find card grading discussions using web search."""

    def __init__(self):
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "8549956853")
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "8540425825:AAFQVtm8GF1VkWQ3dwOtPP_plKrsuiymVsM")

        # DataForSEO credentials (base64 encoded)
        auth_b64 = os.getenv("DATAFORSEO_AUTH", "c3VwcG9ydEBmdXJzYmxpc3MuY29tOjMzZjA4ZDRjN2FmZjlkMzM=")

        try:
            auth_decoded = base64.b64decode(auth_b64).decode('utf-8')
            parts = auth_decoded.split(":")
            self.auth = (parts[0], parts[1]) if len(parts) == 2 else None
        except Exception as e:
            print(f"Error decoding DATAFORSEO_AUTH: {e}")
            self.auth = None

        self.posts = []

    def search_posts(self):
        """Search for Reddit/Facebook posts about card grading, filtered to recent."""
        queries = [
            "site:reddit.com/r/sportscard grading",
            "site:reddit.com/r/baseballcards grading",
            "site:reddit.com card grading psa",
            "site:facebook.com card grading discussion",
            "site:reddit.com should i grade card",
        ]

        posts = []

        for query in queries:
            try:
                url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
                payload = {
                    "language_code": "en",
                    "location_name": "United States",
                    "keyword": query,
                    "device": "desktop",
                    "limit": 10
                }
                headers = {"content-type": "application/json"}
                response = requests.post(
                    url,
                    json=[payload],
                    headers=headers,
                    auth=self.auth,
                    timeout=30
                )

                if response.status_code != 200:
                    print(f"DataForSEO failed for '{query}': {response.status_code}")
                    continue

                data = response.json()
                print(f"Status: {data.get('status_message')}")

                if not data.get('tasks'):
                    continue

                result_obj = data['tasks'][0].get('result', [])
                if not result_obj:
                    continue

                items = result_obj[0].get('items', []) if result_obj else []

                for item in items:
                    if item.get('type') == 'organic':
                        title = item.get('title', '')
                        url = item.get('url', '')
                        snippet = item.get('description', '')

                        if 'reddit.com/r/' in url and '/comments/' in url:
                            posts.append({
                                'title': title,
                                'body': snippet,
                                'url': url,
                                'source': 'Reddit',
                                'created': datetime.now().timestamp()
                            })
                        elif 'facebook.com' in url and ('/posts/' in url or '/groups/' in url):
                            posts.append({
                                'title': title,
                                'body': snippet,
                                'url': url,
                                'source': 'Facebook',
                                'created': datetime.now().timestamp()
                            })

            except Exception as e:
                print(f"Search failed for '{query}': {e}")

        unique_posts = {}
        for post in posts:
            if post['url'] not in unique_posts:
                unique_posts[post['url']] = post

        return list(unique_posts.values())

    def send_telegram(self):
        """Send posts with links and copy."""
        if not self.posts:
            msg = "🎯 CardSnap Signal Hunter — No new posts found"
            self._post_telegram(msg)
            return

        timestamp = datetime.now().strftime("%H:%M")
        msg = f"🎯 CardSnap Signal Hunter — {len(self.posts)} Posts Found\n\n"

        for idx, post in enumerate(self.posts[:10], 1):
            title = post.get('title', '')[:80]
            body = post.get('body', '')[:150]
            url = post.get('url', '')
            source = post.get('source', '')

            msg += f"🔗 [{idx}] {title}\n"
            if body:
                msg += f"    \"{body}...\"\n"
            msg += f"    {source}\n"
            msg += f"    {url}\n\n"

        msg += f"📊 Total: {len(self.posts)} posts | Click links to reply\n"

        self._post_telegram(msg)

    def run(self):
        """Main execution."""
        print("Searching for card grading posts...")
        self.posts = self.search_posts()
        print(f"Found {len(self.posts)} posts")

        # Log to Obsidian
        if self.posts:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M")
            report_path = os.path.expanduser(f"~/ObsidianVault/cardsnap/cardsnap_posts_{timestamp}.md")

            os.makedirs(os.path.dirname(report_path), exist_ok=True)
            with open(report_path, 'w') as f:
                f.write(f"# CardSnap Posts — {timestamp}\n\n")
                for post in self.posts:
                    f.write(f"## {post.get('title', '')}\n")
                    f.write(f"**Source:** {post.get('source', '')}\n")
                    f.write(f"**Copy:** {post.get('body', '')}\n")
                    f.write(f"**Link:** {post.get('url', '')}\n\n")

        self.send_telegram()

    def _post_telegram(self, message):
        """Post to Telegram."""
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            data = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            print(f"Sending to Telegram... (chat_id={self.chat_id}, msg length={len(message)})")
            response = requests.post(url, data=data, timeout=10)
            print(f"Telegram response: {response.status_code}")
            if response.status_code != 200:
                print(f"Telegram error: {response.text}")
        except Exception as e:
            print(f"Telegram send failed: {e}")


if __name__ == "__main__":
    hunter = CardSnapSignalHunter()
    hunter.run()
