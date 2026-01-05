# Cultural Swap - Environment Setup Guide

## Overview
This guide will help you set up your Supabase database and configure your frontend and backend for the Cultural Swap application.

---

## Step 1: Create a Supabase Project

1. **Visit Supabase**: Go to [https://supabase.com](https://supabase.com)
2. **Sign In/Sign Up**: Create or log into your account
3. **Create New Project**:
   - Click "New Project"
   - Project Name: `Cultural Swap` (or your preferred name)
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your users
   - Pricing Plan: Select "Free" for testing
4. **Click "Create new project"** and wait for initialization (2-3 minutes)

---

## Step 2: Get Your Supabase Credentials

Once your project is created:

1. **Go to Settings → API**
2. Copy these values:
   - `VITE_SUPABASE_URL` - The "Project URL" 
   - `VITE_SUPABASE_ANON_KEY` - The "anon public" key

**Example:**
```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Run the Database Schema

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Create a New Query** (Click "+" button)
3. **Copy the entire contents** from [supabase_schema.sql](../supabase_schema.sql)
4. **Paste** into the SQL Editor
5. **Click "Run"** button to execute

This will create:
- All database tables
- Indexes for performance
- Row Level Security (RLS) policies
- Functions and triggers
- Sample data (skill categories, skills)

**Expected Output:** ✅ All queries execute successfully

---

## Step 4: Configure Frontend Environment

### Create `.env` file in project root

```bash
cd c:\Users\haziq\Downloads\Tasks\Cultureal_swap_updated
```

Create `.env` file:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API
VITE_API_URL=http://localhost:5000
```

### Create `.env.local` file (for local development)

```env
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000

# Development
VITE_NODE_ENV=development
```

---

## Step 5: Configure Backend Environment

Create `.env` file in project root (or backend folder):

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_very_secret_jwt_key_here_min_32_chars
JWT_EXPIRE=7d

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@culturalswap.com

# Database
DATABASE_URL=postgresql://postgres:[password]@localhost:5432/cultural_swap
```

---

## Step 6: Install Dependencies

### Frontend
```bash
cd c:\Users\haziq\Downloads\Tasks\Cultureal_swap_updated
npm install
# or
bun install
```

### Backend (if using Node.js backend)
```bash
npm install express cors dotenv @supabase/supabase-js
npm install -D typescript ts-node @types/express @types/node
```

---

## Step 7: Enable Authentication & Disable Email Verification

### In Supabase Dashboard:

1. **Go to Authentication → Providers**
2. **Enable Email Provider:**
   - Click "Email"
   - Toggle "Enable Email provider"
   - Keep defaults
   - Click "Save"

### ⚠️ IMPORTANT: Disable Email Verification (for Development)

**To allow users to login immediately after signup:**

1. **Go to Authentication → Settings**
2. **Scroll to "Email"** section
3. **Turn OFF** "Confirm email" toggle
4. **Click "Save"**

This allows users to login with their email/password immediately without needing to verify their email first. 

> ⚠️ **NOTE:** For production, you should re-enable this and implement email verification in your app.

3. **Configure Authentication Settings:**
   - Go to Authentication → Settings
   - **JWT Settings:**
     - Token expiration: 3600 (1 hour)
     - Refresh token rotation: enabled
   
   - **Email Configuration:**
     - Confirm email: enabled
     - Double confirm changes: disabled
   
   - **URL Configuration:**
     - Add these redirect URLs:
       ```
       http://localhost:5173/auth/callback
       http://localhost:5173/confirm
       https://yourdomain.com/auth/callback (for production)
       ```

---

## Step 8: Test the Setup

### Test Authentication:

```bash
# In your terminal, test Supabase connectivity
curl https://your-project.supabase.co/rest/v1/skill_categories \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json"
```

You should get back a JSON array of skill categories.

### Test Frontend:

```bash
# Start development server
npm run dev
# or
bun dev
```

Visit `http://localhost:5173` and try:
- Sign up with a test email
- Log in
- View skills

---

## Step 9: Verify Row Level Security (RLS)

1. **Go to Authentication → Users**
2. Create a test user
3. **Go to SQL Editor** and run:
   ```sql
   -- Check if RLS is enabled
   SELECT * FROM users;
   ```
4. You should only see your own user (if logged in)

---

## Step 10: Database Backup

In Supabase Dashboard:

1. **Go to Settings → Backups**
2. **Enable automated backups**
3. Backup frequency: Daily
4. Backup retention: 30 days

---

## Quick Reference: Environment Variables

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `VITE_SUPABASE_URL` | `https://abc.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API → anon key |
| `SUPABASE_SERVICE_KEY` | `eyJhbGc...` (different) | Supabase Dashboard → Settings → API → service_role key |
| `JWT_SECRET` | `your_secret_key_min_32_chars` | Generate yourself |
| `FRONTEND_URL` | `http://localhost:5173` | Your frontend URL |
| `PORT` | `5000` | Choose port for backend |

---

## Troubleshooting

### Issue: "Missing environment variables"
**Solution:**
- Check `.env` file is in the correct directory
- Verify `VITE_` prefix for frontend env vars
- Restart dev server after changing `.env`

### Issue: "CORS error when connecting to API"
**Solution:**
- Make sure backend CORS is configured correctly
- Add frontend URL to CORS whitelist in backend
- Check backend is running on correct port

### Issue: "Authentication failing"
**Solution:**
- Verify email provider is enabled in Supabase
- Check redirect URLs are correct in Authentication settings
- Clear browser cookies and try again

### Issue: "Database tables not created"
**Solution:**
- Run schema again in SQL Editor
- Check for SQL errors in the editor
- Verify you copied the entire schema file

### Issue: "Row Level Security blocking queries"
**Solution:**
- User must be authenticated
- Check RLS policies in SQL Editor
- View → Policies to see all policies

---

## Common API Endpoints

Once your backend is running at `http://localhost:5000`:

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get skills
curl http://localhost:5000/api/skills

# Get user profile
curl http://localhost:5000/api/users/[user-id] \
  -H "Authorization: Bearer [jwt-token]"
```

---

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database schema
3. ✅ Configure environment variables
4. ✅ Test authentication
5. 🔄 Build onboarding flow UI
6. 🔄 Implement skill selection feature
7. 🔄 Build messaging interface
8. 🔄 Add review/rating system
9. 🔄 Deploy to production

---

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase API Reference](https://supabase.com/docs/reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

## Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong value
- [ ] Enable HTTPS only
- [ ] Set up Row Level Security policies
- [ ] Enable email verification
- [ ] Configure backup strategy
- [ ] Set up monitoring/logging
- [ ] Test all authentication flows
- [ ] Review CORS settings
- [ ] Set up rate limiting
- [ ] Enable database encryption

---

