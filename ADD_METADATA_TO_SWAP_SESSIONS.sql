-- Add metadata column to swap_sessions table
-- This is required to store Google Calendar event IDs and other session meta information

ALTER TABLE swap_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN swap_sessions.metadata IS 'Stores additional session data like Google Calendar event ID, meet links, etc.';
