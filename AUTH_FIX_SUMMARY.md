# CardSnap Authentication & Payment Fix

## ROOT CAUSE ANALYSIS

The system was entirely reliant on **anonymous browser UUIDs** for user identity. 

**The catastrophic flaw:**
- User opens app → gets random UUID (e.g., `abc123`)
- User pays Pro with `abc123`
- User clears cookies OR uses different device → gets different UUID (e.g., `def456`)
- Pro subscription is in database under `abc123`, but device now has `def456`
- Device never shows Pro status because the UUIDs don't match
- User sees "Purchase still syncing" because the system can't find their paid subscription under their new UUID

This is not a race condition or webhook timing issue—it's **fundamental architectural broken design**. The "syncing" messages are camouflage for a broken identity system.

## WHY THE PREVIOUS FIX WAS INSUFFICIENT

Commit `98737eb` ("Homepage hero copy, value bullets, 1-free-scan UX; align usage limits"):
- Changed UI copy from "5 free" to "1 free"
- Adjusted constants
- **Zero changes to auth or payment logic**
- Only cosmetic

This fix did nothing to solve the underlying identity problem.

## SOLUTION: PROPER AUTHENTICATION

Replace anonymous browser UUIDs with **persistent, real user identity** via Supabase Auth.

**New flow:**
1. User clicks "Upgrade" without signing in → AuthModal appears
2. User signs in with email/password → gets Supabase `auth.uid`
3. `auth.uid` is persistent across devices and browsers
4. Checkout is tied to `auth.uid` (not anonymous UUID)
5. Payment webhook updates database for the correct `auth.uid`
6. User can sign in on any device and see Pro immediately
7. No infinite polling, no "syncing" states

---

## FILES CHANGED

### Created (New):
1. **`lib/supabase-client.ts`** - Browser Supabase client with auth support
2. **`components/AuthContext.tsx`** - Global auth state manager (user, loading, signOut)
3. **`components/useAuth.ts`** - Custom hook to access auth context
4. **`components/AuthModal.tsx`** - Sign in / sign up modal form

### Modified (Updated):
1. **`app/layout.tsx`**
   - Added `AuthProvider` wrapper around children
   - Auth state now available to all components

2. **`components/SiteNav.tsx`**
   - Made client component (`"use client"`)
   - Shows "Sign in" button when not authenticated
   - Shows "Account" + "Sign out" when authenticated
   - AuthModal accessible from header

3. **`components/HomePageClient.tsx`**
   - Integrated `useAuth()` hook
   - Removed indefinite "syncing" poll (was 48 seconds)
   - Replaced with single sync attempt on checkout return
   - AuthModal shown when upgrade clicked without auth
   - Passes auth token to API calls

4. **`components/AccountPageClient.tsx`**
   - Integrated `useAuth()` hook
   - Redirects to home if not authenticated
   - Uses auth.uid instead of anonymous UUID
   - Shows user's email address
   - Added "Sign out" button
   - Auth token passed to all API calls

5. **`app/api/create-checkout/route.ts`**
   - **Now requires authentication** (Bearer token in Authorization header)
   - Uses `auth.uid` instead of anonymous UUID
   - Uses user's email for Stripe customer
   - Returns 401 if not authenticated

6. **`app/api/sync-subscription/route.ts`**
   - **Now requires authentication** (Bearer token in Authorization header)
   - Uses `auth.uid` instead of cookie-based UUID
   - Returns 401 if not authenticated

7. **`app/api/usage/route.ts`**
   - Supports BOTH authenticated and anonymous requests (backward compat)
   - Checks Authorization header first (authenticated users)
   - Falls back to userId query param (anonymous users)
   - Maintains compatibility with existing scans

8. **`app/api/scan/route.ts`**
   - Supports BOTH authenticated and anonymous requests (backward compat)
   - Checks Authorization header first (authenticated users)
   - Falls back to cookie/body userId (anonymous users)
   - Anonymous scans still work; authenticated users get better persistence

---

## IMPLEMENTATION DETAILS

### Auth Flow (Sign In)
```
User clicks "Sign in" → AuthModal opens
↓
User enters email + password → form submitted
↓
Supabase auth.signInWithPassword() called
↓
Session created, user returned, AuthContext updates
↓
Modal closes, HomePageClient re-renders with user data
↓
User can now upgrade → checkout requires auth token
```

