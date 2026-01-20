# Profile Image Update - Quick Start Testing

**Status:** ✅ READY TO TEST  
**Version:** 1.0

---

## What Was Fixed

✅ **Profile image now updates properly**  
✅ **Image changes reflect everywhere in app** (Navbar, Profile, Swaps, etc.)  
✅ **Updates happen in real-time without page refresh**  
✅ **Proper error handling for failures**

---

## Quick Test (2 minutes)

### Step 1: Go to Settings
1. Click your profile icon in Navbar
2. Click "Settings"
3. Go to "Profile" tab

### Step 2: Upload New Image
1. Click camera icon near profile picture
2. Select an image from your computer
3. Preview should show the new image
4. Click "Save Changes"

### Step 3: Verify Update
✅ **Navbar** - Your profile image updates instantly  
✅ **Settings page** - Image saves and shows success message  
✅ **No page refresh needed**

---

## Detailed Test (5 minutes)

### Test 1: Image Upload
```
1. Open Settings → Profile tab
2. Click camera icon
3. Select image file
4. Image preview shows locally
5. Click "Save Changes"
6. Wait for "Profile Updated" toast
7. Check database: profile_image_url has new URL
✅ PASS: Image uploaded and saved
```

### Test 2: Navbar Sync
```
1. After image upload
2. Check Navbar profile picture
3. Should show NEW image (not old)
4. No page refresh needed
✅ PASS: Navbar syncs instantly
```

### Test 3: Multiple Pages
```
1. Open two browser windows
2. Window 1: Go to Settings
3. Window 2: Go to Dashboard
4. In Window 1: Upload new image
5. Watch Window 2 Navbar update
6. Should sync in < 2 seconds
✅ PASS: Real-time sync works
```

### Test 4: User Profile Page
```
1. After image update
2. Navigate to your Profile (click name)
3. Profile picture should be NEW
4. Should not show old image
✅ PASS: UserProfile page syncs
```

### Test 5: Swaps Page
```
1. After image update
2. Go to Swaps page
3. Your swap cards should show NEW image
4. Check created_by profile picture
✅ PASS: Swaps page syncs
```

---

## Advanced Tests

### Test 6: Error Handling
```
1. Select image > 10MB
2. Try to upload
3. Should show error message
4. Profile should NOT update
✅ PASS: Error handling works
```

### Test 7: Network Simulation
```
1. Open DevTools → Network tab
2. Set throttle to "Slow 3G"
3. Upload image
4. Watch network tab
5. Should still update (might take 5-10s)
✅ PASS: Works on slow network
```

### Test 8: Rapid Changes
```
1. Upload image (don't wait)
2. Upload another image
3. Both should queue and process
4. Final image should be the last one
✅ PASS: Handles rapid updates
```

---

## Verification Checklist

### Before Testing
- [ ] You're logged into the app
- [ ] You have Settings page access
- [ ] Browser DevTools available
- [ ] Small image file ready (< 5MB)

### During Testing
- [ ] Watch for console errors (F12)
- [ ] Check network tab for failures
- [ ] Verify timestamps in database
- [ ] Note timing of updates

### After Testing
- [ ] Image persists after page reload
- [ ] Image shows in all pages
- [ ] No errors in console
- [ ] Toast messages clear and helpful

---

## Success Criteria

### ✅ Image Upload Works
- File selected from picker
- Preview shows locally
- Uploads without errors
- Database updated

### ✅ Navbar Updates Instantly
- No page refresh needed
- Image changes in < 1 second
- Name also updates if changed
- Works across page navigation

### ✅ All Pages Sync
- UserProfile page shows new image
- Swaps page shows new image
- User cards show new image
- All without page refresh

### ✅ Error Handling Works
- Upload failure shows error
- Error message is clear
- User can retry upload
- Profile not corrupted

---

## Console Debugging

### Check for Success
Open browser DevTools (F12 → Console):

```javascript
// Should see these logs
"DEBUG - User authenticated: [user-id]"
"DEBUG - Image uploaded successfully"
"DEBUG - Update successful"
"Profile update received: [profile-data]"
```

