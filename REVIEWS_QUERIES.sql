-- ============================================================================
-- REVIEWS DATABASE QUERIES REFERENCE
-- ============================================================================

-- 1. CREATE NEW REVIEW
-- This is executed when user submits a review on the swap detail page
INSERT INTO reviews (reviewer_id, reviewee_id, swap_id, rating, comment, would_recommend)
VALUES (
  'current-user-uuid',
  'reviewed-user-uuid',
  'swap-uuid',
  5,
  'Excellent experience!',
  true
);

-- 2. GET ALL REVIEWS FOR A USER
-- Returns all reviews received by a specific user
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.created_at,
  u.email as reviewer_email,
  u.full_name as reviewer_name
FROM reviews r
LEFT JOIN auth.users u ON r.reviewer_id = u.id
WHERE r.reviewee_id = 'user-uuid'
ORDER BY r.created_at DESC;

-- 3. GET AVERAGE RATING FOR A USER
-- Calculate the average rating received by a user
SELECT 
  ROUND(AVG(rating)::NUMERIC, 2) as average_rating,
  COUNT(*) as total_reviews,
  reviewee_id
FROM reviews
WHERE reviewee_id = 'user-uuid'
GROUP BY reviewee_id;

-- 4. GET REVIEWS WITH REVIEWER INFO
-- Get detailed reviews with reviewer information
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.created_at,
  r.would_recommend,
  u.email as reviewer_email,
  u.full_name as reviewer_name
FROM reviews r
LEFT JOIN auth.users u ON r.reviewer_id = u.id
WHERE r.reviewee_id = 'user-uuid'
ORDER BY r.created_at DESC
LIMIT 10;

-- 5. GET RECENT REVIEWS (LAST 30 DAYS)
-- Get reviews posted in the last 30 days
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.created_at,
  u.full_name as reviewer_name
FROM reviews r
LEFT JOIN auth.users u ON r.reviewer_id = u.id
WHERE r.created_at >= NOW() - INTERVAL '30 days'
ORDER BY r.created_at DESC;

-- 6. GET REVIEWS FOR A SPECIFIC SWAP
-- Get all reviews related to a particular swap
SELECT *
FROM reviews
WHERE swap_id = 'swap-uuid'
ORDER BY created_at DESC;

-- 7. UPDATE A REVIEW
-- User can only update their own review
UPDATE reviews
SET comment = 'Updated comment text', rating = 4
WHERE id = 'review-uuid' AND reviewer_id = 'current-user-uuid';

-- 8. DELETE A REVIEW
-- User can only delete their own review
DELETE FROM reviews
WHERE id = 'review-uuid' AND reviewer_id = 'current-user-uuid';

-- 9. CHECK IF USER ALREADY REVIEWED ANOTHER USER FOR A SWAP
-- Prevent multiple reviews for same swap
SELECT *
FROM reviews
WHERE reviewer_id = 'current-user-uuid' 
  AND reviewee_id = 'other-user-uuid'
  AND swap_id = 'swap-uuid';

-- 10. GET USER TRUST SCORE (RATING + REVIEW COUNT)
-- Calculate overall user rating score
SELECT 
  reviewee_id,
  ROUND(AVG(rating)::NUMERIC, 2) as rating,
  COUNT(*) as review_count
FROM reviews
GROUP BY reviewee_id
ORDER BY rating DESC;

-- 11. GET TOP RATED USERS
-- Get users with highest average ratings
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(r.id) as review_count,
  ROUND(AVG(r.rating)::NUMERIC, 2) as average_rating
FROM auth.users u
LEFT JOIN reviews r ON u.id = r.reviewee_id
GROUP BY u.id, u.email, u.full_name
HAVING COUNT(r.id) > 0
ORDER BY average_rating DESC
LIMIT 10;

-- 12. GET RATING DISTRIBUTION FOR A USER
-- See how many 1-star, 2-star, 3-star, 4-star, 5-star reviews
SELECT 
  rating,
  COUNT(*) as count
FROM reviews
WHERE reviewee_id = 'user-uuid'
GROUP BY rating
ORDER BY rating DESC;
