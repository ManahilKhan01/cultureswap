import { supabase } from './supabase';

// In-memory cache for ratings (cached for 5 minutes)
const ratingsCache = new Map<string, { rating: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const reviewService = {
  // Get average rating for a user (OPTIMIZED with caching)
  async getAverageRating(userId: string) {
    try {
      // Check cache first
      const cached = ratingsCache.get(userId);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.rating;
      }

      // Fetch from database if not cached or expired
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', userId);

      if (error) {
        console.error('Error fetching ratings:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        // Cache zero rating too
        ratingsCache.set(userId, { rating: 0, timestamp: now });
        return 0;
      }

      // Calculate average
      const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
      const roundedAverage = Math.round(average * 10) / 10;

      // Store in cache
      ratingsCache.set(userId, { rating: roundedAverage, timestamp: now });

      return roundedAverage;
    } catch (error) {
      console.error('reviewService.getAverageRating error:', error);
      return 0;
    }
  },

  // Get all reviews for a user
  async getReviewsForUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('reviewService.getReviewsForUser error:', error);
      throw error;
    }
  },

  // Create a review
  async createReview(reviewData: {
    reviewer_id: string;
    reviewee_id: string;
    swap_id: string;
    rating: number;
    comment: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select();

      if (error) {
        console.error('Error creating review:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('reviewService.createReview error:', error);
      throw error;
    }
  },

  // Get review count for a user
  async getReviewCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('reviewee_id', userId);

      if (error) {
        console.error('Error fetching review count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('reviewService.getReviewCount error:', error);
      return 0;
    }
  }
};
