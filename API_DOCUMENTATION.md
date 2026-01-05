# Cultural Swap - API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.culturalswap.com/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {JWT_TOKEN}
```

---

## 1. Authentication Endpoints

### Sign Up
Create a new user account.

```
POST /auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    }
  }
}
```

**Error (400):**
```json
{
  "error": "User already registered"
}
```

---

### Login
Authenticate user and get access token.

```
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

---

### Logout
```
POST /auth/logout
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Forgot Password
Request password reset email.

```
POST /auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

---

## 2. User Endpoints

### Get User Profile
Retrieve user profile with statistics.

```
GET /users/{userId}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "bio": "I love learning new languages",
  "profile_picture_url": "https://...",
  "country": "Canada",
  "city": "Toronto",
  "trust_score": 4.8,
  "total_ratings": 12,
  "completed_swaps": 8,
  "is_verified": true,
  "skills_teaching_count": 3,
  "skills_learning_count": 2,
  "average_rating": 4.8
}
```

---

### Update User Profile
Update user profile information.

```
PUT /users/{userId}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "bio": "Language enthusiast and teacher",
  "country": "Canada",
  "city": "Toronto",
  "timezone": "America/Toronto",
  "phone_number": "+1234567890"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "bio": "Language enthusiast and teacher"
  }
}
```

---

### Search Users
Search for users by name or skills.

```
GET /users/search?q={query}&skill={skillId}&limit={limit}&offset={offset}
```

**Query Parameters:**
- `q` (optional): Search query
- `skill` (optional): Filter by skill ID
- `limit` (optional): Results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "full_name": "Jane Smith",
    "profile_picture_url": "https://...",
    "country": "USA",
    "city": "New York",
    "trust_score": 4.9,
    "skills_teaching_count": 2,
    "skills_learning_count": 1,
    "average_rating": 4.9
  }
]
```

---

### Get User Skills
Retrieve user's teach or learn skills.

```
GET /users/{userId}/skills?type={teach|learn}
```

**Query Parameters:**
- `type` (optional): 'teach' or 'learn' (if not specified, returns both)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "skill_type": "teach",
    "proficiency_level": "advanced",
    "years_of_experience": 5,
    "is_primary": true,
    "skills": {
      "id": "uuid",
      "name": "Spanish",
      "description": "Learn Spanish language",
      "difficulty_level": "beginner",
      "skill_categories": {
        "name": "Languages",
        "icon": "globe",
        "color": "#FF6B6B"
      }
    }
  }
]
```

---

## 3. Skill Endpoints

### Get All Skills
Retrieve all available skills with filtering.

```
GET /skills?category={categoryId}&difficulty={beginner|intermediate|advanced}&search={query}&limit={limit}&offset={offset}
```

**Query Parameters:**
- `category` (optional): Filter by category ID
- `difficulty` (optional): Filter by difficulty level
- `search` (optional): Search by skill name
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Spanish",
    "description": "Learn Spanish language",
    "difficulty_level": "beginner",
    "estimated_hours": 100,
    "is_popular": true,
    "skill_categories": {
      "id": "uuid",
      "name": "Languages",
      "icon": "globe",
      "color": "#FF6B6B"
    }
  }
]
```

---

### Get Skill Categories
Retrieve all skill categories.

```
GET /skills/categories
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Languages",
    "description": "Language learning and teaching",
    "icon": "globe",
    "color": "#FF6B6B"
  },
  {
    "id": "uuid",
    "name": "Arts & Crafts",
    "description": "Art, crafts, and creative skills",
    "icon": "palette",
    "color": "#4ECDC4"
  }
]
```

---

### Add Skill to User
Add a skill to user's teach or learn list.

```
POST /users/skills
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "skill_id": "uuid",
  "skill_type": "teach",
  "proficiency_level": "advanced",
  "years_of_experience": 5
}
```

**Response (201):**
```json
{
  "message": "Skill added successfully",
  "skill": {
    "id": "uuid",
    "user_id": "uuid",
    "skill_id": "uuid",
    "skill_type": "teach",
    "proficiency_level": "advanced"
  }
}
```

---

## 4. Messaging Endpoints

### Get Conversations
Retrieve user's message conversations.

```
GET /messages?limit={limit}&offset={offset}
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user1_id": "uuid",
    "user2_id": "uuid",
    "user1_name": "John Doe",
    "user2_name": "Jane Smith",
    "last_message_content": "Sounds great! When are you available?",
    "last_message_at": "2024-01-15T10:30:00Z",
    "user1_unread_count": 0,
    "user2_unread_count": 2
  }
]
```

---

### Get Conversation Messages
Retrieve messages between two users.

```
GET /messages/{userId}?limit={limit}&offset={offset}
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "content": "Hi! I'd like to learn Spanish",
    "media_urls": [],
    "is_read": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### Send Message
Send a message to another user.

