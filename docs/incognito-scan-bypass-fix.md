# Incognito Free-Scan Bypass — Root Cause & Fix

**Site:** [getcardsnap.com](https://getcardsnap.com)  
**Linear:** [HER-70](https://linear.app/hermes123/issue/HER-70/fix-incognito-free-scan-bypass-via-ip-cap)  
**Status:** Fixed and verified in production (June 2026)

---

## Problem

Users who exhausted their **5 free scans** in a normal browser could open **incognito/private mode** and receive a **fresh set of 5 free scans**. The paywall was trivially bypassed without paying or signing in.

---

## Why It Happened

Incognito creates a **new identity** on every axis the app originally trusted:

| Limit axis | Normal browser | Incognito |
|---|---|---|
| Anonymous `user_id` (cookie / localStorage) | Existing ID, 5 scans used | **New ID**, count = 0 |
| `device_id` (cookie / localStorage) | Existing device, 5 scans used | **New device ID**, count = 0 |
| IP address | Real IP | Often **different IP** (Safari iCloud Private Relay) |

So all three client-controlled buckets reset at once.

### Additional issues discovered during fixes

1. **Pre-migration scans had no `ip_hash`** — IP counting only saw scans recorded *after* the column was added; older scans were invisible to IP limits.
2. **Safari does not expose private mode to JavaScript reliably** — client-side “incognito detection” returned `false` even in Private Browsing, so the server never received `privateSession: true`.
3. **Production proof** — calling `/api/usage?privateSession=1` returned `scansRemaining: 0` and `blockedByPrivateSession: true`, but the live site never sent that flag from Safari.

---

## Fix Timeline (3 iterations)

### Attempt 1 — IP hash on `scans` table

**Commit:** `7382172` — *Cap free scans per IP to block incognito bypass*

- Hashed client IP (`x-forwarded-for`, etc.) into `scans.ip_hash`
- Enforced free tier on **user + device + IP** (all must be under 5)

**Why it wasn’t enough:**

- Old scans: `ip_hash IS NULL` → IP count stayed at 0 for users who exhausted scans before deploy
- Safari Private Relay: incognito often uses a **different IP** than normal browsing

**SQL:** `supabase-scan-ip-hash.sql`

```sql
alter table public.scans add column if not exists ip_hash text;
create index if not exists scans_ip_hash_idx on public.scans (ip_hash);
```

---

### Attempt 2 — IP ledger + client private-mode gate

**Commit:** `99f8ace` — *Block incognito free-scan bypass with IP ledger and private mode gate*

- Added `free_scan_ip_usage` table + `increment_ip_free_scans()` RPC for reliable IP counters
- Client `detectPrivateSession()` + `privateSession` flag on `/api/usage` and `/api/scan`
- Server blocks guests in private mode (`privateSession && !isAuthenticated`)

**Why it wasn’t enough:**

- Safari never set `privateSession: true` in practice
- Server logic was correct when the flag was forced (verified via curl), but the browser never sent it

**SQL:** `supabase-free-scan-ip-usage.sql`

```sql
create table if not exists public.free_scan_ip_usage (
  ip_hash text primary key,
  free_scans_used int not null default 0 check (free_scans_used >= 0),
  updated_at timestamptz not null default now()
);

-- backfill + increment_ip_free_scans() function (see file in repo)
```

---

### Attempt 3 — Server device fingerprint (what actually fixed it)

**Commit:** `cfece25` — *Link incognito scans to normal browser via server device fingerprint*

**Core idea:** Don’t trust cookies or client IDs for cross-session enforcement. Derive a **stable fingerprint from HTTP headers** (User-Agent, Accept-Language, `sec-ch-ua-platform`, etc.) on the server. Link that fingerprint to all historical `device_id` and `user_id` values seen on the same physical browser, then count scans across the whole linked set.

Normal Safari and incognito on the same phone share the same fingerprint → **shared scan budget**.

**SQL:** `supabase-device-fingerprint.sql`

```sql
alter table public.scans add column if not exists device_fingerprint text;
create index if not exists scans_device_fingerprint_idx on public.scans (device_fingerprint);

create table if not exists public.device_fingerprint_links (
  fingerprint text not null,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (fingerprint, device_id)
);

create table if not exists public.device_fingerprint_users (
  fingerprint text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (fingerprint, user_id)
);
```

---

## How Enforcement Works Now

Free scans are blocked when **any** of these are exhausted (unless Pro or prepaid credits):

```
user scans used   ≥ 5
device scans used ≥ 5
IP free scans     ≥ 5
fingerprint scope ≥ 5   ← links normal + incognito on same device
guest in private mode   ← backup if client sends privateSession (non-Safari)
```

### Fingerprint flow (anonymous users)

1. **Derive fingerprint** from request headers (`lib/device-fingerprint.ts`).
2. **Sync links** on every `/api/usage` and `/api/scan` call (`syncFingerprintLinks`):
   - Current `user_id` and `device_id`
   - All historical `device_id`s for that user (from `scans`)
   - All `device_id` / `user_id` rows sharing the same `ip_hash` (when IP is known)
3. **Count scans** across fingerprint scope: max of
   - `scans.device_fingerprint = fp`
   - `scans.device_id IN (linked devices)`
   - `scans.user_id IN (linked users)`
4. For anonymous users, use `max(per-user count, fingerprint scope count)` before applying limits.

### Why incognito showed “2 left” instead of “0”

Observed after fix:

- **Normal browser:** 0 scans left (user bucket fully exhausted)
- **Incognito:** 2 scans left, then 1 after one scan, shared across incognito windows

This is expected during the transition:

- The **per-user** count in incognito starts at 0 (new anonymous ID).
- The **fingerprint / IP / device-link** counts may show **3 used** (scans that were linkable post-deploy), leaving `5 − 3 = 2` on the tightest axis.
- Scanning in one incognito window decrements the **shared** fingerprint/IP ledger, so a **second incognito window** shows the same remaining count (1) — confirming cross-session linking works.

Over time, as all scans carry `device_fingerprint` and `ip_hash`, normal and incognito converge to the same remaining count.

---

## Files Changed

| File | Role |
|---|---|
| `lib/scan-enforcement.ts` | Core limit logic: user, device, IP, private session |
| `lib/ip-hash.ts` | Hash client IP from Vercel/proxy headers |
| `lib/ip-scan-usage.ts` | IP counter table read/increment |
| `lib/device-fingerprint.ts` | Server-side browser fingerprint |
| `lib/fingerprint-usage.ts` | Link tables + scoped scan counts |
| `lib/detect-private-session.ts` | Client private-mode hint (backup, not primary on Safari) |
| `app/api/scan/route.ts` | Enforce limits before scan; record `ip_hash`, `device_fingerprint` |
| `app/api/usage/route.ts` | Return `scansRemaining`, fingerprint-aware counts |
| `components/HomePageClient.tsx` | Pre-scan paywall; pass `privateSession`; wait for detection before usage |
| `scripts/verify-scan-enforcement.mjs` | Unit checks for blocking logic |
| `supabase-scan-ip-hash.sql` | Migration: `scans.ip_hash` |
| `supabase-free-scan-ip-usage.sql` | Migration: IP ledger + RPC |
| `supabase-device-fingerprint.sql` | Migration: fingerprint column + link tables |

---

## Supabase Migrations Checklist

Run all three in the Supabase SQL editor (in order):

- [ ] `supabase-scan-ip-hash.sql`
- [ ] `supabase-free-scan-ip-usage.sql`
- [ ] `supabase-device-fingerprint.sql`

Optional env vars (Vercel):

| Variable | Purpose |
|---|---|
| `IP_HASH_SALT` | Salt for IP hashing (defaults to `"cardsnap"`) |
| `DEVICE_FP_SALT` | Salt for device fingerprint (falls back to `IP_HASH_SALT`) |

---

## Verification Steps

1. Deploy latest `main` to Vercel.
2. Run all SQL migrations above.
3. In **normal Safari**, exhaust or confirm **0 scans left**.
4. Open **incognito** on the same device:
   - Should **not** show 5 free scans
   - Should show a **shared** remaining count (may differ slightly from 0 during backfill)
5. Scan once in incognito → open a **new incognito window** → remaining count should **decrease**, not reset to 5.

---

## Related Fixes (same audit period)

These were fixed in parallel and share the same `/api/scan` enforcement path:

- False Pro badge / stale `is_pro` in DB
- Prepaid credits treated as lifetime cap instead of spendable balance
- Stripe price mismatch ($9.99 UI vs $4.99 charged)
- Refunds not revoking Pro / pack credits (`charge.refunded` webhook)
- Email capture not sending (`/api/capture-email` + Resend)

---

## Design Tradeoffs

| Choice | Benefit | Cost |
|---|---|---|
| IP limit (5 per IP) | Stops cookie rotation on same network | Household / coffee shop shares 5 free scans |
| Server fingerprint | Links normal + incognito on same device without Safari APIs | Same browser model on one network may share fingerprint dimensions |
| Private-mode client flag | Instant block in Chrome/Firefox private mode | Unreliable on Safari; kept as backup only |
| Prepaid / Pro | Always bypass IP and fingerprint caps | Requires payment or subscription |

---

## Commits

```
7382172  Cap free scans per IP to block incognito bypass
99f8ace  Block incognito free-scan bypass with IP ledger and private mode gate
cfece25  Link incognito scans to normal browser via server device fingerprint
```

---

*Last updated: 2026-06-01*
