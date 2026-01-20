# Chat Management UI Layout & Flow

## Header Layout (Left Panel)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Messages                            ⋮ (MENU)  │
│                                                 │
│  [Search people...                         🔍] │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Three-Dot Menu Dropdown

```
⋮ (Click)
└─ Dropdown:
   ├─ 🔔 Unread
   ├─ ⭐ Starred
   ├─ 🎁 Custom Offers
   ├─ 💬 Assistant Chats
   ├─ ─────────────────
   ├─ 📦 Archived
   ├─ ─────────────────
   └─ ✕ Clear Filter (if active)
```

## Chat List Item (Normal State)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Avatar] User Name              Time           │
│           Last message preview...               │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Chat List Item (With Star)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Avatar] ⭐ User Name            Time           │
│           Last message preview...               │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Chat List Item (With Assistant Badge)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Avatar]                                        │
│   🔵                User Name       Time        │
│           Last message preview...               │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Chat List Item (Hover State - Shows Context Menu)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Avatar] ⭐ User Name              ⋮ (MENU)    │
│           Last message preview...               │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Chat Context Menu

```
Chat Item (Hover)
└─ ⋮ (Click)
   └─ Dropdown:
      ├─ ⭐ Star / ⭐ Unstar
      ├─ ──────────────────
      └─ 📦 Archive / Unarchive
```

## Full Chat List View with Filter Applied

```
┌─────────────────────────────────────────────────┐
│  Messages                         ⋮ (ACTIVE)    │ ← Active filter highlighted
│  [Search people...]                             │
│                                                 │
│  ⭐ Starred Filter Active ✓                      │
│                                                 │
│  Filtered Conversations:                        │
│                                                 │
│  [Avatar] ⭐ John Doe              12:30 PM     │
│           Hey, how are you?                    │
│                                                 │
│  [Avatar] ⭐ Jane Smith             3:45 PM     │
│           Thanks for the help!                 │
│                                                 │
│  No more starred conversations                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Filter States

### All Conversations (Default)
```
✓ All conversations shown
✓ Archived hidden
✓ All chat types visible
✓ No special filter active
```

### Unread Filter
```
✓ Only conversations with unread messages shown
✓ Current user must be receiver
✓ Latest message must be unread
✓ Real-time updates as messages read
```

### Starred Filter
```
✓ Only conversations marked as starred shown
✓ Gold star visible on items
✓ Archived hidden unless in archived filter
✓ User-specific
```

### Archived Filter
```
✓ Only archived conversations shown
✓ Main conversation list hidden
✓ User can unarchive from context menu
✓ Not shown in other filters
```

### Custom Offers Filter
```
✓ Only offer-related conversations shown
✓ Conversations with swap context
✓ Separated from regular chats
```

### Assistant Chats Filter
```
✓ Only support/system chats shown
✓ Identified by name pattern
✓ Blue badge on avatar
✓ Separated from user chats
```

## State Transitions

```
User Opens Messages
      ↓
Load Conversations + Metadata
      ↓
Display All Conversations (Default)
      ↓
User Clicks ⋮ Menu
      ↓
Show Filter Options
      ↓
User Selects Filter
      ↓
Apply Filter + Update UI Instantly
      ↓
Filter Remains Active
      ↓
User Hovers Chat Item
      ↓
Show Context Menu (⋮)
      ↓
User Clicks Star/Archive
      ↓
Toggle State + Update DB
      ↓
Real-Time Update (Other Tabs/Devices)
```

## Keyboard Behavior

```
Click outside dropdown    → Menu closes
Select option             → Menu closes + Filter applied
Hover chat                → Context menu appears
Click elsewhere on chat   → Context menu closes
Tab/Multi-Tab             → Real-time sync updates
```

## Visual Indicators Legend

```
Icon/Style              Meaning
──────────────────────────────────
⭐ Gold Star            Chat is starred
🔔 Bell Icon            Unread filter active
📦 Box Icon             Archive filter active
💬 Chat Icon            Assistant chats filter
🎁 Gift Icon            Custom offers filter
✕ X Icon                Clear filter
⋮ Three Dots            Menu button
🔵 Blue Dot             Assistant/Support user
🟢 Green Dot            Online status (future)
Bold Text               Unread message
Normal Text             Read message
Highlighted Row         Selected conversation
```

## Mobile Responsiveness

```
Desktop (md+):
├─ Left Panel (320px) | Right Panel (flex)
└─ Both visible simultaneously

Mobile (< md):
├─ Show Left Panel When: No conversation selected
├─ Show Right Panel When: Conversation selected
├─ Back button in header to return to list
└─ Menu still accessible in header
```

## Interaction Timing

```
Action              Expected Behavior
────────────────────────────────────────
Click ⋮ Menu        Instant dropdown appear
Select Filter       Instant UI update (0ms)
Click Star          Instant star appear
Save to DB          Fast (~100ms)
Other Tab Updates   Real-time (~200-500ms)
Hover Chat          Instant context menu
Click Archive       Instant hide + save
Unarchive           Instant restore
```

## Error States

```
No Conversations
└─ Message: "No conversations found"
   └─ Shows when no chats match filter

Database Error
└─ Toast: "Failed to star chat"
   └─ User can retry

Network Error
└─ Toast: "Connection lost"
   └─ Data local until reconnect
```

## Accessibility

```
✓ Semantic HTML
✓ ARIA labels on buttons
✓ Keyboard navigation
✓ Tab order logical
✓ Color + icon distinction
✓ Contrast ratios met
✓ Touch targets 48px minimum
✓ Screen reader friendly
```

---

## Quick Visual Summary

### Before Implementation
```
Messages  ⋮
[Search]
[Chat 1]
[Chat 2]
[Chat 3]
```

### After Implementation
```
Messages  ⋮ ← Now has menu with filters
[Search]
[Chat 1] ⋮ ← Now has context menu
[⭐ Chat 2] ⋮
[🔵 Chat 3] ⋮ ← Assistant badge
```

### With Filter Active (Starred)
```
Messages  ⋮ [STARRED ✓] ← Shows active filter
[Search]
[⭐ Chat 2] ⋮
[⭐ Chat 5] ⋮
```
