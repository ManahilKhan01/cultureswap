-- Swap Offers Migration
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- 1. Create swap_offers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS swap_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_id UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  session_days TEXT[] NOT NULL,
  duration TEXT NOT NULL,
  schedule TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Add partner_id column to swaps table
-- ============================================================================

ALTER TABLE swaps ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES auth.users(id);

-- ============================================================================
-- 3. Enable RLS on swap_offers
-- ============================================================================

ALTER TABLE swap_offers ENABLE ROW LEVEL SECURITY;

-- Users can view offers they sent or received
CREATE POLICY "Users can view their offers" ON swap_offers
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create offers
CREATE POLICY "Users can create offers" ON swap_offers
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Receiver can update offer status
CREATE POLICY "Receiver can update offer status" ON swap_offers
  FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================================================
-- 4. Create updated_at trigger for swap_offers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_swap_offers_updated_at
  BEFORE UPDATE ON swap_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Enable realtime for swap_offers and swaps
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE swap_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE swaps;