```
POST /messages
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipient_id": "uuid",
  "content": "Hi! I'd like to learn Spanish from you",
  "swap_id": "uuid" (optional)
}
```

**Response (201):**
```json
{
  "message": "Message sent",
  "data": {
    "id": "uuid",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "content": "Hi! I'd like to learn Spanish from you",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Mark Message as Read
Mark a message as read.

```
PUT /messages/{messageId}/read
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "message": "Message marked as read",
  "data": {
    "id": "uuid",
    "is_read": true,
    "read_at": "2024-01-15T10:31:00Z"
  }
}
```

---

## 5. Swap/Exchange Endpoints

### Get Swaps
Retrieve skill exchange requests.

```
GET /swaps?status={pending|accepted|completed|cancelled}&limit={limit}&offset={offset}
```

**Query Parameters:**
- `status` (optional): Filter by swap status
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "initiator_id": "uuid",
    "recipient_id": "uuid",
    "initiator_skill_id": "uuid",
    "recipient_skill_id": "uuid",
    "status": "pending",
    "message": "I'd like to exchange Spanish for English",
    "proposed_date": "2024-01-20",
    "proposed_time": "14:00:00",
    "meeting_mode": "online",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### Create Swap Request
Create a new skill exchange request.

```
POST /swaps
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipient_id": "uuid",
  "initiator_skill_id": "uuid",
  "recipient_skill_id": "uuid",
  "message": "I'd like to exchange Spanish for English",
  "proposed_date": "2024-01-20",
  "proposed_time": "14:00:00",
  "meeting_mode": "online"
}
```

**Response (201):**
```json
{
  "message": "Swap request created",
  "swap": {
    "id": "uuid",
    "initiator_id": "uuid",
    "recipient_id": "uuid",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Update Swap Status
Accept, reject, or complete a swap.

```
PUT /swaps/{swapId}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "accepted",
  "message": "Great! Looking forward to it"
}
```

**Response (200):**
```json
{
  "message": "Swap updated",
  "swap": {
    "id": "uuid",
    "status": "accepted",
    "updated_at": "2024-01-15T10:31:00Z"
  }
}
```

---

## 6. Review Endpoints

### Create Review
Create a review for a completed swap.

```
POST /reviews
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reviewee_id": "uuid",
  "swap_id": "uuid",
  "rating": 5,
  "comment": "Excellent teacher! Very patient and clear",
  "category": "teaching_quality",
  "would_recommend": true
}
```

**Response (201):**
```json
{
  "message": "Review created",
  "review": {
    "id": "uuid",
    "reviewer_id": "uuid",
    "reviewee_id": "uuid",
    "rating": 5,
    "comment": "Excellent teacher! Very patient and clear",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### Get User Reviews
Retrieve reviews for a user.

```
GET /reviews/user/{userId}
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "reviewer_id": "uuid",
    "reviewee_id": "uuid",
    "rating": 5,
    "comment": "Excellent teacher!",
    "category": "teaching_quality",
    "would_recommend": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## 7. Notification Endpoints

### Get Notifications
Retrieve user's notifications.

```
GET /notifications?limit={limit}&offset={offset}
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "swap_request",
    "title": "New Swap Request",
    "content": "John Doe wants to exchange Spanish for English",
    "is_read": false,
    "action_url": "/swaps/uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### Mark Notification as Read
Mark a notification as read.

```
PUT /notifications/{notificationId}/read
Authorization: Bearer {JWT_TOKEN}
```

**Response (200):**
```json
{
  "message": "Notification marked as read",
  "data": {
    "id": "uuid",
    "is_read": true,
    "read_at": "2024-01-15T10:31:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **Auth endpoints**: 10 requests per minute

---

## Pagination

For list endpoints, use `limit` and `offset` parameters:

```
GET /skills?limit=20&offset=0
```

- Maximum limit: 100
- Default limit: 50
- Default offset: 0

---

## Sorting

Most list endpoints support sorting:

```
GET /swaps?sort=-created_at    (descending)
GET /swaps?sort=created_at     (ascending)
```

---

## Real-time Updates

Connect to WebSocket for real-time message updates:

```javascript
const channel = supabase
  .channel(`messages:recipient_id=eq.${userId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => console.log(payload)
  )
  .subscribe();
```

---

## Testing with cURL

### Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Password123!",
    "full_name":"Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Password123!"
  }'
```

### Get Skills
```bash
curl http://localhost:5000/api/skills \
  -H "Content-Type: application/json"
```

---

## Webhooks (Coming Soon)

Subscribe to events:
- User registered
- Swap completed
- Review created
- Message sent

---

## Rate Limits and Quotas

| Feature | Free | Pro |
|---------|------|-----|
| API Calls/month | 100k | Unlimited |
| Storage | 500MB | 100GB |
| Real-time connections | 10 | 100 |
| Backups | Daily | Hourly |

---

