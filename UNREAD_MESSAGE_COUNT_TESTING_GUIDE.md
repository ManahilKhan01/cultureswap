# Unread Message Count - Testing Guide

**Status:** ✅ READY FOR TESTING  
**Date:** January 20, 2026  
**Version:** 1.0  

---

## Test Environments

### Prerequisites:
- [ ] Application running locally or deployed
- [ ] Database populated with test users
- [ ] Two test user accounts (for message exchange)
- [ ] Browser dev tools open for monitoring

### Setup:
```bash
# 1. Create test users
- User A: test_user_a@example.com
- User B: test_user_b@example.com

# 2. Open two browser windows
- Window 1: Logged in as User A
- Window 2: Logged in as User B

# 3. Enable browser network monitor
- F12 → Network tab
- Watch for Supabase subscription messages
```

---

## Unit Test Suite

### Test 1: Initial Load
**Goal:** Verify unread count loads correctly on app startup

**Steps:**
1. [ ] Create 5 unread messages from User B to User A
2. [ ] Login as User A
3. [ ] Check Navbar badge displays "5"

**Expected Result:**
- ✅ Badge shows correct count immediately
- ✅ No page refresh needed
- ✅ Count loads within 2 seconds

**Test Data:**
```sql
-- In test database
INSERT INTO messages (sender_id, receiver_id, conversation_id, content, read)
VALUES 
  ('user_b_id', 'user_a_id', 'conv_1', 'Message 1', false),
  ('user_b_id', 'user_a_id', 'conv_1', 'Message 2', false),
  ('user_b_id', 'user_a_id', 'conv_2', 'Message 3', false),
  ('user_b_id', 'user_a_id', 'conv_2', 'Message 4', false),
  ('user_b_id', 'user_a_id', 'conv_2', 'Message 5', false);
```

---

### Test 2: Auto-Read on Chat Open
**Goal:** Verify messages are marked as read when chat is opened

**Steps:**
1. [ ] Start with 3 unread messages in Conversation 1
2. [ ] Navbar shows "3"
3. [ ] Click on Conversation 1 to open
4. [ ] Observe count decrease

**Expected Result:**
- ✅ Count updates to "0" within 1 second
- ✅ All 3 messages marked as read in database
- ✅ No page refresh
- ✅ No flickering

**Verification:**
```sql
-- After opening chat, verify all marked as read
SELECT * FROM messages 
WHERE conversation_id = 'conv_1' 
AND receiver_id = 'user_a_id'
AND read = true;  -- Should return 3 rows
```

---

### Test 3: Real-Time New Message
**Goal:** Verify count increases when message arrives in real-time

**Steps:**
1. [ ] User A has 0 unread messages
2. [ ] Navbar shows "0" or no badge
3. [ ] User B sends message to User A
4. [ ] Observe Navbar in User A's window

**Expected Result:**
- ✅ Badge appears with "1" within 2 seconds
- ✅ No manual refresh
- ✅ Smooth appearance (no flickering)

**Test Procedure:**
```
Window 1: User A (logged in, on home page)
  - Navbar badge: (none)
  
Window 2: User B
  - Open conversation with User A
  - Type: "Test message"
  - Send message

Window 1: User A
  - Verify badge shows "1"
  - Timeline: Should appear within 2 seconds
```

---

### Test 4: Multiple Conversations
**Goal:** Verify independent tracking of multiple conversations

**Steps:**
1. [ ] Create 2 unread from User B in Conversation 1
2. [ ] Create 3 unread from User B in Conversation 2
3. [ ] Navbar shows "5"
4. [ ] Open Conversation 1

**Expected Result:**
- ✅ After opening Conversation 1:
  - Count updates to "3" (only Conversation 2 remains)
  - Conversation 1 marked as read
  - Conversation 2 unaffected

**Detailed Steps:**
```
1. Setup: Create test messages
   - Conv 1: 2 unread messages from User B
   - Conv 2: 3 unread messages from User B
   - Total: 5 unread

2. Navbar displays: "5"

3. Open Conversation 1
   - Count immediately → "3"
   - All 2 messages in Conv 1 marked as read
   - Conv 2 remains unread

4. Open Conversation 2
   - Count immediately → "0"
   - All 3 messages in Conv 2 marked as read
   - No more unread
```

---

### Test 5: Partial Read
**Goal:** Verify partial marking as read doesn't affect other chats

