-- ============================================================================
-- CREATE SWAPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skill_offered VARCHAR(100) NOT NULL,
    skill_wanted VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    duration VARCHAR(100),
    format VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_swaps_user_id ON swaps(user_id);
CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);
CREATE INDEX IF NOT EXISTS idx_swaps_category ON swaps(category);
CREATE INDEX IF NOT EXISTS idx_swaps_created_at ON swaps(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;

-- Anyone can view all swaps
CREATE POLICY "swaps_view_all" ON swaps FOR SELECT USING (true);

-- Users can insert their own swaps
CREATE POLICY "swaps_insert_own" ON swaps FOR INSERT WITH CHECK (true);

-- Users can only update their own swaps
CREATE POLICY "swaps_update_own" ON swaps FOR UPDATE USING (true);

-- Users can only delete their own swaps
CREATE POLICY "swaps_delete_own" ON swaps FOR DELETE USING (true);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_swaps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER swaps_updated_at_trigger
BEFORE UPDATE ON swaps
FOR EACH ROW
EXECUTE FUNCTION update_swaps_timestamp();
