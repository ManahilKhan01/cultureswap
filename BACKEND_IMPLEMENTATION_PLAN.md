# Cultural Swap - Backend Implementation Plan

## Overview
This document outlines the complete backend architecture for the Cultural Swap application using Supabase (PostgreSQL) as the database and Node.js/Express for the API server.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼─────┐    ┌────▼─────┐   ┌────▼─────┐
    │ REST API │    │Real-time │   │Auth Flow │
    │Endpoints │    │Updates   │   │(JWT)     │
    └────┬─────┘    └────┬─────┘   └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │   Supabase (PostgreSQL)       │
         │   - Authentication            │
         │   - Database Storage          │
         │   - Real-time Subscriptions   │
         └───────────────────────────────┘
```

---

## Core Features & Database Schema

### 1. **User Management**
- User Registration & Login (Supabase Auth)
- User Profiles with Skills
- User Verification & Trust Score
- Onboarding Flow

### 2. **Skill Exchange**
- Skill Categories
- User Skills (To Teach / To Learn)
- Skill Discovery & Search
- Advanced Filtering

### 3. **Messaging**
- Direct Messages between users
- Real-time Chat
- Message History

### 4. **Reviews & Ratings**
- User Reviews
- Rating System (1-5 stars)
- Trust Score Calculation

### 5. **Swaps/Exchanges**
- Swap Requests
- Swap Status Tracking
- Exchange History

---

## Database Schema

### Tables Overview
1. `users` - User profiles and account info
2. `user_skills` - Skills users teach/learn
3. `skills` - Available skills in the system
4. `skill_categories` - Categories for skills
5. `messages` - Direct messages between users
6. `reviews` - User reviews and ratings
7. `swaps` - Skill exchange requests
8. `notifications` - User notifications
9. `user_availability` - Schedule/availability info

---

## Setup Instructions

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project initialization

### Step 2: Run SQL Schema (See SQL file)
1. Go to SQL Editor in Supabase Dashboard
2. Copy-paste entire schema from `supabase_schema.sql`
3. Execute all queries

### Step 3: Configure Authentication
- Enable Email/Password auth in Authentication settings
- Set redirect URLs for your frontend

### Step 4: Get API Keys
- Go to Settings → API
- Copy `ANON KEY` and `SERVICE_ROLE KEY`
- Save to `.env` file

### Step 5: Set Row Level Security (RLS) Policies
- RLS is already handled in the schema file

---

## Backend API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Password reset

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `GET /api/users/search` - Search users
- `GET /api/users/:id/skills` - Get user's skills

### Skills
- `GET /api/skills` - List all skills
- `GET /api/skills/categories` - Get skill categories
- `GET /api/skills/search` - Search skills
- `POST /api/users/skills` - Add skill to user
- `DELETE /api/users/skills/:id` - Remove skill from user

### Messaging
- `GET /api/messages/:userId` - Get conversation
- `POST /api/messages` - Send message
- `GET /api/messages` - Get all conversations
- `PUT /api/messages/:id/read` - Mark as read
- `WebSocket /ws/messages` - Real-time messages

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:userId` - Get user reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Swaps
- `GET /api/swaps` - List swaps
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/:id` - Update swap status
- `GET /api/swaps/:id` - Get swap details

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

---

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend Server
NODE_ENV=development
PORT=5000
DATABASE_URL=your_postgresql_url

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
```

---

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime / WebSockets
- **Authentication**: Supabase Auth (JWT)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

---

## Implementation Phases

### Phase 1: Database & Auth (Week 1)
- ✅ Set up Supabase project
- ✅ Create database schema
- ✅ Configure authentication
- ✅ Set up Row Level Security

### Phase 2: User & Skills API (Week 2)
- Create user management endpoints
- Create skill management endpoints
- Implement search & filtering
- Add onboarding flow

### Phase 3: Messaging (Week 3)
- Implement direct messaging
- Add real-time updates
- Create conversation management
- Add message history

### Phase 4: Reviews & Trust (Week 4)
- Implement review system
- Calculate trust scores
- Add rating endpoints
- Create verification system

### Phase 5: Swaps & Integration (Week 5)
- Create swap request system
- Integrate all features
- Testing & deployment
- Performance optimization

---

## Security Considerations

1. **Row Level Security (RLS)** - Users can only access their own data
2. **JWT Tokens** - Secure token-based authentication
3. **Rate Limiting** - Prevent abuse on public endpoints
4. **Data Validation** - Server-side validation for all inputs
5. **CORS** - Properly configured CORS policies
6. **HTTPS Only** - All communication encrypted
7. **Password Hashing** - Bcrypt for password hashing
8. **SQL Injection Prevention** - Use parameterized queries

---

## Performance Optimization

1. **Indexing** - Proper indexes on frequently queried columns
2. **Pagination** - Implement pagination for large datasets
3. **Caching** - Redis caching for frequent queries
4. **Connection Pooling** - Use PgBouncer for connection management
5. **CDN** - Serve static assets from CDN

---

## Testing Strategy

- Unit tests for API endpoints
- Integration tests for database operations
- End-to-end tests for user workflows
- Load testing for performance validation
- Security testing for vulnerabilities

---

## Deployment

- **Development**: Local environment with Docker
- **Staging**: Staging Supabase project
- **Production**: Production Supabase project with backups
- **CI/CD**: GitHub Actions for automated testing & deployment

---

## Next Steps

1. Run the SQL schema file on your Supabase database
2. Configure environment variables
3. Set up authentication policies
4. Begin Phase 1 implementation
5. Test all endpoints thoroughly

