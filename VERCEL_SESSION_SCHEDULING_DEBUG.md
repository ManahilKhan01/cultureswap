# Vercel Session Scheduling Error - Complete Debug & Fix Guide

## Issue Summary
**Error:** "Edge Function returned a non-2xx status code"  
**When:** After deploying to Vercel, trying to schedule a session  
**Works on:** Localhost only

---

## Root Cause Analysis

The error occurs in your Supabase Edge Function (`google-calendar/create-meeting`) because:

### 1. **CRITICAL: Missing `google_tokens` Table** 
The edge function tries to read/write to the `google_tokens` table, but this table **doesn't exist in production**.

**Location where it fails:**
- File: `supabase/functions/google-calendar/index.ts` (Line 157)
- Query: `.from("google_tokens").select("*").eq("user_id", user.id)`
- This is the FIRST check when creating a meeting - it fails immediately

### 2. **Missing Environment Variables in Supabase**
The edge function requires these Supabase secrets to be set in the dashboard:
- `SUPABASE_SERVICE_ROLE_KEY` ❌ Not set
- `SUPABASE_URL` ❌ Not set  
- `SUPABASE_ANON_KEY` ❌ Not set
- `GOOGLE_CLIENT_ID` ⚠️ May not be set
- `GOOGLE_CLIENT_SECRET` ⚠️ May not be set
- `GOOGLE_REDIRECT_URI` ⚠️ May not be set
- `FRONTEND_URL` ❌ Still points to localhost:8080

### 3. **Frontend URL Mismatch**
The edge function expects `FRONTEND_URL` for OAuth callback redirects. Currently set to:
```
FRONTEND_URL=http://localhost:8080
```
Should be:
```
FRONTEND_URL=https://cultureswap.vercel.app
```

---

## Step-by-Step Fix

### **STEP 1: Create the `google_tokens` Table**

Run this SQL in your Supabase dashboard (SQL Editor):

```sql
-- ============================================================================
-- CREATE GOOGLE TOKENS TABLE FOR GOOGLE CALENDAR INTEGRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own tokens
CREATE POLICY "Users can view their own Google tokens"
  ON google_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own tokens
CREATE POLICY "Users can insert their own Google tokens"
  ON google_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tokens
CREATE POLICY "Users can update their own Google tokens"
  ON google_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage tokens (needed by edge function)
CREATE POLICY "Service role can manage all Google tokens"
  ON google_tokens USING (
    current_user_id() = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = google_tokens.user_id
    )
  );
```

### **STEP 2: Set Supabase Secrets in Dashboard**

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Settings** → **Edge Functions Secrets**
3. Add these secrets:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `SUPABASE_URL` | `https://dzakugrwxzsadglntxnm.supabase.co` | From your Supabase settings |
| `SUPABASE_ANON_KEY` | Your VITE_SUPABASE_ANON_KEY | From your .env file |
| `SUPABASE_SERVICE_ROLE_KEY` | **Get from Settings → API** | From Supabase dashboard (Settings tab) |
| `GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | `YOUR_GOOGLE_CLIENT_SECRET` | From Google Console |
| `GOOGLE_REDIRECT_URI` | `https://dzakugrwxzsadglntxnm.supabase.co/functions/v1/google-calendar/google-callback` | Your Supabase edge function URL |
| `FRONTEND_URL` | `https://cultureswap.vercel.app` | Your Vercel deployment URL |

**To get SUPABASE_SERVICE_ROLE_KEY:**
- Go to Supabase Dashboard
- Click **Settings** (bottom left)
- Go to **API**
- Copy `service_role secret` (NOT the anon key)

### **STEP 3: Update Your Production .env on Vercel**

1. Go to **Vercel Dashboard** → Your Project
2. Go to **Settings** → **Environment Variables**
3. Update:

```
VITE_SUPABASE_URL=https://dzakugrwxzsadglntxnm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://dzakugrwxzsadglntxnm.supabase.co/functions/v1/google-calendar/google-callback
FRONTEND_URL=https://cultureswap.vercel.app
```

### **STEP 4: Verify Google OAuth Settings**

In **Google Cloud Console**:

1. Go to **APIs & Services** → **OAuth consent screen**
2. Add **Authorized JavaScript origins:**
   ```
   https://dzakugrwxzsadglntxnm.supabase.co
   https://cultureswap.vercel.app
   https://accounts.google.com
   ```

