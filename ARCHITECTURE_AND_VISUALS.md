# Profile Skills Multi-Select - Visual Architecture Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CULTURAL SWAP APPLICATION                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Settings Page      │
                    │ (src/pages/Settings)│
                    └─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐   ┌──────────────────┐
        │   Skills You     │   │   Skills You     │
        │     Offer        │   │   Want to Learn  │
        │ (Dropdown 1)     │   │ (Dropdown 2)     │
        └──────────────────┘   └──────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
                  ┌───────────────────────────┐
                  │ SkillsMultiSelect         │
                  │ (Reusable Component)      │
                  │ (×2 instances)            │
                  └───────────────────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
                  ▼                       ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ Skills Data      │   │ Popover/UI       │
        │ (skillsCategories)   │ Components       │
        │ - 12 Categories  │   │ - Search Input   │
        │ - ~130 Skills    │   │ - Category List  │
        │ - Utilities      │   │ - Checkboxes     │
        └──────────────────┘   │ - Badge Display  │
                                └──────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Supabase Database  │
                    │  (user_profiles)    │
                    └─────────────────────┘
```

---

## Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   SkillsMultiSelect                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Button / Trigger                                       │ │
│  │ [Selected Skills as Badges] ▼                          │ │
│  │ [Painting] [×] [English] [×] [Web Dev] [×]            │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼ (opens on click)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Popover Content                                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │ Search Input: [Search skills...          ]            │ │
│  │                                                        │ │
│  │ ────────────────────────────────────────────          │ │
│  │                                                        │ │
│  │ Categories List (ScrollArea):                         │ │
│  │                                                        │ │
│  │ ▼ Art & Craft (expanded)                              │ │
│  │   ☑ Painting                                          │ │
│  │   ☐ Drawing                                           │ │
│  │   ☐ Calligraphy                                       │ │
│  │   ☐ Sculpture                                         │ │
│  │                                                        │ │
│  │ ▶ Languages (collapsed)                               │ │
│  │                                                        │ │
│  │ ▼ Music (expanded)                                    │ │
│  │   ☑ Web Development                                   │ │
│  │   ☐ Mobile Apps                                       │ │
│  │   ☐ UI/UX                                             │ │
│  │                                                        │ │
│  │ ▼ Technology (expanded)                               │ │
│  │   ☑ Guitar                                            │ │
│  │   ☐ Piano                                             │ │
│  │   ☐ Singing                                           │ │
│  │                                                        │ │
│  │ ▶ ... (other categories)                              │ │
│  │                                                        │ │
│  │ X skills selected                                      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
                        USER INTERACTION
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
            Click       Type to          Expand/
            Skill       Search           Collapse
             │             │                │
             ▼             ▼                ▼
        ┌─────────────────────────────────────────┐
        │   Event Handler in Component            │
        │                                         │
        │ - handleSkillToggle()                   │
        │ - handleSearch()                        │
        │ - toggleCategory()                      │
        └─────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────────────┐
            │   Update Component State       │
            │                                │
            │ - selectedSkills array         │
            │ - search string                │
            │ - expandedCategories set       │
            └────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────────────┐
            │   Trigger onChange Callback    │
            │ onChange(newSkillsArray)       │
            └────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────────────┐
            │   Parent Component Updates     │
            │   (Settings.tsx)               │
            │                                │
            │ setProfile({                   │
            │   ...profile,                  │
            │   skillsOffered: newSkills     │
            │ })                             │
            └────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────────────┐
            │   Component Re-renders         │
            │   with New Selection           │
            └────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    User Sees      User Clicks        User Clicks
    Updated        "Save Changes"     X on Badge
    Badges              │                 │
                        ▼                 ▼
                ┌──────────────┐   ┌──────────────┐
                │ handleProfile│   │ handleRemove │
                │ Save()       │   │ Skill()      │
                └──────────────┘   └──────────────┘
                        │                 │
                        ▼                 ▼
                ┌──────────────────────────────┐
                │  API Call to Database        │
                │                              │
                │  profileService.updateProfile│
                │  (userId, {                  │
                │   skills_offered: [...],     │
                │   skills_wanted: [...]       │
                │  })                          │
                └──────────────────────────────┘
                        │
                        ▼
                ┌──────────────────────────────┐
                │  Supabase Database Updated   │
                │  (user_profiles table)       │
                └──────────────────────────────┘
                        │
                        ▼
                ┌──────────────────────────────┐
                │  Toast Notification         │
                │  "Changes Saved"            │
                └──────────────────────────────┘
```

