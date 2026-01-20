# WhatsApp-Like Chat Management System - Setup Guide

## Overview
This implementation adds advanced chat management features to the Messages page, including:
- Three-dot menu with filtering options
- Star/Unstar chats
- Archive/Unarchive chats
- Unread message filtering
- Custom offers filtering
- Assistant chats filtering
- Real-time updates

## Setup Instructions

### 1. Run the SQL Migration

Execute the SQL migration to create the required database tables:

**File:** `CREATE_CHAT_MANAGEMENT_TABLES.sql`

Run this in your Supabase SQL editor to create:
- `chat_starred` table - stores starred chat metadata
- `chat_archived` table - stores archived chat metadata
- Proper indexes and RLS policies

### 2. Verify Database Tables

After running the migration, verify the tables exist:
```sql
SELECT * FROM chat_starred;
SELECT * FROM chat_archived;
```

### 3. Review the Implementation Files

#### Services:
- **`src/lib/chatManagementService.ts`** - Core chat management service with methods:
  - `starChat()` - Star a conversation
  - `unstarChat()` - Unstar a conversation
  - `archiveChat()` - Archive a conversation
  - `unarchiveChat()` - Unarchive a conversation
  - `getStarredChats()` - Get all starred chats for user
  - `getArchivedChats()` - Get all archived chats for user
  - `getChatMetadata()` - Get metadata for a single chat
  - `getAllChatMetadata()` - Get all metadata for user

#### UI Components:
- **`src/pages/Messages.tsx`** - Enhanced with:
  - Three-dot menu dropdown (line ~420)
  - Chat-level context menus (line ~635)
  - Filter logic (applyFilters function)
  - Star and archive handlers
  - Real-time subscriptions for metadata changes

## Features

### 1. Three-Dot Menu (Header)
Located in the messages header next to "Messages" title

**Options:**
- **Unread** - Show only conversations with unread messages
- **Starred** - Show only starred conversations
- **Custom Offers** - Show only conversations with custom offers
- **Assistant Chats** - Show conversations with system/support assistants
- **Archived** - Show archived conversations
- **Clear Filter** - Return to all conversations (appears when filter is active)

### 2. Chat-Level Context Menu
Appears on hover over each chat item

**Options:**
- **Star/Unstar** - Toggle starred status (shows gold star icon when starred)
- **Archive/Unarchive** - Toggle archived status

### 3. Visual Indicators

#### Star Icon
- Gold filled star: Chat is starred
- Appears next to user name in chat list

#### Unread Badge
- Bold font weight for unread messages
- Visual distinction from read messages

#### Assistant Badge
- Blue dot in top-right corner of avatar
- Identifies assistant/support chats

#### Filter Badge
- Active filter name shown as selected in menu

### 4. Filter Behaviors

#### Unread
- Shows conversations where last message is unread by current user
- Real-time updates when messages are read

#### Starred
- Shows only conversations marked as starred by current user
- Specific to each user (not shared)

#### Custom Offers
- Shows conversations with swap offers (custom offer context)
- Identifies offer-related chats

#### Assistant Chats
- Shows conversations with users named "assistant", "support", or "system"
- Separated from regular user chats

#### Archived
- Shows hidden archived conversations
- Archived chats hidden by default (removed from "all" view)
- User can unarchive to restore to main list

### 5. Real-Time Functionality

#### Automatic Updates
- Changes to starred/archived status update instantly across all tabs
- Supabase subscriptions listen for changes to:
  - `chat_starred` table
  - `chat_archived` table

#### Persistence
- All starred/archived states persisted in database
- User-specific (not shared between users)
- User-specific RLS policies enforced

## Database Schema

### chat_starred
```sql
id (UUID, PK)
user_id (UUID, FK -> auth.users)
conversation_id (UUID, FK -> conversations)
created_at (TIMESTAMP)
UNIQUE(user_id, conversation_id)
```

### chat_archived
```sql
id (UUID, PK)
user_id (UUID, FK -> auth.users)
conversation_id (UUID, FK -> conversations)
created_at (TIMESTAMP)
UNIQUE(user_id, conversation_id)
```

## User Experience Flow

1. **User Opens Messages**
   - Loads all conversations
   - Loads starred/archived metadata for current user

2. **User Clicks Three-Dot Menu**
   - Dropdown menu appears with filter options
   - Current active filter highlighted

3. **User Selects a Filter**
   - Conversations filtered instantly
   - Menu closes
   - Filter persists until changed or cleared

4. **User Hovers Over Chat Item**
   - Context menu appears with Star/Archive options
   - Click Star icon: Toggles starred status
   - Click Archive icon: Archives chat (removed from main list if not in archived filter)

5. **Real-Time Updates**
   - If another tab/device stars/archives a chat, updates appear instantly
   - Supabase subscriptions handle synchronization

## Code Implementation Details

### State Management
```tsx
const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'starred' | 'archived' | 'offers' | 'assistant'>('all');
const [starredChats, setStarredChats] = useState<Set<string>>(new Set());
const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());
const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
```

### Filter Logic
The `applyFilters()` function:
1. Removes archived chats unless viewing archived filter
2. Applies specific filter based on `activeFilter` state
3. Returns filtered conversations

### Chat Actions
- `handleStarChat()` - Toggle star status
- `handleArchiveChat()` - Toggle archive status
- Both handle UI updates and database persistence

### Helper Functions
- `isAssistantUser()` - Checks if profile is an assistant
- `isCustomOfferConversation()` - Checks if chat is offer-related

## Troubleshooting

### Starred/Archived Not Persisting
- Verify `chat_starred` and `chat_archived` tables exist
- Check RLS policies allow user access
- Verify Supabase auth session is active

### Real-Time Updates Not Working
- Verify Supabase subscription is active
- Check browser console for errors
- Ensure user ID is properly set

### Filters Not Showing Conversations
- Verify conversation data matches filter criteria
- Check database records for starred/archived metadata
- Ensure user ID is correctly associated

## Future Enhancements

Potential improvements:
- Multi-select actions on multiple chats
- Mute conversations (hide notifications)
- Pin conversations (keep at top)
- Search within a specific filter
- Archive old conversations automatically
- Conversation categories/custom folders
- Bulk archive action

## API Reference

### chatManagementService

```typescript
// Star a chat
starChat(userId: string, conversationId: string): Promise<any>

// Unstar a chat
unstarChat(userId: string, conversationId: string): Promise<void>

// Archive a chat
archiveChat(userId: string, conversationId: string): Promise<any>

// Unarchive a chat
unarchiveChat(userId: string, conversationId: string): Promise<void>

// Get all starred chats for user
getStarredChats(userId: string): Promise<string[]>

// Get all archived chats for user
getArchivedChats(userId: string): Promise<string[]>

// Check if a chat is starred
isStarred(userId: string, conversationId: string): Promise<boolean>

// Check if a chat is archived
isArchived(userId: string, conversationId: string): Promise<boolean>

// Get metadata for a single chat
getChatMetadata(userId: string, conversationId: string): Promise<{isStarred: boolean, isArchived: boolean}>

// Get all metadata for user
getAllChatMetadata(userId: string): Promise<{starredChats: Set<string>, archivedChats: Set<string>}>
```

## Security

- All operations require authenticated user (verified in RLS policies)
- Users can only access their own starred/archived data
- Foreign key constraints prevent invalid data
- Supabase RLS policies enforce row-level security