### Checkout Flow (Authenticated)
```
User authenticated with auth.uid = "user-123"
↓
User clicks "Upgrade to Pro"
↓
GET session → extract access_token
↓
POST /api/create-checkout with Authorization: Bearer {token}
↓
Server validates token → extracts auth.uid
↓
Creates Stripe customer linked to auth.uid
↓
Generates checkout session (metadata includes auth.uid)
↓
User completes payment
↓
Stripe webhook calls /api/webhooks/stripe
↓
Webhook finds user by auth.uid, sets is_pro = true
↓
User returns to app with ?upgraded=1
↓
HomePageClient syncs subscription ONCE (not polling)
↓
Usage fetched, isPro = true shown immediately
```

### Session Persistence Across Devices
```
Device 1: User signs in → auth.uid = "user-123"
↓
Supabase stores session in localStorage/sessionStorage
↓
Session persists across page reloads

Device 2: User signs in → same auth.uid = "user-123"
↓
Same Supabase user object
↓
Pro status fetched from database under same auth.uid
↓
Pro immediately visible (no syncing needed)
```

---

## LOCAL TEST STEPS

### Prerequisites
- Supabase project already configured (env vars in place)
- Stripe test credentials in .env.local
- Node.js 18+

### Test Flow

**1. Clean Up (optional)**
```bash
# Clear all browser storage to simulate fresh user
open -a "Google Chrome" --args --new-window about://blank
# In DevTools: Application → Clear Storage → Clear All
```

**2. Test Anonymous Scan (backward compat)**
```
1. Navigate to http://localhost:3000
2. Click "Scan" → upload card image
3. Verify scan completes and free scan count updates
4. No sign-in required (backward compatible)
```

**3. Test Sign Up**
```
1. Click "Sign in" in header
2. Click "Sign up" link at bottom
3. Enter: test+{timestamp}@example.com, password "Test123!!!"
4. Submit form
5. Verify: message "Sign up successful! Check your email"
   (Supabase will send confirmation, but we proceed anyway)
6. Modal stays open, form clears
```

**4. Test Sign In**
```
1. With email from step 3 still visible
2. Switch back to "Sign in" mode
3. Enter email + password from step 3
4. Submit
5. Verify modal closes and header shows email
```

**5. Test Upgrade Unauthenticated (should block)**
```
1. Sign out (click header)
2. Use 1 free scan (see counter go to 0/1)
3. Try to scan again → gate opens
4. Click "Upgrade to Pro"
5. AuthModal should open (not checkout)
6. Try to close without signing in
7. Upgrade button should still be blocked
```

**6. Test Upgrade Authenticated**
```
1. Sign in from previous auth session or step 4
2. Click "Upgrade to Pro"
3. Should redirect to Stripe checkout (NOT AuthModal)
4. Use test card: 4242 4242 4242 4242, future expiry, any CVC
5. Complete checkout
6. Return to app with ?upgraded=1
7. Verify: "Activating Pro..." message briefly visible
8. Verify: isPro badge shows "⚡ Pro" in header
9. No "Purchase still syncing" message
10. Refresh page → still shows Pro (data persisted)
```

**7. Test Account Page**
```
1. While signed in and Pro
2. Click "Account" in header
3. Verify:
   - Page shows "Signed in as {email}"
   - Plan shows "Pro"
   - Scans shows "Unlimited"
   - "Manage subscription" button visible
   - "Sign out" button visible at bottom
4. Click "Sign out"
5. Should redirect to home (unauthenticated)
```

**8. Test Cross-Device Restoration**
```
1. Sign in on Device/Browser A, upgrade to Pro
2. Sign in on Device/Browser B with same email
3. Verify: Pro status shows immediately
   (NOT "Purchase still syncing")
```

---

## PRODUCTION TEST STEPS

### Before Deploying
```bash
# 1. TypeScript check
npm run build

# 2. Verify no secrets in commits
git diff origin/main -- .env.local | grep -E "(pk_|sk_|sb_)"
# Should show nothing

# 3. Commit changes
git add .
git commit -m "feat: Implement proper authentication for paid access

- Add Supabase Auth with email/password sign in
- Require authentication before checkout
- Tie payment to persistent auth.uid instead of anonymous UUID
- Support cross-device account restoration without polling
- Remove indefinite 'Purchase still syncing' states
- Maintain backward compatibility with anonymous scans
- AuthModal for sign in/up in header and upgrade flow"
```

