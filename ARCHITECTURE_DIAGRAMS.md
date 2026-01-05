# 🎨 Architecture Diagrams - Dynamic Swaps System

## 1️⃣ USER FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                              │
└──────────────────────────────────────────────────────────────────┘

STEP 1: SIGNUP/LOGIN
┌─────────────┐
│   Index     │
│   (Home)    │
└─────────────┘
      ↓
┌─────────────────────┐
│  Login/Signup Page  │
│ (Existing System)   │
└─────────────────────┘
      ↓
┌──────────────┐
│  Dashboard   │ ← User logged in
└──────────────┘
    ↙     ↘
   /       \
  /         \
[Create]   [Find New]
  ↓          ↓
  │          └────┐
  │               ↓
  │          ┌──────────┐
  │          │ Discover │ ← See all skill swaps
  │          │  (Grid)  │
  │          └──────────┘
  │
  ↓
┌─────────────────┐
│  CreateSwap     │ ← Fill out form
│ (Form Page)     │
└─────────────────┘
    ↓ Submit
┌────────────────────┐
│ swapService.create │
└────────────────────┘
    ↓ Save
┌─────────────────┐
│  Supabase       │
│  swaps table    │
└─────────────────┘
    ↓ Success
┌──────────────┐
│  Swaps Page  │ ← Show user's swaps
└──────────────┘
    ↓
┌──────────────┐
│  Discover    │ ← Your swap shows here!
│  (Updated!)  │
└──────────────┘
```

---

## 2️⃣ DATA FLOW ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  User Interface Layer                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Dashboard        CreateSwap      Discover       Swaps        │ │
│  │    ↓                 ↓               ↓            ↓          │ │
│  │ [Create Swap]   [Form]         [Grid]       [My Swaps]       │ │
│  │ Button          Submit         Filter           List          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
│  Service Layer (swapService.ts)                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  createSwap()      getAllSwaps()    searchBySkillOffered()   │ │
│  │  getSwapById()     getByCategory()  searchBySkillWanted()    │ │
│  │  updateSwap()      getByUser()      getMatchingSwaps()       │ │
│  │  deleteSwap()                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
│  Supabase JS Client                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ .from('swaps').insert/select/update/delete()                │ │
│  │ .from('user_profiles').select()                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
└────────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────────┐
│                  BACKEND (Supabase PostgreSQL)                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  swaps table               user_profiles table      auth.users     │
│  ┌──────────────────┐     ┌──────────────────┐     ┌───────────┐ │
│  │ id (PK)          │     │ id (PK)          │     │ id        │ │
│  │ user_id (FK) ───────→  │ (user profile)   │  ←──│ (email)   │ │
│  │ title            │     │ full_name        │     │ (pass)    │ │
│  │ description      │     │ profile_image_url│     └───────────┘ │
│  │ skill_offered    │     │ city             │                    │
│  │ skill_wanted     │     │ country          │                    │
│  │ category         │     │ timezone         │                    │
│  │ duration         │     │ languages        │                    │
│  │ format           │     │ skills_offered   │                    │
│  │ status           │     │ skills_wanted    │                    │
│  │ created_at (✓)   │     └──────────────────┘                    │
│  │ updated_at (✓)   │                                             │
│  └──────────────────┘                                             │
│                                                                    │
│  Indexes:                        RLS Policies:                    │
│  ├─ idx_swaps_user_id            ├─ View all swaps               │
│  ├─ idx_swaps_status             ├─ Insert own swaps             │
│  ├─ idx_swaps_category           ├─ Update own swaps             │
│  └─ idx_swaps_created_at         └─ Delete own swaps             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ CREATE SWAP FLOW

```
User Clicks "Create Swap"
│
├─→ Route: /swap/create
│
├─→ CreateSwap Component Loads
│   ├─ Form with 7 fields
│   ├─ Category dropdown (10 items)
│   ├─ Duration selector (6 items)
│   └─ Format selector (3 items)
│
├─→ User Fills Form
│   ├─ Title: "French Language Teaching"
│   ├─ Skill Offered: "French"
│   ├─ Skill Wanted: "Spanish"
│   ├─ Category: "Languages"
│   ├─ Duration: "10 hours"
│   └─ Format: "Online"
│
├─→ User Clicks "Create Swap"
│
├─→ Validation
│   ├─ Title? ✓
│   ├─ Skill Offered? ✓
│   ├─ Skill Wanted? ✓
│   └─ Logged In? ✓
│
├─→ Get Current User
│   └─ supabase.auth.getUser() → userId
│
├─→ Call swapService.createSwap()
│   │
│   ├─→ supabase.from('swaps').insert({
│   │     user_id: userId,
│   │     title: "French Language Teaching",
│   │     skill_offered: "French",
│   │     skill_wanted: "Spanish",
│   │     category: "Languages",
│   │     duration: "10 hours",
│   │     format: "online",
│   │     status: "open"
│   │   })
│   │
│   ├─→ Database Receives
│   │   └─ Inserts new row
│   │   └─ Auto-sets created_at, updated_at
│   │   └─ Returns data
│   │
│   └─→ Returns swap object
│
├─→ Check Result
│   ├─ Success?
│   │  ├─ Show toast: "Swap created!"
│   │  └─ Navigate: /swaps
│   │
│   └─ Error?
│      └─ Show toast: Error message
│
└─→ Done!
   User redirected to Swaps page
