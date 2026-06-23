# Stripe dashboard cleanup (CardSnap account)

From Workbench screenshots (2026-06-23):

## Keep (production)
- **playful-dream** → `https://getcardsnap.com/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Signing secret must match Vercel `STRIPE_WEBHOOK_SECRET`.

## Disable or delete (broken / stale)
| Endpoint | Issue |
|----------|--------|
| `https://cardsnap-seven.vercel.app/api/webhooks/stripe` | **7/7 failed** — old preview URL; wrong signing secret → **400** |
| `https://fursbliss.com/api/stripe/webhook` (×2 destinations) | **7/7 failed** — apex **308** redirect; use `https://www.fursbliss.com/api/stripe/webhook` |
| `https://outagealer...` | **404** — endpoint gone |

## Supabase (once)
Run `supabase-stripe-fulfillments.sql` for idempotent checkout fulfillment.

Checkout return calls `/api/sync-checkout` so pack credits and Pro apply even when webhooks fail.
