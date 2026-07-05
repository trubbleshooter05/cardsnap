#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.insert(0, "/Users/openclaw/Documents/riley")
from facebook_browser_profiles import login_once
if __name__ == "__main__":
    login_once("cardsnap")
