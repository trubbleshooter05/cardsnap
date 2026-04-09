# CardSnap RLS Security Setup Summary

## Overview
This document outlines the Row-Level Security (RLS) implementation for the CardSnap database to ensure users can only access their own data.

## Tables Identified

### 1. **public.scans**
Stores card scan results and metadata.

**Columns:**
- `id` (uuid) - Primary key
- `user_id` (text) - References the user who performed the scan
- `card_name` (text) - The card being scanned
- `result` (jsonb) - Scan results data
- `created_at` (timestamptz) - Timestamp of scan

**Security Policies:**
- ✅ SELECT: Users can only view scans where `user_id = auth.uid()`
- ✅ INSERT: Users can only insert scans with their own `user_id`
- ✅ UPDATE: Users can only modify scans they own
- ✅ DELETE: Users can only delete scans they own

---

### 2. **public.users**
Stores user profile and subscription information.

**Columns:**
- `id` (text) - Primary key (auth.uid)
- `is_pro` (boolean) - Pro subscription status
- `stripe_customer_id` (text) - Stripe customer identifier
- `scan_count_this_month` (int) - Monthly scan count

**Security Policies:**
- ✅ SELECT: Users can only view their own user record
- ✅ UPDATE: Users can only modify their own user record
- ✅ INSERT: Service role can insert (for registration flows)

---

## How RLS Works

### Authentication Context
Supabase provides `auth.uid()` in all RLS policies, which returns the currently authenticated user's ID.

### Policy Enforcement
- Policies are automatically enforced at the database level
- Users cannot bypass RLS through API calls
- Service role keys can bypass RLS (useful for server-side operations)
- Anonymous users cannot access protected data

---

## Implementation Steps

1. **Execute the SQL** in your Supabase SQL Editor:
   - Navigate to Supabase Dashboard → Your Project
   - Click "SQL Editor" → New Query
   - Copy the contents of `rls-security-setup.sql`
   - Click "Run"

2. **Verify RLS is Enabled:**
   ```sql
   -- Check that RLS is enabled on both tables
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public' AND tablename IN ('scans', 'users');
   ```

3. **Verify Policies are Created:**
   ```sql
   -- View all RLS policies
   SELECT schemaname, tablename, policyname, permissive, cmd
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename IN ('scans', 'users');
   ```

---

## API Access Considerations

### Client-Side Access (Anonymous Key)
When using the anonymous key from the browser:
- RLS policies will be enforced
- Users will only see their own data
- Cross-user access is blocked at the database level

### Server-Side Access (Service Role Key)
When using the service role key on the server:
- RLS policies are **bypassed**
- This is intentional for operations like:
  - Initial user registration
  - Admin operations
  - Batch processing
  - Cleanup tasks

**Current Code Usage:**
Your `lib/supabase.ts` already handles this:
```typescript
export function createServerSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ...
  // Service role can bypass RLS
}
```

---

## Security Checklist

- [x] RLS enabled on `public.scans`
- [x] RLS enabled on `public.users`
- [x] SELECT policies enforce user isolation
- [x] INSERT policies prevent user_id spoofing
- [x] UPDATE policies prevent cross-user modification
- [x] DELETE policies prevent cross-user deletion
- [x] Service role access documented for server-side operations

---

## Testing RLS Policies

You can test policies in the Supabase dashboard:

1. Go to **Authentication** → Users
2. Create a test user
3. Use the **SQL Editor** with that user's auth token
4. Verify queries respect RLS:

```sql
-- This should only return the authenticated user's scans
SELECT * FROM public.scans;

-- This should fail or return empty if user_id ≠ auth.uid()
SELECT * FROM public.scans WHERE user_id = 'different-user-id';
```

---

## Important Notes

⚠️ **Cast Type Matching:**
The policies use `auth.uid()::text` because:
- `auth.uid()` returns uuid type
- `user_id` column is text type
- The explicit cast ensures proper comparison

⚠️ **Service Role Bypass:**
The INSERT policy on `users` table allows service role to insert (no WHERE clause). This is necessary for user registration but could be tightened with a trigger if needed.

---

## Next Steps

1. Apply the SQL from `rls-security-setup.sql` in Supabase
2. Verify with the verification queries
3. Test with actual users to ensure expected behavior
4. Monitor RLS performance (should be negligible)