---

## Data Structure

```
skillsCategories.ts
│
├─ SkillCategory Interface
│  ├─ id: string           (e.g., "art-craft")
│  ├─ name: string         (e.g., "Art & Craft")
│  └─ subcategories: []    (e.g., ["Painting", "Drawing", ...])
│
├─ SKILLS_CATEGORIES Array (12 items)
│  ├─ [0] Art & Craft
│  │   ├─ id: "art-craft"
│  │   ├─ name: "Art & Craft"
│  │   └─ subcategories: ["Painting", "Drawing", "Calligraphy", ...]
│  │
│  ├─ [1] Languages
│  │   ├─ id: "languages"
│  │   ├─ name: "Languages"
│  │   └─ subcategories: ["English", "Arabic", "French", "Urdu", ...]
│  │
│  ├─ [2] Music
│  ├─ [3] Dance & Movement
│  ├─ [4] Cooking & Cuisine
│  ├─ [5] Technology
│  ├─ [6] Wellness & Fitness
│  ├─ [7] Craftsmanship
│  ├─ [8] Business & Entrepreneurship
│  ├─ [9] Academic
│  ├─ [10] Sports
│  └─ [11] Literature & Writing
│
├─ getAllSkills() Function
│   Returns: ["Painting", "Drawing", ..., "Blogging"] (~130 items)
│
├─ getCategoryForSkill(skill) Function
│   Input: "Web Development"
│   Returns: SkillCategory object (Technology)
│
└─ normalizeSkill(skill) Function
    Input: "  Web Development  "
    Returns: "web development"
```

---

## State Management

```
Settings Component State
│
├─ profile: {
│  ├─ name: string
│  ├─ bio: string
│  ├─ city: string
│  ├─ country: string
│  ├─ timezone: string
│  ├─ availability: string
│  ├─ languages: string
│  ├─ skillsOffered: string[]    ← Array of selected skills
│  └─ skillsWanted: string[]     ← Array of selected skills
│
├─ profileImage: string
├─ imageFile: File | null
├─ timezones: any[]
├─ isLoading: boolean
└─ dataLoading: boolean


SkillsMultiSelect Component State
│
├─ open: boolean
│  (Popover open/close state)
│
├─ search: string
│  (Current search input)
│
└─ expandedCategories: Set<string>
   (IDs of expanded categories)
```

---

## User Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    SETTINGS PAGE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ← Back to Profile                                          │
│                                                              │
│  Settings                                                   │
│  Manage your account and preferences                        │
│                                                              │
│  [Profile] [Notifications] [Privacy]                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Edit Profile                                           │ │
│  │ Update your personal information and skills            │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Full Name                                             │ │
│  │  [________________________]                            │ │
│  │                                                        │ │
│  │  City              Country                             │ │
│  │  [_______]         [_______]                           │ │
│  │                                                        │ │
│  │  Timezone                                              │ │
│  │  [Select timezone        ▼]                           │ │
│  │                                                        │ │
│  │  Bio                                                   │ │
│  │  [________________________________]                   │ │
│  │                                                        │ │
│  │  Languages (comma separated)                           │ │
│  │  [English, Urdu, Spanish            ]                 │ │
│  │                                                        │ │
│  │  Skills You Offer                                      │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ [Painting] [×] [Web Dev] [×] [Piano] [×]        │ │ │
│  │  │ [Select skills you offer         ▼]  3 selected │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │   (Opens popover below on click)                       │ │
│  │                                                        │ │
│  │  Skills You Want to Learn                              │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ [Photography] [×] [Cooking] [×]                │ │ │
│  │  │ [Select skills you want to learn    ▼]         │ │ │
│  │  │                                    2 selected  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  [Save Changes] [Test Connectivity] [Save (No Image)] │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Skills Category Breakdown

```
12 Categories × ~130 Total Skills

1. Art & Craft (8 skills)
   ├─ Painting
   ├─ Drawing
   ├─ Calligraphy
   ├─ Sculpture
   ├─ Digital Art
   ├─ Printmaking
   ├─ Illustration
   └─ Sketching

2. Languages (12 skills)
   ├─ English
   ├─ Arabic
   ├─ French
   ├─ Urdu
   ├─ Spanish
   ├─ Mandarin
   ├─ Hindi
   ├─ German
   ├─ Italian
   ├─ Japanese
   ├─ Portuguese
   └─ Korean

3. Music (11 skills)
   ├─ Guitar
   ├─ Piano
   ├─ Singing
   ├─ Music Production
   ├─ Drums
   ├─ Violin
   ├─ Flute
   ├─ Music Theory
   ├─ Ukulele
   ├─ Harmonica
   └─ Keyboard

4. Dance & Movement (11 skills)
5. Cooking & Cuisine (11 skills)
6. Technology (11 skills)
7. Wellness & Fitness (11 skills)
8. Craftsmanship (10 skills)
9. Business & Entrepreneurship (10 skills)
10. Academic (10 skills)
11. Sports (11 skills)
12. Literature & Writing (10 skills)
```