**Steps:**
1. [ ] Setup:
   - Conv A: 5 unread messages
   - Conv B: 3 unread messages
   - Total: 8 unread

2. [ ] Open Conv A (should show 3 after)
3. [ ] Check Conv B still shows 3 unread

**Expected Result:**
- ✅ Opening Conv A only affects Conv A
- ✅ Conv B count remains independent
- ✅ Can verify in UI or database

---

### Test 6: Received While Chat Open
**Goal:** Verify new messages marked as read when received while chat open

**Setup:**
1. [ ] Open Conversation 1 (no unread)
2. [ ] Navbar shows "0"

**Steps:**
1. [ ] While Conversation 1 is open:
2. [ ] User B sends message to User A
3. [ ] Observe the message in Conversation 1
4. [ ] Check Navbar count

**Expected Result:**
- ✅ Message appears in Conversation 1
- ✅ Navbar still shows "0" (auto-marked as read)
- ✅ Message doesn't trigger unread count increase
- ✅ Message marked as `read = true` in database

---

### Test 7: Navigation Persistence
**Goal:** Verify count persists when navigating pages

**Setup:**
1. [ ] 5 unread messages waiting
2. [ ] Navbar shows "5"

**Steps:**
1. [ ] Click on "Profile" page
2. [ ] Navbar still visible
3. [ ] Check Navbar count (should be "5")
4. [ ] Click on "Settings" page
5. [ ] Check Navbar count again

**Expected Result:**
- ✅ Count remains "5" across all pages
- ✅ No flickering or resetting
- ✅ Subscriptions maintain state

---

### Test 8: Browser Tab Switching
**Goal:** Verify count accurate when switching between browser tabs

**Steps:**
1. [ ] Open two tabs, both logged in as User A
2. [ ] Tab 1: Home page (Navbar shows "0")
3. [ ] Tab 2: Profile page (Navbar shows "0")
4. [ ] User B sends message (in separate window)
5. [ ] Switch to Tab 1

**Expected Result:**
- ✅ Both tabs show count "1"
- ✅ Both tabs synced in real-time
- ✅ No refresh needed

---

### Test 9: Re-Opening Chat
**Goal:** Verify count behavior when re-opening read chat

**Setup:**
1. [ ] 3 unread messages in Conversation 1
2. [ ] Count shows "3"
3. [ ] Open Conversation 1 → count → "0"

**Steps:**
1. [ ] While Conversation 1 is open, don't switch
2. [ ] Manually refresh the page (F5)
3. [ ] Conversation 1 should still be open
4. [ ] Check Navbar count

**Expected Result:**
- ✅ Count shows "0" after refresh
- ✅ All messages still marked as read
- ✅ No errors in console

---

### Test 10: Unread to Read Toggle
**Goal:** Verify marking message read twice doesn't cause issues

**Steps:**
1. [ ] Message status: `read = false`
2. [ ] Count increases to "1"
3. [ ] Mark as read → `read = true`
4. [ ] Count decreases to "0"
5. [ ] Mark as unread → `read = false` (if applicable)
6. [ ] Count increases to "1"

**Expected Result:**
- ✅ Count updates correctly in both directions
- ✅ No race conditions
- ✅ Database stays consistent

---

## Integration Tests

### Test 11: Full User Journey
**Goal:** Test complete message lifecycle

**Scenario:**
```
1. User A logs in
   └─ Navbar: 0 unread

2. User B sends 5 messages to User A
   └─ Navbar: 5 unread (appears within 2s)

3. User A opens Conversation
   └─ Navbar: 0 unread (within 1s)
   └─ All messages marked as read

4. User A navigates to Profile page
   └─ Navbar: Still 0 unread

5. User B sends 1 more message
   └─ Navbar: 1 unread (within 2s)

6. User A opens Conversation again
   └─ Navbar: 0 unread (within 1s)

7. User A opens different Conversation
   (no new messages)
   └─ Navbar: Still 0 unread
```

**Validation Points:**
- ✅ Each step happens smoothly
- ✅ No errors in console
- ✅ No page flicker
- ✅ Timing < 2 seconds for each update

---

### Test 12: Multi-User Scenario
**Goal:** Verify system works with multiple users

**Setup:**
- [ ] User A, User B, User C (all logged in simultaneously)

