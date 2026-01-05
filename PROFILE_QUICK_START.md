# QUICK START - User Profile System Setup

## 🚀 3-Step Setup

### Step 1: Create Database Table (2 minutes)

1. Open **Supabase Dashboard**
2. Go to **SQL Editor** → Click **"New Query"**
3. Copy entire content from `CREATE_USER_PROFILES_TABLE.sql`
4. Paste into SQL editor
5. Click **"Run"** button
6. ✅ Done! Table created with timezones

### Step 2: Test Settings Page (5 minutes)

1. Open app in browser
2. Go to `/settings` page
3. You should see:
   - Full Name input
   - City input
   - Country input
   - **Timezone dropdown** (loads from database)
   - Bio textarea
   - Languages input
   - Availability input
   - Skills You Offer textarea
   - Skills You Want textarea

4. **Edit any field** (example: change name)
5. Click **"Save Changes"** button
6. ✅ See success toast

### Step 3: Verify Database (2 minutes)

1. Go to **Supabase Dashboard**
2. **Table Editor** → Select `user_profiles`
3. Look for your user's row
4. Verify the name changed ✅
5. Check `updated_at` timestamp updated ✅

---

## 📋 Files You Need

### SQL Files (Copy to Supabase)
- `CREATE_USER_PROFILES_TABLE.sql` - **RUN THIS FIRST**

### Code Files (Already Updated)
- `src/lib/profileService.ts` - Profile service
- `src/pages/Settings.tsx` - Settings page UI

### Documentation
- `USER_PROFILE_SETUP_GUIDE.md` - Full guide
- `USER_PROFILES_QUERIES.sql` - SQL examples
- This file - Quick start

---

## 🎯 What Gets Synced to Database

When you click **"Save Changes"** in Settings:

| Field | Database Column | Synced? |
|-------|-----------------|---------|
| Full Name | `full_name` | ✅ Yes |
| Bio | `bio` | ✅ Yes |
| City | `city` | ✅ Yes |
| Country | `country` | ✅ Yes |
| Timezone | `timezone` | ✅ Yes |
| Languages | `languages` (array) | ✅ Yes |
| Availability | `availability` | ✅ Yes |
| Skills Offered | `skills_offered` (array) | ✅ Yes |
| Skills Wanted | `skills_wanted` (array) | ✅ Yes |

---

## 🌍 Timezone Dropdown Values

All 27 timezones available:
- UTC-12:00 to UTC+12:00
- Common zones: PST, EST, GMT, IST, JST
- Auto-loaded from database

---

## 💡 Usage Tips

### Adding Multiple Values (Skills, Languages)
```
Comma separated - separate with comma and space:
✅ Good: English, Urdu, French
❌ Bad: English,Urdu,French

Skills:
✅ Good: Web Development, JavaScript, React
❌ Bad: Web Development,JavaScript,React
```

### Timezone Selection
1. Click timezone dropdown
2. All 27 zones appear
3. Select one
4. Saves to database

### What Happens on Save
1. **Loading state** - "Saving..."
2. **Send to database** - Updates user_profiles table
3. **Show toast** - "Profile Updated"
4. **Persist** - Changes saved forever

---

## 🔍 Check if Working

### From Frontend
1. Go to Settings
2. Edit name → Save
3. See "Profile Updated" toast ✅

### From Database
1. Supabase Dashboard
2. Table Editor → user_profiles
3. Find your row
4. Check fields updated ✅

### From Code
```javascript
const profile = await profileService.getProfile(userId);
console.log(profile.full_name); // Should show updated name
```

---

## ⚡ Quick Commands

### Get current user's profile
```javascript
import { profileService } from '@/lib/profileService';
const profile = await profileService.getProfile(userId);
```

### Update a single field
```javascript
await profileService.updateBio(userId, "New bio");
await profileService.updateTimezone(userId, "UTC+05:00");
```

### Add a language
```javascript
await profileService.addLanguage(userId, "French");
```

### Add a skill
```javascript
await profileService.addSkillOffered(userId, "React");
```

---

## ✅ Verification Checklist

- [ ] Ran `CREATE_USER_PROFILES_TABLE.sql` in Supabase
- [ ] Settings page loads without errors
- [ ] Timezone dropdown shows 27 options
- [ ] Can edit name in Settings
- [ ] Can click "Save Changes"
- [ ] See success toast
- [ ] Check Supabase - data updated
- [ ] Refresh page - changes persist
- [ ] Can add skills (comma separated)
- [ ] Can add languages (comma separated)

---

## 🐛 Troubleshooting

### Timezone dropdown empty
- ✅ Check if `CREATE_USER_PROFILES_TABLE.sql` was run
- ✅ Check timezones table exists in Supabase

### Save button doesn't work
- ✅ Check browser console (F12) for errors
- ✅ Verify user is logged in
- ✅ Check Supabase token is valid

### Data not saving
- ✅ Check RLS policies enabled
- ✅ Check user_profiles table exists
- ✅ Verify user is authenticated

### Fields not showing
- ✅ Check Settings.tsx is updated
- ✅ Clear browser cache
- ✅ Restart dev server

---

## 📞 Support

For detailed info see:
- `USER_PROFILE_SETUP_GUIDE.md` - Full documentation
- `USER_PROFILES_QUERIES.sql` - All SQL queries
- `src/lib/profileService.ts` - All functions available

---

## 🎉 What's Included

✅ User profiles table with all fields
✅ 27 global timezones dropdown
✅ Automatic timestamp updates
✅ Row Level Security (RLS)
✅ Array fields for languages and skills
✅ Real-time database sync
✅ Complete frontend integration
✅ Error handling
✅ Loading states
✅ 25+ SQL query examples

---

## 🚀 You're Ready!

1. Run the SQL script
2. Go to Settings
3. Update your profile
4. Data saves automatically to database
5. All changes reflected everywhere

**Enjoy your profile system!** 🎉
