-- ============================================================================
-- CREATE USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    profile_picture_url TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_all_profiles" ON users FOR SELECT USING (true);

CREATE POLICY "users_update_own_profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