**Steps:**
1. [ ] User A: 0 unread
2. [ ] User B: 0 unread
3. [ ] User C: 0 unread

4. [ ] User B sends to User A (1 message)
5. [ ] User C sends to User A (2 messages)
6. [ ] User B sends to User C (1 message)

**Check:**
```
User A: Should see 3 unread
User B: Should see 0 unread (sent messages, didn't receive)
User C: Should see 1 unread
```

**Expected Result:**
- ✅ Each user sees only their unread
- ✅ No cross-contamination
- ✅ Counts independent

---

## Performance Tests

### Test 13: Large Volume
**Goal:** Verify system handles many unread messages

**Setup:**
1. [ ] Create 50 unread messages from User B to User A
2. [ ] Across 5 different conversations
3. [ ] Each conversation: 10 unread

**Steps:**
1. [ ] Login as User A
2. [ ] Measure time to load count (should be < 2s)
3. [ ] Open a conversation
4. [ ] Measure time to mark 10 as read (should be < 1s)
5. [ ] Check Navbar update speed

**Expected Result:**
- ✅ Initial load: < 2 seconds
- ✅ Mark as read: < 1 second
- ✅ No lag or freezing
- ✅ UI remains responsive

**Performance Benchmarks:**
```
Metric                    Target    Acceptable
─────────────────────────────────────────────
Initial count load        < 1.5s    < 2s
Real-time msg arrival     < 1s      < 2s
Mark conv as read         < 0.5s    < 1s
Navbar update render      < 100ms   < 200ms
Per-conversation lookup   < 50ms    < 100ms
```

---

### Test 14: Rapid Switching
**Goal:** Verify system handles rapid conversation switching

**Setup:**
1. [ ] Create 3 conversations with 3 unread each
2. [ ] Total: 9 unread

**Steps:**
```
1. Open Conv 1 (expected: count → 6)
   Wait 0.1s
2. Open Conv 2 (expected: count → 3)
   Wait 0.1s
3. Open Conv 3 (expected: count → 0)
   Wait 0.1s
4. Open Conv 1 (expected: count → 0, already read)
```

**Expected Result:**
- ✅ Each update processed correctly
- ✅ No race conditions
- ✅ Final count accurate
- ✅ No skipped updates

---

### Test 15: Network Latency Simulation
**Goal:** Verify graceful handling of slow network

**Setup:**
- [ ] Open DevTools Network tab
- [ ] Set to "Slow 3G" or add 2000ms latency

**Steps:**
1. [ ] User B sends message
2. [ ] Monitor Navbar for update
3. [ ] Should still update, just slower

**Expected Result:**
- ✅ Update still occurs (not lost)
- ✅ Eventually consistent
- ✅ No error thrown
- ✅ Delay is acceptable (< 5s)

---

## Edge Case Tests

### Test 16: Null/Empty Cases
**Goal:** Verify system handles empty states

**Cases:**
1. [ ] User with 0 unread → Badge not shown
2. [ ] User with 0 conversations → Navbar still works
3. [ ] User with no Supabase subscription → Graceful fallback

**Expected Result:**
- ✅ No error messages
- ✅ Badge disappears (if > 9)
- ✅ UI doesn't break
- ✅ No console errors

---

### Test 17: Session Persistence
**Goal:** Verify count persists across logout/login

**Steps:**
1. [ ] 5 unread messages
2. [ ] Logout
3. [ ] Login again as User A
4. [ ] Check count

**Expected Result:**
- ✅ Count still shows "5"
- ✅ No lost messages
- ✅ Database reflects truth
- ✅ Fresh subscription created

---

### Test 18: Concurrent Operations
**Goal:** Verify system handles simultaneous operations

**Setup:**
- [ ] Conversation open in Tab 1
- [ ] Message received in Tab 2
- [ ] Both trying to update at same time

**Expected Result:**
- ✅ No conflicts
- ✅ Final state consistent
- ✅ Both tabs synchronized
- ✅ No duplicate counts

---

### Test 19: Delete/Archive Message
**Goal:** Verify system handles deleted messages (if applicable)

**Prerequisites:**
- [ ] Feature: Delete message capability exists

**Steps:**
1. [ ] Message is unread (`read = false`)
2. [ ] Count includes it
3. [ ] Delete the message
4. [ ] Observe count

**Expected Result:**
- ✅ Count updates appropriately
- ✅ If message deleted: count decreases
- ✅ Or: deleted messages excluded from count