### Check for Errors
```javascript
// Look for any of these errors:
"Error uploading image:"
"Error updating profile:"
"Error updating database:"
"Upsert error:"
```

---

## Database Verification

### Verify Image URL Saved
In Supabase Dashboard:

```sql
-- Run this query
SELECT 
  id, 
  full_name, 
  profile_image_url, 
  updated_at 
FROM user_profiles 
WHERE id = '[your-user-id]';
```

Should show:
- ✅ profile_image_url filled with real URL
- ✅ URL is from storage (contains timestamp)
- ✅ updated_at is recent timestamp

---

## Storage Verification

### Verify File in Storage
In Supabase Dashboard → Storage:

```
user-profiles/
  └─ [user-id]/
     └─ [user-id]-[timestamp].jpg  ← Should exist
```

---

## Troubleshooting

### Image Not Uploading?

**Check 1: File size**
```
- Max: 5MB
- Recommended: < 1MB
- If too large: Compress first
```

**Check 2: File type**
```
- Accepted: JPEG, PNG, GIF
- Not accepted: SVG, WEBP (old browser)
```

**Check 3: Permissions**
```
- User must be logged in
- User must have Settings access
- RLS policies must allow upload
```

### Image Not Showing?

**Check 1: URL correct?**
```
- Open profile_image_url in new tab
- Should show image
- If 404: File missing from storage
```

**Check 2: Cache issue?**
```
- Hard refresh: Ctrl+Shift+R (Windows)
- Hard refresh: Cmd+Shift+R (Mac)
- Clear localStorage: DevTools → Application
```

**Check 3: Subscription working?**
```
- Open DevTools → Network tab
- Filter: "supabase"
- Should see postgres_changes messages
```

### Navbar Not Updating?

**Check 1: Hook initialized?**
```javascript
// In Navbar.tsx
// Should see profile data in component
console.log('Profile:', profile);
```

**Check 2: Event dispatched?**
```javascript
// In browser console
window.addEventListener('profileUpdated', (e) => {
  console.log('Profile updated:', e.detail);
});
```

---

## Performance Expectations

| Operation | Expected Time |
|-----------|---|
| Image preview | Instant |
| Upload 500KB | 1-2 seconds |
| Database update | 1-2 seconds |
| Navbar update | < 1 second |
| All pages sync | < 2 seconds |

---

## Success Metrics

### ✅ Ready to Deploy When:
- [ ] Image uploads successfully
- [ ] Navbar updates without refresh
- [ ] All pages sync correctly
- [ ] No errors in console
- [ ] Works on 3G network
- [ ] Error handling works

### ⏸️ Needs More Work If:
- [ ] Image upload fails
- [ ] Navbar doesn't update
- [ ] Pages don't sync
- [ ] Console shows errors
- [ ] Updates take > 10 seconds

---

## Rollback Plan

If something goes wrong:

1. **Stop using new code** - Don't deploy
2. **Check database** - Verify no corruption
3. **Clear browser cache** - Remove temp data
4. **Review logs** - Find error cause
5. **Run tests again** - Verify fix

---

## Quick Reference

### Files Changed
- ✅ src/hooks/useProfileUpdates.ts (new)
- ✅ src/lib/cacheUtils.ts (new)
- ✅ src/components/layout/Navbar.tsx (updated)
- ✅ src/pages/Settings.tsx (updated)
- ✅ src/pages/UserProfile.tsx (updated)

### Key Functions
- `useProfileUpdates()` - Real-time profile hook
- `uploadAndUpdateProfileImage()` - Upload + save
- `clearProfileCaches()` - Cache cleanup
- `dispatchProfileUpdate()` - Event dispatch

---

## Support

**Still having issues?**

1. Check this guide's Troubleshooting section
2. Review PROFILE_IMAGE_UPDATE_FIX.md (detailed docs)
3. Check browser console for error messages
4. Verify database state in Supabase dashboard
5. Test on different browser/device

---

**Ready to test!** 🚀

Follow the Quick Test steps above to verify the fix works in your environment.