3. Add **Authorized redirect URIs:**
   ```
   https://dzakugrwxzsadglntxnm.supabase.co/functions/v1/google-calendar/google-callback
   http://localhost:8080/profile
   https://cultureswap.vercel.app/profile
   ```

4. Save and wait 5-10 minutes for Google to propagate changes

---

## Verification Checklist

- [ ] ✅ `google_tokens` table created in production database
- [ ] ✅ All 7 secrets added to Supabase Edge Functions Secrets
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` is specifically the **service_role** secret (not anon key)
- [ ] ✅ All environment variables match between Supabase secrets and code
- [ ] ✅ `FRONTEND_URL` points to Vercel URL, not localhost
- [ ] ✅ Google OAuth redirect URIs include Vercel domain
- [ ] ✅ Supabase database URL is correct and accessible
- [ ] ✅ You've waited 5+ minutes after Google OAuth changes

---

## Testing the Fix

### **Test 1: Verify google_tokens Table Exists**

Run in Supabase SQL Editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'google_tokens';
```
Should return: `google_tokens`

### **Test 2: Test Google Connection**

1. Deploy your app to Vercel
2. Go to **Profile** page
3. Click "Connect" next to Google Calendar
4. Complete OAuth flow (you'll be redirected back)
5. Check if connection shows as "Active"

### **Test 3: Create a Session**

1. Go to **Swaps** → **Active Swaps** → **View Details**
2. Click **Schedule Next Session**
3. Select date/time
4. Click **Schedule**
5. Should see: "Session Scheduled" toast with meet link generated

---

## Common Error Messages & Solutions

### Error: "Google account not connected"
**Cause:** Table exists but user has no Google token  
**Solution:** User must go to Profile and click "Connect" for Google Calendar first

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
**Cause:** Secret not set in Supabase dashboard  
**Solution:** Follow STEP 2 above, ensure you use service_role secret not anon key

### Error: "Invalid or expired token"
**Cause:** User's auth token is invalid  
**Solution:** User must log out and log back in

### Error: "Failed to generate Google Meet link. Please check your Google Calendar settings"
**Cause:** Google Calendar API quota exceeded or permissions issue  
**Solution:**
1. Check Google Cloud Console for API errors
2. Ensure calendar.events scope is requested
3. Check Google OAuth refresh token hasn't expired

---

## Database Data Verification

### Check if user has Google token connected:

```sql
SELECT user_id, created_at, updated_at
FROM google_tokens
WHERE user_id = '[YOUR_USER_ID]';
```

### Check session was created:

```sql
SELECT id, swap_id, meet_link, scheduled_at, status
FROM swap_sessions
ORDER BY created_at DESC LIMIT 10;
```

### Check if there are any RLS issues:

```sql
-- Temporarily disable RLS to diagnose
ALTER TABLE google_tokens DISABLE ROW LEVEL SECURITY;
-- Test again, then re-enable:
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
```

---

## Key Differences: Localhost vs Vercel

| Aspect | Localhost | Vercel |
|--------|-----------|--------|
| Frontend URL | `http://localhost:8080` | `https://cultureswap.vercel.app` |
| Edge Function Secrets | N/A (uses .env locally) | **MUST be set in Supabase** |
| Database Access | Direct to local/dev DB | Via Supabase cloud |
| google_tokens table | Works (auto-created?) | **Must manually create** |
| Google OAuth redirect | `http://localhost:8080` | `https://cultureswap...` |

---

## Troubleshooting: Edge Function Logs

If you still get errors:

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on `google-calendar`
3. Go to **Logs** tab
4. Look for error messages with timestamps
5. Check exact error returned

The logs should show:
- ✅ Function invoked
- ✅ User authenticated
- ✅ google_tokens table queried
- ✅ Google Calendar API called
- ✅ Meet link returned

---

## Support: What to Provide if Still Failing

If you still encounter issues after following this guide, provide:

1. Exact error message from Supabase Edge Function logs
2. Screenshot of Supabase secrets (hide sensitive parts)
3. Output of the verification SQL queries above
4. Whether user has connected Google Calendar first
5. Browser console errors

---

## Prevention: Future Deployments

After this fix, add to your deployment checklist:

- [ ] Create `CREATE_GOOGLE_TOKENS_TABLE.sql` for future deployments
- [ ] Document all required Supabase secrets
- [ ] Test session scheduling before declaring deployment complete
- [ ] Update FRONTEND_URL if domain changes
