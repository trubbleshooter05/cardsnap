#!/usr/bin/env python3
"""
CardSnap Signal Hunter — CORRECT VERSION
Finds Reddit/Facebook posts about card grading
Sends direct links to posts so user can reply
"""

import os
import requests
from datetime import datetime
from dotenv import load_dotenv

# Load .env from ~/.hermes (.env() handles missing file gracefully)
load_dotenv(os.path.expanduser("~/.hermes/.env"), override=False)

class CardSnapSignalHunter:
    """Find card grading discussions on Reddit and Facebook groups."""

    def __init__(self):
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "8549956853")
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "8540425825:AAFQVtm8GF1VkWQ3dwOtPP_plKrsuiymVsM")
        self.posts = []

    def scrape_reddit(self):
        """Find card grading posts on Reddit."""
        subreddits = ['sportscard', 'baseballcards', 'PokemonCard']
        keywords = ['grading', 'psa', 'beckett', 'cgc', 'grade', 'submit', 'card']
        posts = []

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        for subreddit in subreddits:
            try:
                url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=50"
                response = requests.get(url, headers=headers, timeout=15)

                # Check if blocked
                if response.status_code != 200:
                    print(f"Reddit blocked r/{subreddit}: {response.status_code}")
                    continue

                data = response.json()

                for post in data.get('data', {}).get('children', []):
                    post_data = post.get('data', {})
                    title = post_data.get('title', '')
                    title_lower = title.lower()

                    # Only posts about grading
                    if any(kw in title_lower for kw in keywords):
                        body = post_data.get('selftext', '')
                        body_excerpt = body[:250] if body else ""

                        posts.append({
                            'title': title,
                            'body': body_excerpt,
                            'subreddit': subreddit,
                            'url': f"https://reddit.com{post_data.get('permalink', '')}",
                            'score': post_data.get('score', 0),
                            'created': post_data.get('created_utc', 0),
                            'source': 'Reddit'
                        })
            except Exception as e:
                print(f"Reddit scrape failed for r/{subreddit}: {e}")
                continue

        return posts

    def scrape_facebook_groups(self):
        """
        Find card grading posts in Facebook groups.
        NOTE: Requires authenticated FB API or web scraping with login.
        For now, returns placeholder - user should configure FB API access.
        """
        # Facebook API requires valid token and group IDs
        # Example group IDs: Sports Card Collectors, Pokemon Card Collectors, etc.

        facebook_groups = [
            # Format: (group_id, group_name)
            # Add your group IDs here
        ]

        posts = []
        fb_token = os.getenv("FACEBOOK_TOKEN", "")

        if not fb_token:
            print("WARNING: FACEBOOK_TOKEN not set. Skipping FB groups.")
            return posts

        for group_id, group_name in facebook_groups:
            try:
                url = f"https://graph.facebook.com/v18.0/{group_id}/feed"
                params = {
                    'access_token': fb_token,
                    'fields': 'message,created_time,permalink_url,story'
                }
                response = requests.get(url, params=params, timeout=10)
                data = response.json()

                for post in data.get('data', []):
                    message = post.get('message', post.get('story', ''))
                    keywords = ['grading', 'psa', 'beckett', 'cgc', 'grade', 'submit']

                    if any(kw in message.lower() for kw in keywords):
                        posts.append({
                            'title': message[:100],  # First 100 chars
                            'body': message[:250],   # Post excerpt
                            'group': group_name,
                            'url': post.get('permalink_url', ''),
                            'source': 'Facebook'
                        })
            except Exception as e:
                print(f"Facebook scrape failed for {group_name}: {e}")

        return posts

    def send_telegram(self):
        """
        Send Reddit/FB posts with direct links to reply
        """
        if not self.posts:
            msg = "🎯 CardSnap Signal Hunter — No new grading posts found"
            self._post_telegram(msg)
            return

        # Sort by recency
        self.posts.sort(key=lambda x: x.get('created', 0), reverse=True)

        timestamp = datetime.now().strftime("%H:%M")
        msg = f"🎯 CardSnap Signal Hunter — {len(self.posts)} Posts Found\n\n"

        for idx, post in enumerate(self.posts[:10], 1):  # Top 10 posts
            title = post.get('title', '')
            body = post.get('body', '')
            source = post.get('source', '')
            subreddit = post.get('subreddit', '')
            url = post.get('url', '')

            if source == 'Reddit':
                msg += f"🔗 [{idx}] {title}\n"
                msg += f"    r/{subreddit}\n"
                if body:
                    msg += f"    \"{body}...\"\n"
                msg += f"    {url}\n\n"
            else:
                msg += f"🔗 [{idx}] {title}\n"
                msg += f"    {source}\n"
                if body:
                    msg += f"    \"{body}...\"\n"
                msg += f"    {url}\n\n"

        msg += f"📊 Total: {len(self.posts)} posts | Source: Reddit + FB groups\n"
        msg += f"Reply directly to any post using the links above\n"

        self._post_telegram(msg)

    def run(self):
        """Main execution."""
        reddit_posts = self.scrape_reddit()
        fb_posts = self.scrape_facebook_groups()

        self.posts = reddit_posts + fb_posts

        # Log to Obsidian
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        report_path = os.path.expanduser(f"~/ObsidianVault/cardsnap/cardsnap_posts_{timestamp}.md")

        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, 'w') as f:
            f.write(f"# CardSnap Signal Posts — {timestamp}\n\n")
            for post in self.posts:
                f.write(f"## {post.get('title', '')}\n")
                f.write(f"**Source:** {post.get('source', '')} ({post.get('subreddit', post.get('group', ''))})\n")
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
            requests.post(url, data=data, timeout=10)
        except Exception as e:
            print(f"Telegram send failed: {e}")


if __name__ == "__main__":
    hunter = CardSnapSignalHunter()
    hunter.run()
