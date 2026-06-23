# CardSnap — verify fixes (simple steps)

## 1. Paywall (regular Safari, NOT incognito)

1. Open **getcardsnap.com** in normal Safari.
2. Scan **5 different cards** (no login).
3. Scan a **6th** → paywall must appear.
4. Tap **Create Account**, sign in, scan again → paywall **still** appears.

## 2. Buy 10 scans (payment test)

1. Sign in on getcardsnap.com.
2. Hit paywall → **Buy 10 scans** (or /pricing).
3. Pay with Stripe test card **4242 4242 4242 4242** (live mode: real card).
4. After redirect home, you should see credits / scans work without paywall.

## 3. Stripe dashboard cleanup (5 min)

Stripe → **Developers → Webhooks**:

- **Keep:** `https://getcardsnap.com/api/webhooks/stripe`
- **Delete:** `cardsnap-seven.vercel.app/...`
- **FursBliss:** use `https://www.fursbliss.com/api/stripe/webhook` (not apex)

## 4. Supabase SQL (already done if table exists)

- `stripe_checkout_fulfillments` ✓
- Optional: run `supabase-checkout-funnel-events.sql` for server funnel log

## 5. See who tried to pay (SQL)

In CardSnap Supabase → SQL:

```sql
select created_at, event_name, user_id, checkout_session_id, source, payload
from checkout_funnel_events
order by created_at desc
limit 50;
```

## 6. GA4 funnel (browser-side)

Google Analytics → Reports → **Realtime** or **Explorations**:

Events: `paywall_shown` → `checkout_started` → `checkout_completed`

Drop-off between steps = where people quit.
