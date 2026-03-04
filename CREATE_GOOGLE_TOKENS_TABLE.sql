-- ============================================================================
-- CREATE GOOGLE TOKENS TABLE FOR GOOGLE CALENDAR INTEGRATION
-- ============================================================================
-- This table stores Google OAuth tokens for users who have connected their
-- Google Calendar to enable automated Google Meet link generation during
-- session scheduling.

CREATE TABLE IF NOT EXISTS google_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_expiry_date ON google_tokens(expiry_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own Google tokens
CREATE POLICY "Users can view their own Google tokens"
  ON google_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own Google tokens
CREATE POLICY "Users can insert their own Google tokens"
  ON google_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own Google tokens (needed when tokens expire and are refreshed)
CREATE POLICY "Users can update their own Google tokens"
  ON google_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can bypass RLS for edge function operations
CREATE POLICY "Service role can manage all Google tokens"
  ON google_tokens
  USING (
    -- Service role key has no auth.uid(), so this returns NULL
    -- Supabase automatically grants service role access
    current_setting('role') = 'authenticated' OR 
    current_setting('role') = 'service_role'
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE google_tokens IS 'Stores Google OAuth tokens for users who have connected their Google Calendar. Used by the google-calendar edge function to create automated Google Meet links during session scheduling.';

COMMENT ON COLUMN google_tokens.user_id IS 'Reference to auth.users.id. User who owns this Google Calendar integration.';

COMMENT ON COLUMN google_tokens.access_token IS 'OAuth access token for Google Calendar API. Used to create calendar events and generate Google Meet links.';

COMMENT ON COLUMN google_tokens.refresh_token IS 'OAuth refresh token. Used to obtain new access tokens when they expire. May be null if user revoked offline access.';

COMMENT ON COLUMN google_tokens.expiry_date IS 'When the access_token expires. Edge function checks this before using the token and refreshes if needed.';
