# ⚠️ Fix: "Bucket Not Found" Error

**Error:** `bucket not found`  
**Cause:** The `user-profiles` storage bucket doesn't exist in Supabase  
**Status:** FIXABLE in 2 minutes

---

## 🔧 Quick Fix

### Option 1: GUI (Easiest - 30 seconds)

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Select your project

2. **Navigate to Storage**
   - Click **"Storage"** in left menu
   - You'll see the Buckets page

3. **Create Bucket**
   - Click **"Create a new bucket"** button
   - Name: `user-profiles`
   - Toggle **"Make it public"** to **ON** ✅
   - Click **"Create bucket"**

4. **Done!** ✅
   - Try uploading profile image again

---

### Option 2: SQL (Faster - 1 minute)

1. **Open Supabase SQL Editor**
   - Go to Supabase Dashboard
   - Click **"SQL Editor"** in left menu

2. **Copy & Paste**
   - Copy the entire contents of: `CREATE_PROFILE_IMAGES_BUCKET.sql`

3. **Run Query**
   - Paste into SQL editor
   - Click **"Run"** button
   - Wait for success message

4. **Done!** ✅
   - Try uploading profile image again

---

## 📋 What Gets Created

When you create the `user-profiles` bucket, it will have:

✅ **Bucket Name:** `user-profiles`  
✅ **Public Access:** Enabled (anyone can view images)  
✅ **RLS Policies:** 
  - Users can upload to: `profile-images/{userId}/`
  - Users can update: Their own images only
  - Users can delete: Their own images only
  - Everyone can view: All public images

---

## ✅ Verify It Worked

After creating the bucket, check:

1. **In Supabase Dashboard**
   - Storage → Buckets
   - Should see `user-profiles` bucket ✅

2. **Try Upload**
   - Go to Settings
   - Click camera icon
   - Select image
   - Click "Save Changes"
   - Should upload successfully ✅

3. **Check Storage**
   - Storage → user-profiles bucket
   - Should see new folder: `profile-images/{userId}/`
   - Should see image file ✅

---

## 🚀 After Fix

Once bucket exists:

1. ✅ Images upload to `user-profiles` bucket
2. ✅ URLs generated automatically
3. ✅ Profile updates with image URL
4. ✅ Navbar shows updated image
5. ✅ All pages sync in real-time
6. ✅ No "bucket not found" error

---

## 📊 File Structure (After Upload)

```
user-profiles/
└── profile-images/
    └── {userId}/
        ├── {userId}-1234567890.jpg
        ├── {userId}-1234567891.jpg
        └── {userId}-1234567892.jpg
```

Each file has a unique timestamp to prevent conflicts.

---

## 🔒 Security

✅ **RLS Enabled:** Only authenticated users can upload  
✅ **User Scoped:** Users only upload to their own folder  
✅ **Public URLs:** Images are publicly viewable (no auth needed for viewing)  
✅ **Delete Protected:** Users can only delete their own images  

---

## 🛠️ If It Still Doesn't Work

### Error: "Policy already exists"
```
This is NORMAL - ignore it
Means policies are already created
```

### Error: "Permission denied"
```
Solution: Make sure you're logged in as project admin
Go to Supabase → Settings → Developers
Verify your API keys
```

### Error: "Bucket already exists"
```
This is GOOD - bucket was already created
Try uploading image again
If still fails, check bucket is PUBLIC
```

### Error: "Upload still fails"
```
1. Check bucket is PUBLIC
2. Check RLS policies are correct
3. Run: SELECT * FROM storage.buckets WHERE id = 'user-profiles';
4. Should show: public = true
```

---

## 📝 What to Run (SQL Version)

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up upload policy
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read policy
CREATE POLICY "Allow public access to profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');
```

---

## ✨ Next Steps

1. **Create bucket** (Option 1 or 2 above)
2. **Test upload** (Settings → Profile → Camera icon)
3. **Verify image** (Check Navbar updated)
4. **Done!** 🎉

---

## 📞 Still Having Issues?

Check these files for more info:
- `PROFILE_IMAGE_UPDATE_FIX.md` - Detailed troubleshooting
- `PROFILE_IMAGE_UPDATE_TESTING.md` - Test procedures
- `CREATE_PROFILE_IMAGES_BUCKET.sql` - SQL setup script

**Problem Status:** 🟢 FIXABLE  
**Estimated Fix Time:** 2 minutes  
**Difficulty:** Easy

