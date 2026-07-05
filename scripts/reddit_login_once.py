#!/usr/bin/env python3
"""One-time Reddit login for cardsnap — saves isolated Playwright profile."""
import sys
from pathlib import Path

sys.path.insert(0, "/Users/openclaw/Documents/riley")
from reddit_browser_profiles import login_once

if __name__ == "__main__":
    login_once("cardsnap")
