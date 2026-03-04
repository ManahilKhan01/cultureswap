# Your Production Setup Guide - Quick Reference

> **Created for:** Production deployment to `https://cultureswap.vercel.app`  
> **Date:** February 19, 2026  
> **Your Supabase Project:** `dzakugrwxzsadglntxnm`

---

## 🚨 What's Broken Right Now

When you try to schedule a session on Vercel, the error "Edge Function returned a non-2xx status code" happens because:

1. **The `google_tokens` table doesn't exist** in your production Supabase database
2. **Environment variables aren't set** in Supabase Edge Functions
3. **Frontend URL still points to localhost** instead of your Vercel URL

---

## ✅ How to Fix It (In Order)

### **Fix 1: Create the google_tokens Table (5 minutes)**

1. Go to: https://supabase.com/dashboard/project/dzakugrwxzsadglntxnm
2. Click on **SQL Editor** on the left
3. Click **New Query**
4. Paste this entire SQL:

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

CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);

ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Google tokens"
  ON google_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google tokens"
  ON google_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google tokens"
  ON google_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

5. Click **Run** (blue button)
6. You should see: ✅ Query executed successfully

---

### **Fix 2: Set Supabase Edge Function Secrets (10 minutes)**

1. Go to: https://supabase.com/dashboard/project/dzakugrwxzsadglntxnm
2. Click **Settings** (bottom left) → **Edge Functions** (or look for "Secrets" tab)
3. Click **+ New Secret**
4. Add these 7 secrets one by one:

#### Secret 1:
- **Name:** `SUPABASE_URL`
- **Value:** `https://dzakugrwxzsadglntxnm.supabase.co`
- Click **Add Secret**

#### Secret 2:
- **Name:** `SUPABASE_ANON_KEY`
- **Value:** `YOUR_SUPABASE_ANON_KEY`
- Click **Add Secret**

#### Secret 3:
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** Get from: Settings → API → Copy the service_role key (NOT the anon key!)
- Click **Add Secret**

#### Secret 4:
- **Name:** `GOOGLE_CLIENT_ID`
- **Value:** `YOUR_GOOGLE_CLIENT_ID`
- Click **Add Secret**

#### Secret 5:
- **Name:** `GOOGLE_CLIENT_SECRET`
- **Value:** `YOUR_GOOGLE_CLIENT_SECRET`
- Click **Add Secret**

#### Secret 6:
- **Name:** `GOOGLE_REDIRECT_URI`
- **Value:** `https://dzakugrwxzsadglntxnm.supabase.co/functions/v1/google-calendar/google-callback`
- Click **Add Secret**

#### Secret 7:
- **Name:** `FRONTEND_URL`
- **Value:** `https://cultureswap.vercel.app`
- Click **Add Secret**

**Result:** You should see all 7 secrets listed with green checkmarks ✅

---

### **Fix 3: Update Google OAuth Settings (10 minutes)**

1. Go to: https://console.cloud.google.com/
2. Select your Google project (if you have multiple)
3. Go to **APIs & Services** → **OAuth consent screen** (left sidebar)
4. Scroll down to **Authorized JavaScript origins**
5. Add these origins (click **+ Add URI** for each):
   - `https://dzakugrwxzsadglntxnm.supabase.co`
   - `https://cultureswap.vercel.app`

6. Scroll down to **Authorized redirect URIs**
7. Add these URIs (click **+ Add URI** for each):
   - `https://dzakugrwxzsadglntxnm.supabase.co/functions/v1/google-calendar/google-callback`
   - `https://cultureswap.vercel.app/profile`

8. Click **Save** at the bottom
9. **WAIT 5-10 MINUTES** for Google to propagate the changes

---

### **Fix 4: Verify Everything is Connected (5 minutes)**

1. Go to your Vercel app: https://cultureswap.vercel.app
2. Log in with a test account
3. Go to **Profile**
4. Look for "Connected Services" section
5. Under **Google Calendar**, click **Connect**
6. Complete the Google OAuth flow
7. You should see "Connected" ✅

---

## 🧪 Test That It Works

1. Go to **Swaps** on your app
2. Find an active swap and click **View Details**
3. Click **Schedule Next Session**
4. Pick a date and time
5. Click **Schedule**
6. You should see: ✅ "Session Scheduled" message with a Google Meet link

---

## 📊 Data Checklist

After setup, verify this data exists in your production database:

### Check 1: Table exists
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'google_tokens';
```
Expected result: One row for `google_tokens`

### Check 2: User has Google token
```sql
SELECT user_id, created_at FROM google_tokens LIMIT 10;
```
Expected result: Shows users who connected their Google Calendar

### Check 3: Sessions were created
```sql
SELECT id, swap_id, meet_link, status FROM swap_sessions 
ORDER BY created_at DESC LIMIT 5;
```
Expected result: Shows scheduled sessions with Google Meet links

---

## 🆘 If It Still Doesn't Work

### Get the actual error:

1. Go to: https://supabase.com/dashboard/project/dzakugrwxzsadglntxnm
2. Click **Edge Functions** on left
3. Click on the `google-calendar` function
4. Go to **Logs** tab
5. Try scheduling a session on your app
6. Look at the logs - it will show the exact error

### Common errors:

| Error | Cause | Solution |
|-------|-------|----------|
| `google_tokens` relation not found | Table doesn't exist | Run Fix 1 SQL |
| `SUPABASE_SERVICE_ROLE_KEY` is undefined | Secret not set | Check Fix 2, ensure secret name is exact |
| Invalid or expired token | Auth failed | User needs to log out/log in again |
| Redirect URI not allowed | Google OAuth issue | Check Fix 3, wait 5-10 mins |

---

## 📝 Summary of Your Production Values

```
Supabase Project ID: dzakugrwxzsadglntxnm
Supabase URL: https://dzakugrwxzsadglntxnm.supabase.co
Vercel App URL: https://cultureswap.vercel.app
Google Project ID: 983145378007
Google OAuth Redirect: https://dzakugrwxzsadglntxnm.supabase.co/functions/v1/google-calendar/google-callback
```

---

## ⏱️ Expected Timeline

- **Fix 1 (SQL):** 5 minutes
- **Fix 2 (Secrets):** 10 minutes  
- **Fix 3 (Google):** 10 minutes + 5--10 min wait
- **Fix 4 (Testing):** 5 minutes
- **Total:** ~35-45 minutes

---

## ✨ After Everything Works

When session scheduling works in production:
1. Users can schedule sessions on Vercel just like on localhost
2. Google Meet links are automatically generated
3. Sessions are saved in the database
4. Everything syncs in real-time

Go ahead and follow Fix 1 → Fix 2 → Fix 3 → Fix 4 in order. Let me know if you get stuck on any step!