```

---

## 4️⃣ DISCOVER PAGE FLOW

```
User Opens Discover Page (/discover)
│
├─→ Component Mounts
│   ├─ State initialized:
│   │  ├─ swaps = []
│   │  ├─ profilesMap = {}
│   │  └─ loading = true
│   │
│   └─ useEffect Hook Runs
│
├─→ Call: swapService.getAllSwaps()
│   │
│   ├─→ supabase.from('swaps')
│   │     .select('*')
│   │     .eq('status', 'open')
│   │     .order('created_at', desc)
│   │
│   ├─→ Database Returns
│   │   ├─ Swap 1: {id, user_id, title, ...}
│   │   ├─ Swap 2: {id, user_id, title, ...}
│   │   ├─ Swap 3: {id, user_id, title, ...}
│   │   └─ ...
│   │
│   └─→ swaps = [array of swaps]
│
├─→ For Each Swap
│   │
│   └─→ Call: profileService.getProfile(swap.user_id)
│       │
│       ├─→ supabase.from('user_profiles')
│       │     .select('*')
│       │     .eq('id', user_id)
│       │
│       ├─→ Database Returns
│       │   {
│       │     full_name: "Ali Khan",
│       │     profile_image_url: "url...",
│       │     city: "Lahore",
│       │     country: "Pakistan",
│       │     ...
│       │   }
│       │
│       └─→ Store in profilesMap[user_id]
│
├─→ Update State
│   ├─ setSwaps(allSwaps)
│   ├─ setProfilesMap(profiles)
│   └─ setLoading(false)
│
├─→ Component Re-renders
│   └─ Shows grid with all swaps
│      ├─ Swap 1: with profile image, city, skills
│      ├─ Swap 2: with profile image, city, skills
│      ├─ Swap 3: with profile image, city, skills
│      └─ ...
│
├─→ User Interacts
│   ├─ Search "French"
│   │  └─ Filter swaps by skill/title
│   │
│   ├─ Filter by "Languages"
│   │  └─ Show only language swaps
│   │
│   ├─ Filter by "Online"
│   │  └─ Show only online swaps
│   │
│   └─ Click "View"
│      └─ Navigate to /swap/{id}
│
└─→ Done!
   User can see all available skill swaps
```

---

## 5️⃣ DATABASE SCHEMA DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                         │
│                      (PostgreSQL + Auth)                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌─────────────────────┐    ┌──────────┐
│    auth.users        │      │   user_profiles     │    │ swaps    │
│  (Built-in)          │      │   (Existing)        │    │ (NEW)    │
├──────────────────────┤      ├─────────────────────┤    ├──────────┤
│ id (UUID) ────────────────→ │ id (UUID)           │    │ id (PK)  │
│ email                │      │ email               │    │ user_id  │
│ password             │      │ full_name           │    │ (FK)────┐
│ ...                  │      │ profile_image_url   │    │          │
└──────────────────────┘      │ bio                 │    │ title    │
                              │ city                │    │ descr.   │
                              │ country             │    │ skill_o. │
                              │ timezone            │    │ skill_w. │
                              │ languages (array)   │    │ category │
                              │ skills_offered      │    │ duration │
                              │ skills_wanted       │    │ format   │
                              │ created_at          │    │ status   │
                              │ updated_at          │    │ creat_at │
                              └─────────────────────┘    │ updt_at  │
                                                         └──────────┘

                              Foreign Key:
                         swaps.user_id → user_profiles.id

Relationships:
│
├─ User creates a swap
│  └─ swaps.user_id = user_profiles.id
│
├─ When displaying swap
│  └─ Get profile data (name, image, location)
│     for profile info in Discover grid
│
└─ Can search by skill_offered, skill_wanted
   └─ Match users with compatible skills
```

---

## 6️⃣ STATE MANAGEMENT FLOW

