-- ============================================================================
-- USER PROFILES DATABASE QUERIES REFERENCE
-- ============================================================================

-- 1. GET USER PROFILE
-- Fetch complete profile for logged-in user or any user
SELECT *
FROM user_profiles
WHERE id = 'user-uuid' OR email = 'user@example.com';

-- 2. CREATE NEW USER PROFILE
-- Executed when user signs up
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  profile_image_url,
  bio,
  city,
  country,
  timezone,
  languages,
  availability,
  skills_offered,
  skills_wanted
) VALUES (
  'auth-user-uuid',
  'user@example.com',
  'John Doe',
  'https://example.com/profile.jpg',
  'I love learning new skills',
  'New York',
  'USA',
  'UTC-05:00',
  ARRAY['English', 'Spanish'],
  'Weekends',
  ARRAY['Web Development', 'JavaScript'],
  ARRAY['Spanish', 'Photography']
);

-- 3. UPDATE USER PROFILE
-- Update multiple fields
UPDATE user_profiles
SET
  full_name = 'John Smith',
  bio = 'Updated bio',
  city = 'Los Angeles',
  timezone = 'UTC-08:00',
  languages = ARRAY['English', 'French', 'Spanish'],
  availability = 'Evenings',
  skills_offered = ARRAY['Web Development', 'JavaScript', 'React'],
  skills_wanted = ARRAY['Photography', 'Cooking'],
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'user-uuid';

-- 4. UPDATE PROFILE IMAGE
UPDATE user_profiles
SET profile_image_url = 'https://new-image-url.jpg'
WHERE id = 'user-uuid';

-- 5. UPDATE SKILLS OFFERED
UPDATE user_profiles
SET skills_offered = ARRAY['Skill1', 'Skill2', 'Skill3']
WHERE id = 'user-uuid';

-- 6. UPDATE SKILLS WANTED
UPDATE user_profiles
SET skills_wanted = ARRAY['Skill1', 'Skill2']
WHERE id = 'user-uuid';

-- 7. ADD LANGUAGE TO USER PROFILE
UPDATE user_profiles
SET languages = array_append(languages, 'German')
WHERE id = 'user-uuid';

-- 8. REMOVE LANGUAGE FROM USER PROFILE
UPDATE user_profiles
SET languages = array_remove(languages, 'German')
WHERE id = 'user-uuid';

-- 9. ADD SKILL TO OFFERED SKILLS
UPDATE user_profiles
SET skills_offered = array_append(skills_offered, 'Python')
WHERE id = 'user-uuid';

-- 10. REMOVE SKILL FROM OFFERED SKILLS
UPDATE user_profiles
SET skills_offered = array_remove(skills_offered, 'Python')
WHERE id = 'user-uuid';

-- 11. GET ALL AVAILABLE TIMEZONES
SELECT name, utc_offset, region
FROM timezones
ORDER BY utc_offset;

-- 12. GET USERS BY COUNTRY
SELECT id, email, full_name, city, country
FROM user_profiles
WHERE country = 'Pakistan'
ORDER BY full_name;

-- 13. GET USERS BY TIMEZONE
SELECT id, email, full_name, timezone, availability
FROM user_profiles
WHERE timezone = 'UTC+05:00'
ORDER BY full_name;

-- 14. SEARCH USERS BY SKILL OFFERED
SELECT id, email, full_name, skills_offered
FROM user_profiles
WHERE skills_offered && ARRAY['Web Development']
ORDER BY full_name;

-- 15. SEARCH USERS BY SKILL WANTED
SELECT id, email, full_name, skills_wanted
FROM user_profiles
WHERE skills_wanted && ARRAY['Photography']
ORDER BY full_name;

-- 16. GET USER WITH ALL DETAILS (JOIN WITH REVIEWS & RATINGS)
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.profile_image_url,
  p.bio,
  p.city,
  p.country,
  p.timezone,
  p.languages,
  p.availability,
  p.skills_offered,
  p.skills_wanted,
  ROUND(AVG(r.rating)::NUMERIC, 2) as average_rating,
  COUNT(r.id) as review_count
FROM user_profiles p
LEFT JOIN reviews r ON p.id = r.reviewee_id
WHERE p.id = 'user-uuid'
GROUP BY p.id;

-- 17. GET PROFILE WITH USER STATS
SELECT 
  p.*,
  (SELECT COUNT(*) FROM swaps WHERE user_id = p.id) as swaps_completed,
  (SELECT COUNT(*) FROM reviews WHERE reviewee_id = p.id) as reviews_received
FROM user_profiles p
WHERE p.id = 'user-uuid';

-- 18. UPDATE ONLY BIO
UPDATE user_profiles
SET bio = 'New bio text'
WHERE id = 'user-uuid';

-- 19. UPDATE ONLY TIMEZONE
UPDATE user_profiles
SET timezone = 'UTC+06:00'
WHERE id = 'user-uuid';

-- 20. UPDATE ONLY AVAILABILITY
UPDATE user_profiles
SET availability = 'Weekdays (9AM-5PM)'
WHERE id = 'user-uuid';

-- 21. GET PROFILE BY EMAIL
SELECT *
FROM user_profiles
WHERE email = 'user@example.com';

-- 22. GET PROFILES NEAR LOCATION
SELECT 
  id,
  full_name,
  city,
  country,
  profile_image_url
FROM user_profiles
WHERE country = 'USA'
ORDER BY city;

-- 23. UPDATE PROFILE WITH ARRAYS
UPDATE user_profiles
SET 
  full_name = 'Updated Name',
  languages = ARRAY['English', 'Urdu', 'Hindi'],
  skills_offered = ARRAY['Teaching', 'Speaking'],
  skills_wanted = ARRAY['Programming', 'Design'],
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'user-uuid';

-- 24. CHECK IF PROFILE EXISTS
SELECT EXISTS(
  SELECT 1 FROM user_profiles WHERE id = 'user-uuid'
);

-- 25. GET ALL PROFILES WITH FILTERS
SELECT *
FROM user_profiles
WHERE country = 'Pakistan' 
  AND timezone = 'UTC+05:00'
  AND skills_offered && ARRAY['Teaching']
ORDER BY created_at DESC;
