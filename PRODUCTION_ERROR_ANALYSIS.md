# Production Error Flow Analysis

## What's Happening When You Get "Edge Function returned a non-2xx status code"

Here's the exact sequence of events that leads to your error:

---

## 🔴 The Error Flow

### User Action
```
You click: Schedule Next Session → Select Date/Time → Click "Schedule"
```

### Step 1: Frontend calls sessionService.createSession()
**File:** `src/lib/sessionService.ts` (Line 11)

```typescript
const { data: meetData, error: meetError } = await supabase.functions.invoke('google-calendar/create-meeting', {
    body: {
        summary: 'CultureSwap Session',
        start_time: sessionData.scheduled_at,
        duration_minutes: 60
    }
});
```

✅ **Status:** Works fine (frontend code is correct)

---

### Step 2: Supabase Edge Function Receives Request
**File:** `supabase/functions/google-calendar/index.ts` (Line 151)

```typescript
if (path === "create-meeting") {
    const user = await getAuthUser(req);  // ✅ Auth passes
```

✅ **Status:** User is authenticated (this works)

---

### Step 3: 🔴 FIRST DATABASE CHECK FAILS
**File:** `supabase/functions/google-calendar/index.ts` (Line 157-162)

```typescript
const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from("google_tokens")           // ❌ TABLE DOESN'T EXIST IN PRODUCTION
    .select("*")
    .eq("user_id", user.id)
    .single();

if (tokenError || !tokenData) {
    return new Response(
        JSON.stringify({ error: "Google account not connected" }), 
        { status: 400 }  // ❌ Returns 400 status code
    );
}
```

❌ **Why it fails:**
- The `google_tokens` table was **never created** in your production database
- Supabase returns error: `relation "public.google_tokens" does not exist`
- Edge function catches this and returns a 400 error
- Frontend sees "Edge Function returned a non-2xx status code"

---

## 🔍 Why It Works on Localhost

On your localhost development environment:

1. **Database might be different** (local Supabase emulator vs cloud)
2. **Tables might be auto-created** from migrations
3. **Environment variables might be loaded differently**
4. **RLS (Row Level Security) might be disabled** locally

But in production on Vercel:
- It uses your **cloud Supabase database** (`dzakugrwxzsadglntxnm`)
- All tables must **explicitly exist**
- Missing table = immediate failure

---

## 📊 Data Chain That Should Happen

```
USER SCHEDULE SESSION
    ↓
Frontend: sessionService.createSession()
    ↓
Edge Function: POST /google-calendar/create-meeting
    ↓
Check google_tokens table ← 🔴 FAILS HERE (Table doesn't exist)
    ↓
Query Google Calendar API  (Never reached)
    ↓
Generate Meet link         (Never reached)
    ↓
Return Meet link to frontend (Never reached)
    ↓
Save session to swap_sessions table (Never reached)
    ↓
Toast: "Session Scheduled" (Never shown)
```

---

## ❌ All the Missing Pieces in Production

| Component | Status | Impact |
|-----------|--------|--------|
| `google_tokens` table | ❌ Missing | Edge function fails immediately |
| `SUPABASE_SERVICE_ROLE_KEY` secret | ❌ Not set | Can't query database with elevated privileges |
| `SUPABASE_URL` secret | ❌ Not set | Can't connect to Supabase instance |
| `SUPABASE_ANON_KEY` secret | ❌ Not set | Can't query Supabase |
| `GOOGLE_CLIENT_ID` secret | ✅ Set | (provided by you) |
| `GOOGLE_CLIENT_SECRET` secret | ✅ Set | (provided by you) |
| `GOOGLE_REDIRECT_URI` secret | ✓ Set | (provided by you) |
| `FRONTEND_URL` secret | ❌ Wrong | Still points to localhost:8080 |

---

## 🎯 Exact Error Points

### In Supabase Logs (you'll see):

```
Edge Function Error: 
  error: "relation "public.google_tokens" does not exist"
  code: "42P01"  
  timestamp: 2026-02-19T...
```

### In Browser Console (you'll see):

```javascript
{
  data: null,
  error: {
    message: "Edge function error occurred",
    status: 400,
    error: "Google account not connected"
  }
}
```

### On Your Frontend (you'll see):

<img src="..." />  
Toast: ⚠️ "Error: Failed to generate Google Meet link"

---

## 🔧 Why This Worked on Localhost

### Hypothesis 1: Local Supabase Might Be Different
- You might be using a local Supabase emulator
- Or pointing to a test database that has the table

### Hypothesis 2: Lazy Table Creation
- Some development setups auto-create tables on first use
- Production Supabase doesn't have this feature

### Hypothesis 3: Environment Variables Loaded Differently
- Local: from `.env` file (Vite loads these)
- Production: must be set in Supabase dashboard separately

---

## ✅ What Needs to Change

### 1. **Database Schema** (Production)
```
Current: google_tokens table = ❌ MISSING
Fixed:  google_tokens table = ✅ CREATED
```

### 2. **Supabase Secrets** (Deployment Config)
```
Current: 0 of 7 secrets set = ❌
Fixed:  7 of 7 secrets set = ✅
```

### 3. **Frontend URL** (Deployment Config)
```
Current: FRONTEND_URL = http://localhost:8080
Fixed:  FRONTEND_URL = https://cultureswap.vercel.app
```

### 4. **Google OAuth URLs** (Google Cloud Console)
```
Current: Localhost only = ❌
Fixed:  Vercel domain + localhost = ✅
```

---

## 📋 The Three Categories of Issues

### Category A: **Missing Infrastructure** (CRITICAL)
- ❌ `google_tokens` table doesn't exist
- ❌ Supabase secrets not configured
- **Impact:** Edge function fails immediately

### Category B: **Wrong Configuration** (HIGH)
- ❌ `FRONTEND_URL` points to localhost
- ❌ Google OAuth isn't configured for Vercel domain
- **Impact:** OAuth flow fails or redirects to wrong place

### Category C: **Code Issues** (LOW)
- ✅ `sessionService.ts` is correct
- ✅ Edge function code is correct
- ✅ Frontend code is correct
- **Impact:** None (code is fine, infrastructure is broken)

---

## 🚀 After You Fix It

The flow will work like this:

```
USER SCHEDULE SESSION
    ↓
Frontend: sessionService.createSession()
    ↓
Edge Function: POST /google-calendar/create-meeting
    ↓
✅ Load user from auth token
    ↓
✅ Query google_tokens table (FOUND!)
    ↓
✅ Get user's Google access token
    ↓
✅ Call Google Calendar API
    ↓
✅ Create calendar event with Google Meet link
    ↓
✅ Return { meetLink, eventId }
    ↓
✅ Save session to swap_sessions table
    ↓
✅ Show toast: "Session Scheduled with Google Meet"
    ↓
✅ User can click meet link and join video call
```

---

## 🎓 Key Learning

**The same code that works locally fails in production because:**

> Infrastructure and configuration are missing, not because the code is wrong.

This is why it's crucial to:
1. Create all required database tables before deploying
2. Set all required environment variables in production
3. Update all external service configurations (Google OAuth, etc.)
4. Test the full flow in production after deployment