---

### Test 20: Blocked User
**Goal:** Verify unread messages from blocked users don't appear (if applicable)

**Prerequisites:**
- [ ] Feature: Block user capability exists

**Steps:**
1. [ ] User A blocks User B
2. [ ] User B sends message
3. [ ] Check User A's unread count

**Expected Result:**
- ✅ Count not affected
- ✅ Message doesn't appear
- ✅ System respects block

---

## Database Verification Tests

### Test 21: Data Consistency
**Goal:** Verify database matches UI

**Steps:**
1. [ ] Note Navbar count (e.g., "5")
2. [ ] Query database directly:
```sql
SELECT COUNT(*) 
FROM messages 
WHERE receiver_id = 'user_a_id' 
AND read = false;
```

**Expected Result:**
- ✅ Database count matches Navbar
- ✅ No discrepancies
- ✅ Data integrity verified

---

### Test 22: RLS Verification
**Goal:** Verify Row-Level Security enforced

**Steps:**
1. [ ] User A logs in
2. [ ] User A cannot see User B's unread counts
3. [ ] User A can only see messages where `receiver_id = user_a_id`
4. [ ] User A cannot update User B's messages

**Expected Result:**
- ✅ RLS policies enforced
- ✅ No data leakage
- ✅ Security maintained

---

## Regression Tests

### Test 23: Existing Chat Functionality
**Goal:** Verify old features still work

- [ ] Send message still works
- [ ] Receive message still works
- [ ] Message timestamps correct
- [ ] Message content displays properly
- [ ] Conversation list updates

**Expected Result:**
- ✅ No regression
- ✅ All existing features intact

---

### Test 24: Navbar Other Elements
**Goal:** Verify other Navbar items not affected

- [ ] Logo still clickable
- [ ] Navigation links work
- [ ] User profile menu works
- [ ] Settings accessible
- [ ] Logout works

**Expected Result:**
- ✅ Badge doesn't interfere
- ✅ Navbar layout intact
- ✅ All elements functional

---

## Browser Compatibility Tests

### Test 25: Cross-Browser
Test on these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Chrome Mobile

**Check Points:**
- ✅ Badge displays correctly
- ✅ Updates appear
- ✅ No console errors
- ✅ Performance acceptable

---

## Mobile Testing

### Test 26: Mobile Device
**Devices:**
- [ ] iPhone
- [ ] Android phone
- [ ] Tablet

**Steps:**
1. [ ] Receive message
2. [ ] Check badge (should be visible)
3. [ ] Open chat
4. [ ] Verify auto-read works
5. [ ] Switch apps and return

**Expected Result:**
- ✅ Badge displays on mobile
- ✅ Touch interactions work
- ✅ Updates smooth on mobile
- ✅ No layout issues

---

## Test Results Template

Use this template to record test results:

```
Test #: [Number]
Test Name: [Name]
Date: [YYYY-MM-DD]
Tester: [Name]
Browser: [Browser + Version]
Environment: [Local/Staging/Production]

Status: [PASS / FAIL / BLOCKED]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Notes:
[Any observations]

Steps to Reproduce:
[If failed, list exact steps]

Attachments:
[Screenshots, logs, etc.]
```

---

## Automation Script (Optional)

### Automated Test Runner:
```typescript
// tests/unreadMessages.test.ts

describe('Unread Message Count', () => {
  beforeEach(() => {
    // Setup test users and messages
  });

  test('displays correct count on load', async () => {
    // Render component
    // Verify count displayed
    // Verify within 2 seconds
  });

  test('marks as read when chat opens', async () => {
    // Setup: 3 unread
    // Open chat
    // Wait for update
    // Assert count = 0
  });

  test('updates in real-time', async () => {
    // Start with 0
    // Send message
    // Wait for subscription
    // Assert count = 1
  });

  // ... more tests
});
```

---

## Sign-Off

### Test Approval Criteria:
- [ ] All 26 tests PASS
- [ ] No critical issues found
- [ ] Performance meets benchmarks
- [ ] No console errors
- [ ] Cross-browser working
- [ ] Mobile working
- [ ] Database verified

### Ready for Production:
- [ ] All tests passed
- [ ] Performance validated
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team reviewed

---

**Testing Status:** READY  
**Date:** January 20, 2026  
**Version:** 1.0
