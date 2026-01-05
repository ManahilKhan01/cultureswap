-- ============================================================================
-- CHAT-BASED OFFER SYSTEM MIGRATION
-- ============================================================================

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
);

-- 2. Update swap_offers for chat-first flow
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS skill_offered TEXT;
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS skill_wanted TEXT;
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE swap_offers ALTER COLUMN swap_id DROP NOT NULL;

-- 3. Add conversation_id and offer_id to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES swap_offers(id) ON DELETE CASCADE;

-- 4. Link swaps back to chat and offer
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS origin_offer_id UUID REFERENCES swap_offers(id) ON DELETE SET NULL;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON messages(offer_id);
CREATE INDEX IF NOT EXISTS idx_swap_offers_conversation_id ON swap_offers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_swaps_conversation_id ON swaps(conversation_id);

-- 6. Helper function to get or create a conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(uid1 UUID, uid2 UUID)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
    u1 UUID := LEAST(uid1, uid2);
    u2 UUID := GREATEST(uid1, uid2);
BEGIN
    SELECT id INTO conv_id FROM conversations WHERE user1_id = u1 AND user2_id = u2;
    IF NOT FOUND THEN
        INSERT INTO conversations (user1_id, user2_id) VALUES (u1, u2) RETURNING id INTO conv_id;
    END IF;
    RETURN conv_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Backfill existing messages into conversations
INSERT INTO conversations (user1_id, user2_id)
SELECT DISTINCT 
    CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
    CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
FROM messages
ON CONFLICT DO NOTHING;

-- Update messages to point to the correct conversation
UPDATE messages m
SET conversation_id = c.id
FROM conversations c
WHERE (m.sender_id = c.user1_id AND m.receiver_id = c.user2_id)
   OR (m.sender_id = c.user2_id AND m.receiver_id = c.user1_id);

-- 8. Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 9. Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- Ensure messages and swap_offers are also tracked
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE swap_offers;

-- 10. Grant permissions (for anon/authenticated)
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversations TO anon;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;
GRANT ALL ON swap_offers TO authenticated;
GRANT ALL ON swap_offers TO anon;
