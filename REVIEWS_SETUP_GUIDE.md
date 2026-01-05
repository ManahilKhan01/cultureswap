# Reviews & Ratings Setup Guide

## Overview
This guide explains how to set up the ratings and reviews system in your CultureSwap application.

---

## Step 1: Create the Reviews Table in Supabase

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Create a New Query** (Click "+" button)
3. **Copy the entire contents** from `CREATE_REVIEWS_TABLE.sql`
4. **Paste** into the SQL Editor
5. **Click "Run"** button to execute

This will create:
- Reviews table with proper structure
- Indexes for performance
- Row Level Security (RLS) policies
- Functions to calculate average ratings

---

## Step 2: How Reviews are Submitted

### From the App (Frontend):
1. User clicks **"Leave Review"** button on a swap detail page
2. A dialog opens with:
   - **Rating** - Stars (1-5) selection
   - **Comment** - Text review of the experience
3. User clicks **"Submit Review"**
4. The review is automatically saved to the database

### Database Query Used:
```sql
INSERT INTO reviews (
  reviewer_id,
  reviewee_id,
  swap_id,
  rating,
  comment,
  would_recommend
) VALUES (
  current_user_id,
  partner_user_id,
  swap_id,
  rating_number,
  review_text,
  true
);
```

---

## Step 3: Data Stored in Database

When a review is submitted, the following data is saved:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique review ID |
| `reviewer_id` | UUID | ID of user leaving review |
| `reviewee_id` | UUID | ID of user being reviewed |
| `swap_id` | UUID | ID of the completed swap |
| `rating` | Integer (1-5) | Star rating |
| `comment` | Text | Review text |
| `would_recommend` | Boolean | If reviewer would recommend |
| `created_at` | Timestamp | When review was created |

### Example Data:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reviewer_id": "user-123",
  "reviewee_id": "user-456",
  "swap_id": "swap-789",
  "rating": 5,
  "comment": "Excellent teacher! Very patient and explained everything clearly.",
  "would_recommend": true,
  "created_at": "2024-12-29T14:30:00Z"
}
```

---

## Step 4: Retrieve Reviews

### Get reviews for a specific user:
```javascript
const { data, error } = await supabase
  .from('reviews')
  .select('*')
  .eq('reviewee_id', userId)
  .order('created_at', { ascending: false });
```

### Get average rating for a user:
```javascript
const { data, error } = await supabase.rpc('get_user_average_rating', {
  user_id: userId
});
```

---

## Step 5: Display Reviews (Already Implemented)

Reviews are displayed in:
1. **User Profile** (`/profile`) - Shows user's own reviews
2. **User Profile Page** (`/profile/:id`) - Shows reviews for any user
3. **Swap Detail** - Shows option to leave review after swap

---

## Security Features

### Row Level Security (RLS) Policies:
- ✅ **Anyone can view** all reviews
- ✅ **Only reviewers can insert** reviews
- ✅ **Only reviewers can update** their own reviews
- ✅ **Only reviewers can delete** their own reviews

### Validation:
- Rating must be 1-5
- Comment must not be empty
- User must be authenticated

---

## Frontend Code

The review submission is handled in `src/pages/SwapDetail.tsx`:

```typescript
const handleLeaveReview = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Insert review into database
  const { data, error } = await supabase.from("reviews").insert([
    {
      reviewer_id: user.id,
      reviewee_id: partner.id,
      swap_id: swap.id,
      rating: reviewRating,
      comment: reviewText,
      would_recommend: true,
    },
  ]);
};
```

---

## Testing

1. **Create a swap** (if you haven't already)
2. **Go to swap detail page**
3. **Click "Leave Review" button**
4. **Enter rating and comment**
5. **Click "Submit Review"**
6. **Check Supabase** → **Table Editor** → **reviews** to verify data

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Reviews not saving | Check if reviews table was created properly |
| "Not authenticated" error | Make sure user is logged in |
| RLS policy errors | Verify RLS policies were applied correctly |
| Rating dropdown empty | Check browser console for errors |

---

## Next Steps

After reviews are working:
1. Display average rating on user profiles
2. Show review count badge
3. Add filters for reviews (sort by rating, date, etc.)
4. Add moderation for reviews
5. Send notifications when user receives a review

