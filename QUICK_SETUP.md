# ⚡ Quick Setup - Run This First!

## Step 1: Copy the SQL
Open `CREATE_SWAPS_TABLE.sql` in this folder

## Step 2: Go to Supabase
1. Open https://supabase.com
2. Go to your project
3. Click "SQL Editor" (left sidebar)
4. Click "New query"
5. Paste the entire contents of `CREATE_SWAPS_TABLE.sql`
6. Click "Run" button

Expected output:
```
executed successfully
```

## Step 3: Verify
1. Click "Table Editor" in left sidebar
2. You should see "swaps" table in the list
3. Click it to verify all columns are there

## Step 4: Test in App
1. Run your app locally (`npm run dev` or `bun dev`)
2. Login to dashboard
3. Click "Create Swap" button
4. Fill out form:
   - Title: "English Language Teaching"
   - Skill Offered: "English Teaching"
   - Skill Wanted: "Spanish Learning"
   - Category: "Languages"
   - Duration: "10 hours"
   - Format: "Online"
5. Click "Create Swap"
6. Go to Discover section
7. Your swap should appear in the grid!

## ✅ Success Indicators
- Swap appears in Discover section
- Shows your profile image
- Shows your city/country
- Can filter and search for it
- Multiple swaps stack properly in grid

## 🆘 If Something Goes Wrong
1. Check browser console (F12) for errors
2. Check Supabase for the swaps table
3. Check if you're logged in
4. Try creating another swap
5. Check if Discover page loads any swaps

---
**That's it! Everything else is already connected. 🚀**