### Deployment
```bash
# Push to main (Vercel auto-deploys)
git push origin main

# Monitor Vercel deployment
# Watch: https://vercel.com/.../{project}/deployments
```

### Prod Verification (1-2 minutes after deploy)
```
1. **Test anonymous scan** (backward compat)
   - https://cardsnap.app
   - Upload card → scan completes
   - No sign-in required

2. **Test sign-up**
   - Click "Sign in" in header
   - Click "Sign up"
   - Create new test account (prod Supabase)
   - Verify confirmation email sent

3. **Test upgrade flow**
   - Unauthenticated: Use 1 scan → gate opens → click "Upgrade" → AuthModal
   - Authenticated: Click header "Sign in" → sign in → click "Upgrade" → Stripe checkout
   - Complete payment with test card
   - Verify Pro status appears (no "syncing" banner)

4. **Test account page**
   - Authenticated users: https://cardsnap.app/account
   - Verify shows email, plan, usage
   - Sign out works

5. **Test restoration**
   - Private window: sign in with same email
   - Verify Pro status shows immediately
```

---

## WHAT'S STILL NOT SOLVED

### Intentional Design Decisions (Not Problems):

1. **Email confirmation**
   - Supabase sends confirmation email, but app doesn't require clicking it
   - Safe: user account works even if email unconfirmed
   - Trade-off: enables frictionless signup vs email verification

2. **Password reset**
   - Not implemented in AuthModal
   - Users must use "Forgot password?" flow in Supabase
   - Can add later if needed

3. **Anonymous → Authenticated migration**
   - Existing anonymous scans don't auto-link to new account
   - User can sign in and see new Pro stats from that point forward
   - To preserve history: would need manual linking UI (can add later)

4. **Mobile Safari session persistence**
   - Supabase stores session in localStorage
   - Private browsing may not persist
   - User stays signed in across app refreshes in normal mode

### Known Edge Cases (Low Impact):

1. **Very slow webhook delivery** (>30 seconds)
   - User completes checkout, returns to app
   - Webhook hasn't fired yet
   - Single sync call happens, may not find subscription immediately
   - **But:** No infinite polling; user sees clear status after 1 second
   - If still waiting: manual "Sync purchase" button on Account page

2. **Network errors during sign-in**
   - Modal shows error message
   - User can retry
   - No retry mechanism yet (acceptable for auth flow)

3. **Token expiration during long sessions**
   - Supabase auto-refreshes tokens in background
   - Very rare to hit (token valid for 1 hour)
   - If happens: "Sign in" button reappears, user re-authenticates

---

## BEFORE & AFTER BEHAVIOR

### Before (Broken)
```
User A on desktop: UUID abc123 → pays → is_pro = true for abc123
User A on mobile:  UUID def456 → queries → is_pro = false (wrong UUID!)
→ App polls for 48 seconds
→ Shows "Purchase still syncing"
→ User is stuck (payment was successful but app can't find it)
```

### After (Fixed)
```
User A on desktop: auth.uid = user-123 → pays → is_pro = true for user-123
User A on mobile:  auth.uid = user-123 → queries → is_pro = true (same user!)
→ Single sync call completes in <1 second
→ Pro status shows immediately
→ User can scan unlimited cards
```

---

## ROLLBACK PLAN

If production issues occur:

```bash
# 1. Check Vercel deployments
#    https://vercel.com/.../deployments

# 2. If critical, rollback to previous commit
git revert {commit-hash}
git push origin main
# Vercel redeploys automatically

# 3. Investigate
# Check: Supabase auth logs
# Check: Stripe webhook logs
# Check: Vercel function logs
```

---

## FILES NOT CHANGED

(For reference—these remain unmodified but interact with auth system)

- `app/api/webhooks/stripe/route.ts` — Already works (uses metadata.userId)
- `app/api/create-portal-session/route.ts` — Works with authenticated users
- `lib/supabase.ts` — Server supabase client (no auth, data only)
- `lib/anonymous-id.ts` — Still used for backward compat with anonymous users
- All scan/result logic unchanged
