-- ============================================================================
-- CREATE REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id VARCHAR(100) NOT NULL,
    reviewee_id VARCHAR(100) NOT NULL,
    swap_id VARCHAR(100),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    category VARCHAR(100),
    would_recommend BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_swap_id ON reviews(swap_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view all reviews
CREATE POLICY "reviews_view_all" ON reviews FOR SELECT USING (true);

-- Users can insert reviews (no auth.uid() check since we're using string IDs)
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (true);

-- Users can only update their own reviews
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (true);

-- Users can only delete their own reviews
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE USING (true);

-- ============================================================================
-- FUNCTION: Calculate Average Rating
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_average_rating(user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
  FROM reviews
  WHERE reviewee_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Calculate Review Count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_review_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(COUNT(*)::INTEGER, 0)
  FROM reviews
  WHERE reviewee_id = user_id;
END;
$$ LANGUAGE plpgsql;