```
Discover Component State

┌──────────────────────────────────────────────────────────────┐
│                     Initial State                            │
├──────────────────────────────────────────────────────────────┤
│ swaps: []                                                    │
│ loading: true                                                │
│ profilesMap: {}                                              │
│ searchQuery: ""                                              │
│ selectedCategory: "all"                                      │
│ selectedFormat: "all"                                        │
│ sortBy: "match"                                              │
└──────────────────────────────────────────────────────────────┘
                        ↓ useEffect
┌──────────────────────────────────────────────────────────────┐
│                After Fetch (Success)                         │
├──────────────────────────────────────────────────────────────┤
│ swaps: [                                                     │
│   {id, user_id, title, skill_offered, ...},                │
│   {id, user_id, title, skill_offered, ...},                │
│   ...                                                        │
│ ]                                                            │
│ loading: false                                               │
│ profilesMap: {                                               │
│   "user-id-1": {full_name, profile_image_url, city, ...},   │
│   "user-id-2": {full_name, profile_image_url, city, ...},   │
│   ...                                                        │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                        ↓ User Searches
┌──────────────────────────────────────────────────────────────┐
│              After Search (Filter Applied)                   │
├──────────────────────────────────────────────────────────────┤
│ searchQuery: "French"                                        │
│ filteredSwaps: [                                             │
│   {id, user_id, title: "French Teaching", ...},            │
│   {id, user_id, title: "Learn French", ...},               │
│   ...                                                        │
│ ]                                                            │
│ → Re-render with filtered results                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 7️⃣ ROUTING TREE

```
App Routes

/
├─ Index (Home)
│
├─ /auth
│  ├─ /login
│  ├─ /signup
│  └─ /forgot-password
│
├─ /dashboard
│  └─ [Create Swap] → /swap/create (NEW)
│  └─ [Find New] → /discover
│
├─ /swap
│  ├─ /create (NEW) ← CreateSwap form
│  │
│  └─ /:id → SwapDetail
│
├─ /swaps
│  └─ My Swaps list
│  └─ [Create New Swap] → /swap/create (NEW)
│
├─ /discover
│  └─ Grid of all swaps (UPDATED)
│
├─ /community
├─ /messages
├─ /schedule
├─ /notifications
│
├─ /profile
├─ /user/:id
└─ /settings
```

---

## 8️⃣ COMPONENT HIERARCHY

```
App
│
├─ BrowserRouter
│  │
│  └─ Routes
│     │
│     ├─ / → Index
│     │
│     ├─ /login → Login
│     ├─ /signup → Signup
│     │
│     ├─ /dashboard
│     │  ├─ Navbar
│     │  ├─ Stats Cards
│     │  ├─ Upcoming Sessions
│     │  └─ Footer
│     │
│     ├─ /swap/create (NEW)
│     │  ├─ Navbar
│     │  ├─ CreateSwap Component
│     │  │  ├─ Form Inputs
│     │  │  ├─ Dropdowns (3)
│     │  │  └─ Buttons (2)
│     │  └─ Footer
│     │
│     ├─ /discover
│     │  ├─ Navbar
│     │  ├─ Search Bar
│     │  ├─ Filters
│     │  ├─ Grid Component
│     │  │  ├─ SwapCard (repeating)
│     │  │  │  ├─ Profile Image
│     │  │  │  ├─ User Info
│     │  │  │  ├─ Skills
│     │  │  │  └─ Button
│     │  │  └─ Loading Spinner (NEW)
│     │  └─ Footer
│     │
│     └─ /swaps
│        ├─ Navbar
│        ├─ Header with Button (UPDATED)
│        ├─ Stats Cards
│        ├─ Tabs
│        │  ├─ Active Swaps (Grid)
│        │  └─ Completed Swaps (Grid)
│        └─ Footer
```

---

## 9️⃣ ERROR HANDLING FLOW

```
User Action
│
├─ Create Swap
│  │
│  ├─→ Validation Check
│  │   ├─ Missing Title?
│  │   │  └─ Toast: "Please fill title"
│  │   │
│  │   ├─ Missing Skill Offered?
│  │   │  └─ Toast: "Please fill skill offered"
│  │   │
│  │   └─ Not Logged In?
│  │      └─ Toast: "You must be logged in"
│  │         Navigate: /login
│  │
│  └─→ Database Operation
│      ├─ Success?
│      │  └─ Toast: "Swap created!"
│      │     Navigate: /swaps
│      │
│      └─ Error?
│         └─ Toast: Error message
│            Logged: console.error()
│
└─ Load Swaps
   │
   └─→ Database Query
       ├─ Success?
       │  └─ Load complete
       │     Show swaps
       │
       └─ Error?
          └─ Console log error
             Show empty state
             Allow retry
```

---

## 🔟 SEARCH & FILTER LOGIC

```
All Swaps Array
│
├─ Filter by Search Query
│  ├─ Title includes "French"?
│  ├─ skill_offered includes "French"?
│  └─ skill_wanted includes "French"?
│
├─ Filter by Category
│  └─ category equals "Languages"?
│
├─ Filter by Format
│  └─ format equals "online"?
│
└─ Result: Filtered Array
   │
   └─ Sort By
      ├─ Most Recent (default)
      ├─ Highest Rated (future)
      └─ Best Match (future)
         │
         └─ Display in Grid
```

---

**Architecture Version**: 1.0
**Last Updated**: December 29, 2025
**Status**: ✅ Complete
