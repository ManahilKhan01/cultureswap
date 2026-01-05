# Sign-up & Login Implementation Guide

## 📋 Complete Step-by-Step Schema & Implementation

This guide walks you through implementing authentication from scratch.

---

## Phase 1: Database Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Set project name: `Cultural Swap`
4. Create a strong database password
5. Wait for project to initialize (2-3 minutes)

### Step 2: Run Schema in Supabase
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy entire contents of `SIGNUP_LOGIN_SCHEMA.sql`
5. Paste into SQL editor
6. Click **Run**

**Expected Result:** ✅ All queries execute successfully

---

## Phase 2: Understanding the Tables

### Table 1: `skill_categories`
**Purpose:** Organize skills by category

```
Languages, Arts & Crafts, Music, Sports & Fitness, etc.
```

**Used for:** Dropdown selection during onboarding

---

### Table 2: `skills`
**Purpose:** Individual skills under categories

```
Spanish, English, Guitar, Piano, etc.
```

**Used for:** User to select which skills to teach/learn

---

### Table 3: `users`
**Purpose:** User profile and account information

**Key Fields:**
- `id` - Links to Supabase Auth
- `email` - User's email
- `full_name` - User's name
- `onboarding_completed` - Has user completed onboarding?
- `is_verified` - Email verified?

**Auto-created when:** User signs up

---

### Table 4: `user_skills`
**Purpose:** Track which skills user teaches/learns

**Example Records:**
```
User: John
Skill: Spanish (teach) - Proficiency: Advanced
Skill: English (learn) - Proficiency: Beginner
```

**Created when:** User selects skills during onboarding

---

## Phase 3: Frontend Implementation

### Step 1: Create Sign-up Form

**File:** `src/pages/Signup.tsx`

```typescript
import { useState } from 'react';
import { authService } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.signup(email, password, fullName);
      // Redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

---

### Step 2: Create Login Form

**File:** `src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { authService } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { session } = await authService.login(email, password);
      if (session) {
        // Save token
        localStorage.setItem('token', session.access_token);
        // Check if user completed onboarding
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

---

### Step 3: Create Onboarding Form

**File:** `src/pages/Onboarding.tsx`

```typescript
import { useState, useEffect } from 'react';
import { skillService, userService } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [skills, setSkills] = useState<any[]>([]);
  const [teachingSkills, setTeachingSkills] = useState<string[]>([]);
  const [learningSkills, setLearningSkills] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get current user and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const profile = await userService.getProfile(currentUser.id);
          setUser(profile);
        }

        // Get categories
        const cats = await skillService.getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, []);

  // Load skills when category changes
  useEffect(() => {
    const loadSkills = async () => {
      if (selectedCategory) {
        const skillList = await skillService.getSkills(selectedCategory);
        setSkills(skillList);
      }
    };

    loadSkills();
  }, [selectedCategory]);

  // Add skill to teaching list
  const addTeachingSkill = (skillId: string) => {
    if (!teachingSkills.includes(skillId)) {
      setTeachingSkills([...teachingSkills, skillId]);
    }
  };

  // Add skill to learning list
  const addLearningSkill = (skillId: string) => {
    if (!learningSkills.includes(skillId)) {
      setLearningSkills([...learningSkills, skillId]);
    }
  };

  // Submit onboarding
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user profile
      await userService.updateProfile(user.id, {
        bio,
        country,
        city,
        onboarding_completed: true,
      });

      // Add teaching skills
      for (const skillId of teachingSkills) {
        await userService.addSkill(user.id, skillId, 'teach', 'intermediate');
      }

      // Add learning skills
      for (const skillId of learningSkills) {
        await userService.addSkill(user.id, skillId, 'learn', 'beginner');
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="onboarding-form">
      <h2>Complete Your Profile</h2>

      {/* Profile Info */}
      <section>
        <h3>Personal Information</h3>
        <input
          type="text"
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </section>

      {/* Skills Selection */}
      <section>
        <h3>Select Skills to Teach</h3>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="skills-list">
          {skills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => addTeachingSkill(skill.id)}
              className={teachingSkills.includes(skill.id) ? 'selected' : ''}
            >
              {skill.name}
            </button>
          ))}
        </div>

        <div className="selected-skills">
          <h4>Teaching:</h4>
          {teachingSkills.map((skillId) => {
            const skill = skills.find((s) => s.id === skillId);
            return <span key={skillId}>{skill?.name}</span>;
          })}
        </div>
      </section>

      {/* Learning Skills */}
      <section>
        <h3>Select Skills to Learn</h3>
        {/* Similar structure as teaching skills */}
      </section>

      <button type="submit" disabled={loading}>
        {loading ? 'Completing...' : 'Complete Onboarding'}
      </button>
    </form>
  );
}
```

---

## Phase 4: Backend API Implementation

### API Endpoint 1: Sign Up

**POST** `/api/auth/signup`

**Request:**
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
    "email": "user@example.com"
  }
}
```

**Implementation in `server.ts`:**
```typescript
app.post('/api/auth/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }
    
    // Create user profile in database
    const { error: profileError } = await supabase.from('users').insert([
      {
        id: authData.user?.id,
        email,
        full_name,
      }
    ]);
    
    if (profileError) {
      res.status(400).json({ error: profileError.message });
      return;
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: authData.user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### API Endpoint 2: Login

**POST** `/api/auth/login`

**Request:**
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
    "expires_in": 3600
  }
}
```

**Implementation in `server.ts`:**
```typescript
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }
    
    res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Phase 5: Environment Variables

