# Message Sending Troubleshooting Guide

## If you're getting "Failed to send message" error:

### Step 1: Check Supabase Tables
Make sure these SQL files have been executed in your Supabase SQL editor:
1. ✅ CREATE_SWAPS_TABLE.sql
2. ✅ CREATE_MESSAGES_TABLE.sql
3. ✅ CREATE_NOTIFICATIONS_TABLE.sql

### Step 2: Verify RLS Policies
In Supabase Dashboard:
1. Go to Authentication > Policies
2. For "messages" table, check these policies exist:
   - ✅ messages_view_own (SELECT)
   - ✅ messages_insert_own (INSERT)
   - ✅ messages_update_own (UPDATE)

### Step 3: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try sending a message
4. Look for error message and share it

### Step 4: Common Issues

**Issue 1: "Missing table"**
- Solution: Run CREATE_MESSAGES_TABLE.sql in Supabase SQL editor

**Issue 2: "RLS policy error"**
- Solution: Make sure auth.uid() is working (user is logged in)

**Issue 3: "Invalid UUID"**
- Solution: Make sure currentUser.id is not null

**Issue 4: "FK constraint failed"**
- Solution: Check that receiver_id (otherUserId) is valid

### Step 5: Debug Steps
1. Open Supabase Dashboard → Messages table
2. Try to manually insert a test message:
   ```sql
   INSERT INTO messages (sender_id, receiver_id, content)
   VALUES ('your-uuid', 'receiver-uuid', 'Test message');
   ```
3. If this works, issue is in code logic
4. If this fails, issue is in database/RLS

### Step 6: Check Current User
In Messages.tsx, the currentUser should have an id. If not:
- User might not be logged in
- Auth session might be expired
- Try logging out and back in

