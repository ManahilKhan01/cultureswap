# AI Assistant Chat - Troubleshooting Guide

## Issue: "Failed to open assistant chat"

### Problem Description
User clicks "Start Assistant Chat" button but gets an error toast notification.

### Root Causes & Solutions

---

## Solution 1: Check Browser Console

**Steps:**
1. Open Developer Tools (`F12` or `Ctrl+Shift+I`)
2. Go to `Console` tab
3. Look for error messages
4. Check for logs from the assistant service

**What to Look For:**

```
✓ "Assistant profile obtained:"
✓ "Conversation ID:"
✓ "Messages loaded: X"

✗ "Error getting conversation"
✗ "Foreign key violation"
✗ "No authenticated user found"
```

---

## Solution 2: Verify User is Logged In

**Issue:** "Please log in first" error

**Fix:**
1. Make sure you're logged in to CultureSwap
2. Refresh the page
3. Try "Start Assistant Chat" again

---

## Solution 3: Database Permission Issue

**Error:** Foreign key constraint or RLS policy error

**This is now FIXED in the latest version:**
- Assistant messages are now handled client-side
- No database writes required for assistant responses
- Conversations use existing messageService fallback

**If you still get this error:**
1. Check your Supabase RLS policies
2. Ensure `conversations` table allows INSERT
3. Check that `user1_id` and `user2_id` columns accept UUIDs

---

## Solution 4: Assistant Profile Not Found

**Error:** "Assistant profile could not be linked"

**This should be handled automatically now:**
- If assistant profile can't be created, system uses virtual profile
- Virtual profiles work fine for client-side display

**To verify:**
1. Check browser console for: `"Assistant profile obtained:"`
2. Look for assistant ID: `"00000000-0000-4000-a000-000000000001"`
3. Virtual profiles will have `is_assistant: true`

---

## Solution 5: Conversation Creation Failed

**Error:** "Conversation creation returned no data"

**Fix Applied:**
- Uses `maybeSingle()` instead of `single()`
- Fallback to messageService.getOrCreateConversation()
- Better error logging

**If still failing:**
1. Check that `conversations` table exists
2. Verify columns: `id`, `user1_id`, `user2_id`, `created_at`
3. Check RLS policies on conversations table

---

## Solution 6: Message Service Fallback

**What happens now:**
1. Try to create conversation in `conversations` table
2. If that fails, fall back to `messageService.getOrCreateConversation()`
3. This uses the standard message pathway

**This is SAFER because:**
- Uses existing tested code
- Avoids complex UUID constraints
- Works with real auth users

---

## Manual Testing Steps

### Test 1: Open Assistant Chat
```
1. Click menu (⋮) in Messages
2. Look for "Start Assistant Chat" button
3. Should appear at top of menu (in blue)
4. Click it
```

**Expected:**
- Menu closes
- Chat switches to assistant
- Blue-themed chat loads
- Robot emoji visible
- No error toast

**If error:**
- Note exact error message
- Check console for detailed error
- Try Test 2

### Test 2: Check Console Logs
```
1. Press F12 to open developer tools
2. Click "Console" tab
3. Click menu → "Start Assistant Chat"
4. Watch for console output
```

**Expected output sequence:**
```
"Assistant profile obtained: {id: '...', full_name: 'CultureSwap Assistant'}"
"Conversation ID: uuid-here"
"Messages loaded: 0"
"Success: Assistant chat opened"
```

**If you see errors:**
- Copy the error message
- Check corresponding solution below

### Test 3: Network Tab
```
1. Open DevTools Network tab
2. Clear network history
3. Click "Start Assistant Chat"
4. Watch API calls
```

**Expected calls:**
1. GET `/rest/v1/user_profiles?...` - Fetch assistant profile
2. GET `/rest/v1/conversations?...` - Check existing conversation
3. POST `/rest/v1/conversations` - Create new conversation (if needed)
4. GET `/rest/v1/messages?...` - Load messages

**If request fails:**
- Check status code (should be 200 or 201)
- Check response error details

---

## Common Error Messages & Fixes

### "Cannot POST /rest/v1/conversations: 403 Forbidden"
**Cause:** RLS policy preventing INSERT  
**Fix:** Check Supabase RLS policies on conversations table

### "relation 'conversations' does not exist"
**Cause:** Table not created  
**Fix:** Run `CREATE_CONVERSATIONS_TABLE.sql` migration

### "foreign key violation"
**Cause:** UUID doesn't exist in auth.users  
**Fix:** Now handled - system uses virtual profile if needed

### "No authenticated user found"
**Cause:** User not logged in  
**Fix:** Log in first, then try again

### "PGRST116: No rows found"
**Cause:** Query returned no results  
**Fix:** This is OK - means no existing conversation, will create new one

---

## Debug Mode

### Enable Extra Logging

Add this to `src/lib/aiAssistantService.ts` for debugging:

```typescript
const DEBUG = true;

const log = (msg: any, data?: any) => {
  if (DEBUG) {
    console.log(`[ASSISTANT] ${msg}`, data || '');
  }
};
```

Then replace `console.log` calls with `log()`

### Check Assistant Detection

In Messages.tsx console:
```javascript
// Check if profile is detected as assistant
aiAssistantService.isAssistantProfile({
  full_name: 'CultureSwap Assistant',
  email: 'assistant@cultureswap.app'
})
// Should return: true
```

---

## Network Issues

### Slow Response
**Issue:** Takes 5+ seconds to open assistant chat

**Causes:**
- Network latency
- Database query slow
- Too many attachments to load

**Fix:**
- Check internet speed
- Clear browser cache
- Refresh page

### Connection Timeout
**Issue:** Request hangs or times out

**Fix:**
1. Check internet connection
2. Refresh the page
3. Try in incognito mode

---

## Browser Compatibility

### Tested On:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### If Not Working:
1. Try different browser
2. Clear browser cache and cookies
3. Check browser console for errors

---

## Need More Help?

### Collect Information:
1. Browser: (Chrome, Firefox, Safari, etc.)
2. Error message (exact text)
3. Console logs (screenshot or text)
4. Network errors (if any)
5. Steps to reproduce

### Check:
- Are you logged in? ✓
- Is Messages page loading? ✓
- Can you send regular messages? ✓
- Do other filters work? ✓

---

## Latest Changes (Fixed Issues)

### ✅ Fixed Foreign Key Constraint
- Assistant messages now handled client-side
- No database writes required for AI responses
- Uses virtual message objects

### ✅ Fixed Profile Creation
- Uses `maybeSingle()` instead of `single()`
- Better error handling
- Virtual profile fallback

### ✅ Fixed Conversation Creation
- Added fallback to messageService
- Better error logging
- Handles missing auth user

### ✅ Added Error Context
- Better error messages
- Detailed console logging
- Fallback mechanisms at each step

---

## Quick Checklist

Before reporting issues:

- [ ] I am logged in
- [ ] I can see the Messages page
- [ ] The menu icon (⋮) is visible
- [ ] I can open other filters (Unread, Starred, etc.)
- [ ] Opened browser Developer Tools (F12)
- [ ] Checked Console tab for errors
- [ ] Tried in incognito/private mode
- [ ] Refreshed the page
- [ ] Tried another browser

If all checked and still fails, collect console logs for debugging.

---

**Status:** Latest version includes all fixes  
**Last Updated:** January 19, 2026