Create `.env` file in project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Frontend API
VITE_API_URL=http://localhost:5000

# Backend
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## Phase 6: Complete Flow

### Sign Up Flow
```
1. User → Sign Up Form
2. Form → Backend POST /api/auth/signup
3. Backend → Create in Supabase Auth (password hashing)
4. Backend → Create record in `users` table
5. Response → User redirected to Login
```

### Login Flow
```
1. User → Login Form
2. Form → Backend POST /api/auth/login
3. Backend → Supabase Auth verification
4. Response → JWT token + user data
5. Frontend → Store token in localStorage
6. Frontend → Redirect to Onboarding/Dashboard
```

### Onboarding Flow
```
1. User → Onboarding Form
2. Form → Fetch categories from `/api/skills/categories`
3. Form → Fetch skills from `/api/skills?category=id`
4. User → Select teaching skills
5. User → Select learning skills
6. User → Submit
7. Backend → Update user profile
8. Backend → Create records in `user_skills` table
9. Frontend → Redirect to Dashboard
```

---

## Testing Checklist

- [ ] Sign up with valid email/password
- [ ] Try sign up with duplicate email (should fail)
- [ ] Try sign up with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Check JWT token is stored
- [ ] Complete onboarding flow
- [ ] Verify skills are saved
- [ ] Check user profile is updated

---

## Database Queries You'll Use

### Get user by email
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### Get user skills (teaching)
```sql
SELECT s.name, us.proficiency_level
FROM user_skills us
JOIN skills s ON us.skill_id = s.id
WHERE us.user_id = 'user-uuid' AND us.skill_type = 'teach';
```

### Get user skills (learning)
```sql
SELECT s.name
FROM user_skills us
JOIN skills s ON us.skill_id = s.id
WHERE us.user_id = 'user-uuid' AND us.skill_type = 'learn';
```

### Get all skills in category
```sql
SELECT * FROM skills WHERE category_id = 'category-uuid' ORDER BY is_popular DESC;
```

---

## Next Steps

1. ✅ Run `SIGNUP_LOGIN_SCHEMA.sql` in Supabase
2. 🔄 Create sign-up page in React
3. 🔄 Create login page in React
4. 🔄 Create onboarding page in React
5. 🔄 Implement API endpoints in `server.ts`
6. 🔄 Test all flows
7. 🔄 Add error handling & validation
8. 🔄 Add "remember me" functionality
9. 🔄 Add password reset
10. 🔄 Add email verification

---
