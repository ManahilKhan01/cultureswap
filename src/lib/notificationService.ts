import { supabase } from './supabase';

interface NotificationData {
  user_id: string;
  sender_id: string;
  message_id?: string;
  type: string;
  title: string;
  body: string;
}

export const notificationService = {
  // Get unread notifications for a user
  async getUnreadNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching unread notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('notificationService.getUnreadNotifications error:', error);
      throw error;
    }
  },

  // Get all notifications for a user
  async getAllNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('notificationService.getAllNotifications error:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select();

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('notificationService.markAsRead error:', error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
        .select();

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('notificationService.markAllAsRead error:', error);
      throw error;
    }
  },

  // Get unread notification count
  async getUnreadCount(userId: string) {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('notificationService.getUnreadCount error:', error);
      throw error;
    }
  },

  // Subscribe to new notifications
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  },
};