---

## Database Schema Integration

```
user_profiles Table
│
├─ id (UUID)
├─ user_id (UUID, FK)
├─ full_name (text)
├─ bio (text)
├─ city (text)
├─ country (text)
├─ timezone (text)
├─ availability (text)
├─ languages (array of text)
├─ profile_image_url (text)
├─ skills_offered (array of text)  ← UPDATED
├─ skills_wanted (array of text)   ← UPDATED
├─ created_at (timestamp)
├─ updated_at (timestamp)
└─ ...other fields

Old Format:
  skills_offered: "Web Development, JavaScript, Python"
  
New Format:
  skills_offered: ["Web Development", "JavaScript", "Python"]
```

---

## Component Integration Points

```
Settings.tsx (Page)
    │
    ├─ Import SkillsMultiSelect component
    │  from "@/components/SkillsMultiSelect"
    │
    ├─ Define profile state
    │  - skillsOffered: string[]
    │  - skillsWanted: string[]
    │
    ├─ Load data function
    │  - Parse existing skills (backward compatibility)
    │  - Convert old string format to array
    │
    ├─ Save handler
    │  - Send array format to database
    │  - Handle success/error
    │
    ├─ Render two dropdowns
    │  ├─ <SkillsMultiSelect
    │  │   label="Skills You Offer"
    │  │   value={profile.skillsOffered}
    │  │   onChange={handleChange}
    │  │ />
    │  │
    │  └─ <SkillsMultiSelect
    │      label="Skills You Want to Learn"
    │      value={profile.skillsWanted}
    │      onChange={handleChange}
    │    />
    │
    └─ Submit handler
       └─ Click "Save Changes"
          └─ Persist to database
```

---

## Search Algorithm

```
User Input: "web"
    │
    ▼
Convert to lowercase: "web"
    │
    ▼
Iterate through SKILLS_CATEGORIES:
    │
    ├─ Art & Craft
    │  ├─ "painting".includes("web") ? NO
    │  ├─ "drawing".includes("web") ? NO
    │  └─ ... NO matches
    │
    ├─ Languages
    │  ├─ "english".includes("web") ? NO
    │  └─ ... NO matches
    │
    ├─ Technology
    │  ├─ "web development".includes("web") ? YES ✓
    │  ├─ "mobile apps".includes("web") ? NO
    │  └─ ... (partial matches)
    │
    └─ ... (remaining categories)

Results:
[
  {
    name: "Technology",
    subcategories: ["Web Development"]  (filtered)
  }
]
    │
    ▼
Display filtered categories only
```

---

## Performance Optimization

```
Component Renders
    │
    ├─ useMemo for search filtering
    │  ├─ Only recalculates on search change
    │  ├─ Caches filtered results
    │  └─ Prevents unnecessary re-renders
    │
    ├─ Lazy Popover rendering
    │  ├─ Content only renders when open
    │  ├─ Saves initial render time
    │  └─ Improves perceived performance
    │
    ├─ ScrollArea for large lists
    │  ├─ Virtualizes list rendering
    │  ├─ Only renders visible items
    │  └─ Handles 130 items efficiently
    │
    └─ Set-based category tracking
       ├─ Fast toggle operations
       ├─ O(1) lookup time
       └─ Efficient state updates
```

---

## Error Handling Flow

```
User Action
    │
    ▼
Try to Save
    │
    ├─ Check Authentication
    │  ├─ Valid? → Continue
    │  └─ Invalid? → Show error, redirect to login
    │
    ├─ Validate Data
    │  ├─ Valid? → Continue
    │  └─ Invalid? → Show validation error
    │
    ├─ Upload to Database
    │  ├─ Success? → Show success toast
    │  ├─ Network Error? → Show error, offer retry
    │  └─ Server Error? → Show error message
    │
    └─ Update UI
       ├─ Clear loading state
       ├─ Refresh data if needed
       └─ Ready for next interaction
```

---

This completes the comprehensive visual architecture guide for the Profile Skills Multi-Select implementation!
