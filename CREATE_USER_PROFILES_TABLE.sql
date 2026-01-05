-- ============================================================================
-- CREATE USER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    profile_image_url TEXT,
    bio TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(50),
    languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    availability VARCHAR(100),
    skills_offered TEXT[] DEFAULT ARRAY[]::TEXT[],
    skills_wanted TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view all profiles
CREATE POLICY "profiles_view_all" ON user_profiles FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Users cannot delete their profile
CREATE POLICY "profiles_no_delete" ON user_profiles FOR DELETE USING (false);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at_trigger
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_timestamp();

-- ============================================================================
-- AVAILABLE TIMEZONES (Reference Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS timezones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    utc_offset VARCHAR(10),
    region VARCHAR(100)
);

-- Insert common timezones
INSERT INTO timezones (name, utc_offset, region) VALUES
('UTC-12:00', '-12:00', 'Etc/GMT+12'),
('UTC-11:00', '-11:00', 'Pacific/Samoa'),
('UTC-10:00', '-10:00', 'Pacific/Honolulu'),
('UTC-09:00', '-09:00', 'America/Anchorage'),
('UTC-08:00', '-08:00', 'America/Los_Angeles'),
('UTC-07:00', '-07:00', 'America/Denver'),
('UTC-06:00', '-06:00', 'America/Chicago'),
('UTC-05:00', '-05:00', 'America/New_York'),
('UTC-04:00', '-04:00', 'America/Toronto'),
('UTC-03:30', '-03:30', 'America/St_Johns'),
('UTC-03:00', '-03:00', 'America/Buenos_Aires'),
('UTC-02:00', '-02:00', 'Etc/GMT+2'),
('UTC-01:00', '-01:00', 'Atlantic/Azores'),
('UTC+00:00', '+00:00', 'Europe/London'),
('UTC+01:00', '+01:00', 'Europe/Paris'),
('UTC+02:00', '+02:00', 'Africa/Cairo'),
('UTC+03:00', '+03:00', 'Asia/Dubai'),
('UTC+04:00', '+04:00', 'Asia/Baku'),
('UTC+05:00', '+05:00', 'Asia/Karachi'),
('UTC+05:30', '+05:30', 'Asia/Kolkata'),
('UTC+06:00', '+06:00', 'Asia/Dhaka'),
('UTC+07:00', '+07:00', 'Asia/Bangkok'),
('UTC+08:00', '+08:00', 'Asia/Shanghai'),
('UTC+09:00', '+09:00', 'Asia/Tokyo'),
('UTC+10:00', '+10:00', 'Australia/Sydney'),
('UTC+11:00', '+11:00', 'Pacific/Fiji'),
('UTC+12:00', '+12:00', 'Pacific/Auckland')
ON CONFLICT (name) DO NOTHING;
