# User Profile Management Setup Guide

## Overview
Complete user profile schema with automatic database sync. All changes made in the Settings page are immediately saved to the database and reflected across the app.

---

## Step 1: Create the User Profiles Table

1. Go to **Supabase Dashboard → SQL Editor**
2. **Create a New Query**
3. **Copy and run** `CREATE_USER_PROFILES_TABLE.sql`

This creates:
- `user_profiles` table with all profile fields
- `timezones` reference table with 27 global timezones
- Row Level Security (RLS) policies
- Auto-update timestamp trigger

---

## Step 2: Profile Fields

### User Profile Table Structure:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | References auth.users(id) |
| `email` | VARCHAR | User's email |
| `full_name` | VARCHAR | User's full name |
| `profile_image_url` | TEXT | URL to profile picture |
| `bio` | TEXT | User's bio/about section |
| `city` | VARCHAR | City of residence |
| `country` | VARCHAR | Country of residence |
| `timezone` | VARCHAR | User's timezone (UTC±) |
| `languages` | TEXT[] | Array of languages spoken |
| `availability` | VARCHAR | When user is available |
| `skills_offered` | TEXT[] | Array of skills user teaches |
| `skills_wanted` | TEXT[] | Array of skills user wants to learn |
| `is_verified` | BOOLEAN | Email verification status |
| `created_at` | TIMESTAMP | Account creation date |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

## Step 3: How Profile Updates Work

### Frontend Flow (Settings Page):

1. **User edits any field** (name, city, skills, etc.)
2. **Clicks "Save Changes"** button
3. **Frontend sends update** to database via `profileService.updateProfile()`
4. **Database updates immediately**
5. **App shows confirmation** toast message
6. **All components fetch fresh** data on next render

### Real-time Sync:

When user updates profile in Settings:
```typescript
const handleProfileSave = async () => {
  await profileService.updateProfile(user.id, {
    full_name: profile.name,
    bio: profile.bio,
    city: profile.city,
    timezone: profile.timezone,
    languages: [...],
    skills_offered: [...],
    skills_wanted: [...]
  });
}
```

---

## Step 4: API Functions Available

### Profile Service Functions:

```javascript
// Get user profile
profileService.getProfile(userId)

// Update entire profile
profileService.updateProfile(userId, updates)

// Update individual fields
profileService.updateBio(userId, bio)
profileService.updateLocation(userId, city, country)
profileService.updateTimezone(userId, timezone)
profileService.updateAvailability(userId, availability)

// Language management
profileService.updateLanguages(userId, languages)
profileService.addLanguage(userId, language)
profileService.removeLanguage(userId, language)

// Skills management
profileService.updateSkillsOffered(userId, skills)
profileService.addSkillOffered(userId, skill)
profileService.removeSkillOffered(userId, skill)
profileService.updateSkillsWanted(userId, skills)
profileService.addSkillWanted(userId, skill)
profileService.removeSkillWanted(userId, skill)

// Get reference data
profileService.getTimezones()

// Search profiles
profileService.searchBySkillOffered(skill)
profileService.searchBySkillWanted(skill)
profileService.getProfilesByCountry(country)
profileService.getProfilesByTimezone(timezone)
profileService.searchProfiles(filters)
```

---

## Step 5: Timezone Dropdown

The Settings page includes a full dropdown with 27 timezones:

- UTC-12:00 (Etc/GMT+12)
- UTC-11:00 (Pacific/Samoa)
- UTC-10:00 (Pacific/Honolulu)
- ... and more
- UTC+12:00 (Pacific/Auckland)

**Automatically loaded from database** when page opens.

---

## Step 6: Database Queries

### Create/Insert Profile:
```sql
INSERT INTO user_profiles (
  id, email, full_name, bio, city, country, timezone,
  languages, skills_offered, skills_wanted
) VALUES (uuid, email, name, bio, city, country, timezone,
  ARRAY[...], ARRAY[...], ARRAY[...]
);
```

### Update Profile:
```sql
UPDATE user_profiles
SET full_name = 'New Name',
    bio = 'New bio',
    timezone = 'UTC+05:00',
    languages = ARRAY['English', 'Urdu'],
    skills_offered = ARRAY['Teaching', 'Writing']
WHERE id = 'user-uuid';
```

### Get Profile with Details:
```sql
SELECT p.*, 
  COUNT(r.id) as review_count,
  ROUND(AVG(r.rating), 2) as average_rating
FROM user_profiles p
LEFT JOIN reviews r ON p.id = r.reviewee_id
WHERE p.id = 'user-uuid'
GROUP BY p.id;
```

### Search by Skills:
```sql
SELECT * FROM user_profiles
WHERE skills_offered && ARRAY['Web Development']
ORDER BY created_at DESC;
```

---

## Step 7: Frontend Components Updated

### Settings Page (`src/pages/Settings.tsx`):
- ✅ Loads profile from database on mount
- ✅ Loads timezones dropdown from database
- ✅ Syncs all changes to database
- ✅ Shows loading state while saving
- ✅ Displays success/error toasts

### Profile Page (`src/pages/Profile.tsx`):
- Can fetch latest profile data
- Display all user information
- Show skills, languages, timezone

---

## Step 8: Testing

1. **Go to Settings page** (`/settings`)
2. **Edit any field** (name, bio, skills, etc.)
3. **Click "Save Changes"**
4. **See success message**
5. **Check Supabase Table Editor** → `user_profiles`
6. **Verify data updated**
7. **Refresh page** → Changes persist

---

## Security

### Row Level Security (RLS):
- ✅ Users can view all profiles (public)
- ✅ Users can only insert their own profile
- ✅ Users can only update their own profile
- ✅ Users cannot delete profiles

### Authentication Required:
- Profile updates require active user session
- All functions check `auth.uid()`

---

## Common Queries

### Get all user data:
```javascript
const profile = await profileService.getProfile(userId);
// Returns: { full_name, bio, city, country, timezone, languages, skills_offered, skills_wanted, ... }
```

### Update timezone:
```javascript
await profileService.updateTimezone(userId, 'UTC+05:00');
```

### Add a language:
```javascript
await profileService.addLanguage(userId, 'French');
```

### Update all skills at once:
```javascript
await profileService.updateProfile(userId, {
  skills_offered: ['Web Dev', 'JavaScript', 'React'],
  skills_wanted: ['Photography', 'Cooking']
});
```

### Find users by location and skill:
```javascript
const results = await profileService.searchProfiles({
  country: 'Pakistan',
  skillOffered: 'Teaching'
});
```

---

## File Structure

```
├── CREATE_USER_PROFILES_TABLE.sql      (Schema + timezones)
├── USER_PROFILES_QUERIES.sql           (SQL queries reference)
├── src/lib/profileService.ts           (All profile functions)
├── src/pages/Settings.tsx              (Edit profile UI)
└── src/pages/Profile.tsx               (View profile)
```

---

## Next Steps

1. ✅ Run `CREATE_USER_PROFILES_TABLE.sql` in Supabase
2. ✅ Test Settings page
3. Add profile image upload
4. Display profile data on other pages
5. Add profile verification badges

