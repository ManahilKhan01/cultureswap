import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

export const authService = {
  // Sign up new user
  async signup(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          email,
          full_name: fullName,
        },
      ]);

      if (profileError) throw profileError;
    }

    return data;
  },

  // Login user
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Logout user
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  // Get session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export const userService = {
  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles_with_stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get user skills
  async getUserSkills(userId: string, skillType?: 'teach' | 'learn') {
    let query = supabase
      .from('user_skills')
      .select(
        `
        id,
        skill_type,
        proficiency_level,
        years_of_experience,
        is_primary,
        skills (
          id,
          name,
          description,
          difficulty_level,
          skill_categories (name, icon, color)
        )
      `
      )
      .eq('user_id', userId);

    if (skillType) {
      query = query.eq('skill_type', skillType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Add skill to user
  async addSkill(
    userId: string,
    skillId: string,
    skillType: 'teach' | 'learn',
    proficiencyLevel?: string
  ) {
    const { data, error } = await supabase.from('user_skills').insert([
      {
        user_id: userId,
        skill_id: skillId,
        skill_type: skillType,
        proficiency_level: proficiencyLevel,
      },
    ]);

    if (error) throw error;
    return data;
  },

  // Remove skill from user
  async removeSkill(skillId: string) {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', skillId);

    if (error) throw error;
  },

  // Search users
  async searchUsers(query: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('user_profiles_with_stats')
      .select('*')
      .eq('is_verified', true)
      .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get user by ID
  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles_with_stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================================================
// SKILL FUNCTIONS
// ============================================================================

export const skillService = {
  // Get all skills
  async getSkills(category?: string, difficulty?: string, search?: string) {
    let query = supabase.from('skills').select(`
      id,
      name,
      description,
      difficulty_level,
      estimated_hours,
      is_popular,
      skill_categories (id, name, icon, color)
    `);

    if (category) {
      query = query.eq('category_id', category);
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Get skill categories
  async getCategories() {
    const { data, error } = await supabase
      .from('skill_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get single skill
  async getSkill(skillId: string) {
    const { data, error } = await supabase
      .from('skills')
      .select(
        `
        id,
        name,
        description,
        difficulty_level,
        estimated_hours,
        is_popular,
        skill_categories (id, name, icon, color)
      `
      )
      .eq('id', skillId)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================================================
// MESSAGING FUNCTIONS
// ============================================================================

export const messagingService = {
  // Get conversations
  async getConversations(limit: number = 50) {
    const { data, error } = await supabase
      .from('active_conversations_view')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get conversation messages
  async getConversationMessages(userId: string, limit: number = 50) {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUser.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Send message
  async sendMessage(recipientId: string, content: string, swapId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        recipient_id: recipientId,
        content,
        swap_id: swapId,
      },
    ]);

    if (error) throw error;
    return data;
  },

  // Mark message as read
  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  },

  // Subscribe to real-time messages
  subscribeToMessages(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:recipient_id=eq.${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        callback
      )
      .subscribe();
  },
};

// ============================================================================
// REVIEW FUNCTIONS
// ============================================================================

export const reviewService = {
  // Create review
  async createReview(
    revieweeId: string,
    swapId: string,
    rating: number,
    comment: string,
    category?: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('reviews').insert([
      {
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        swap_id: swapId,
        rating,
        comment,
        category,
      },
    ]);

    if (error) throw error;
    return data;
  },

  // Get user reviews
  async getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user's average rating
  async getAverageRating(userId: string) {
    const { data, error } = await supabase.rpc('get_user_trust_score', {
      user_id: userId,
    });

    if (error) throw error;
    return data;
  },
};

// ============================================================================
// SWAP FUNCTIONS
// ============================================================================

export const swapService = {
  // Get swaps
  async getSwaps(status?: string, limit: number = 50) {
    let query = supabase
      .from('swaps')
      .select(
        `
        *,
        initiator:users!initiator_id(id, full_name, profile_picture_url),
        recipient:users!recipient_id(id, full_name, profile_picture_url),
        initiator_skill:skills!initiator_skill_id(id, name),
        recipient_skill:skills!recipient_skill_id(id, name)
      `
      );

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;
    return data;
  },

  // Get user's swaps
  async getUserSwaps(userId: string, status?: string) {
    let query = supabase
      .from('swaps')
      .select('*')
      .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Create swap request
  async createSwap(
    recipientId: string,
    initiatorSkillId: string,
    recipientSkillId: string,
    message?: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('swaps').insert([
      {
        initiator_id: user.id,
        recipient_id: recipientId,
        initiator_skill_id: initiatorSkillId,
        recipient_skill_id: recipientSkillId,
        message,
      },
    ]);

    if (error) throw error;
    return data;
  },

  // Update swap status
  async updateSwapStatus(swapId: string, status: string) {
    const { data, error } = await supabase
      .from('swaps')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', swapId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get swap details
  async getSwapDetails(swapId: string) {
    const { data, error } = await supabase
      .from('swaps')
      .select('*')
      .eq('id', swapId)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

export const notificationService = {
  // Get notifications
  async getNotifications(limit: number = 50) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        callback
      )
      .subscribe();
  },
};
