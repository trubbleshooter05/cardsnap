#!/usr/bin/env python3
"""Mark CardSnap GA4 funnel events as key events (conversions) via Admin API."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from google.analytics.admin_v1beta import AnalyticsAdminServiceClient
from google.analytics.admin_v1beta.types import KeyEvent
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

PROPERTY_ID = "536381692"
PARENT = f"properties/{PROPERTY_ID}"
SCOPES = ["https://www.googleapis.com/auth/analytics.edit"]
EVENTS = ("sign_up", "card_created", "begin_checkout", "purchase")

HERMES_CREDS = Path("/Users/openclaw/.hermes/credentials/gsc_credentials.json")
TOKEN_PATH = Path("/Users/openclaw/.hermes/credentials/ga4_admin_token.json")


def load_credentials() -> Credentials:
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
        if creds and creds.valid:
            return creds
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            TOKEN_PATH.write_text(creds.to_json())
            return creds

    if not HERMES_CREDS.exists():
        raise SystemExit(f"Missing OAuth client secrets: {HERMES_CREDS}")

    flow = InstalledAppFlow.from_client_secrets_file(str(HERMES_CREDS), SCOPES)
    # OAuth client only registers http://localhost (no port). Google allows any
    # loopback port when redirect_uri is exactly http://localhost.
    flow.redirect_uri = "http://localhost"
    print("Opening browser for one-time Google authorization…")
    creds = flow.run_local_server(
        port=8099,
        open_browser=True,
        authorization_prompt_message="Complete sign-in in the browser tab that opened.",
        success_message="Authorized. You can close the browser tab — setup will continue in Terminal.",
    )
    TOKEN_PATH.write_text(creds.to_json())
    return creds


def ensure_key_events(client: AnalyticsAdminServiceClient) -> None:
    existing = {ev.event_name for ev in client.list_key_events(parent=PARENT)}
    for name in EVENTS:
        if name in existing:
            print(f"OK  {name} (already a key event)")
            continue
        created = client.create_key_event(
            parent=PARENT,
            key_event=KeyEvent(
                event_name=name,
                counting_method=KeyEvent.CountingMethod.ONCE_PER_EVENT,
            ),
        )
        print(f"ADD {name} -> {created.name}")


def open_funnel_explore() -> None:
    url = (
        "https://analytics.google.com/analytics/web/#/"
        f"p{PROPERTY_ID}/reports/exploration"
    )
    print(f"Opening funnel explore: {url}")
    subprocess.run(["open", url], check=False)


def main() -> int:
    try:
        creds = load_credentials()
        client = AnalyticsAdminServiceClient(credentials=creds)
        ensure_key_events(client)
        open_funnel_explore()
        print("\nDone. In Explore, create funnel steps:")
        print("  session_start -> sign_up -> card_created -> begin_checkout -> purchase")
        return 0
    except Exception as exc:  # noqa: BLE001 - CLI script
        print(f"ERROR: {exc}", file=sys.stderr)
        print(
            "\nIf API is disabled, enable Analytics Admin API once:\n"
            "https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=gsc-access-491819",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
