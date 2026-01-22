import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { messageService } from '@/lib/messageService';

interface UnreadCountState {
  total: number; // Total unread messages across all chats
  byConversation: Record<string, number>; // Unread count per conversation ID
}

/**
 * Hook to manage unread message counts with real-time sync
 * 
 * Usage:
 * const { total, byConversation, refresh, markConversationAsRead } = useUnreadMessages(userId);
 */
export const useUnreadMessages = (userId: string | null) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCountState>({
    total: 0,
    byConversation: {}
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initial load of unread counts
  const refreshUnreadCounts = useCallback(async () => {
    if (!userId) {
      setUnreadCounts({ total: 0, byConversation: {} });
      return;
    }

    try {
      setIsLoading(true);

      // Get all unread messages
      const { data: unreadMessages, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, receiver_id')
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error fetching unread messages:', error);
        setUnreadCounts({ total: 0, byConversation: {} });
        return;
      }

      // Count unread messages globally and per conversation
      const counts: UnreadCountState = {
        total: unreadMessages?.length || 0,
        byConversation: {}
      };

      // Group by conversation
      for (const msg of unreadMessages || []) {
        const convId = msg.conversation_id;
        if (convId) {
          counts.byConversation[convId] = (counts.byConversation[convId] || 0) + 1;
        }
      }

      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Mark all unread messages in a conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;

    try {
      // Update all unread messages in this conversation to read
      const { error } = await supabase
        .from('messages')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }

      // Update local state
      const unreadInConv = unreadCounts.byConversation[conversationId] || 0;
      const newTotal = Math.max(0, unreadCounts.total - unreadInConv);

      setUnreadCounts(prev => {
        const newByConv = { ...prev.byConversation };
        delete newByConv[conversationId];
        return {
          total: newTotal,
          byConversation: newByConv
        };
      });

      return true;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return false;
    }
  }, [userId, unreadCounts.byConversation, unreadCounts.total]);

  // Mark a single message as read
  const markMessageAsRead = useCallback(async (messageId: string, conversationId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking single message as read:', error);
        return false;
      }

      // Update local state - decrement both total and conversation-specific counts
      setUnreadCounts(prev => {
        const convUnread = prev.byConversation[conversationId] || 0;
        const newConvUnread = Math.max(0, convUnread - 1);
        const newByConv = { ...prev.byConversation };

        if (newConvUnread === 0) {
          delete newByConv[conversationId];
        } else {
          newByConv[conversationId] = newConvUnread;
        }

        return {
          total: Math.max(0, prev.total - 1),
          byConversation: newByConv
        };
      });

      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, [userId]);

  // Set up real-time subscription for message read status changes
  useEffect(() => {
    if (!userId) return;

    // Initial load - Commented out to start with zero as per user requirement
    // refreshUnreadCounts();

    // Subscribe to new messages for current user
    const newMsgChannel = supabase
      .channel(`messages_new_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}` // Only new messages received by this user
        },
        (payload) => {
          const newMsg = payload.new;
          const convId = newMsg.conversation_id;

          setUnreadCounts(prev => ({
            total: prev.total + 1,
            byConversation: {
              ...prev.byConversation,
              [convId]: (prev.byConversation[convId] || 0) + 1
            }
          }));
        }
      )
      .subscribe();

    // Subscribe to message read status updates
    const readStatusChannel = supabase
      .channel(`messages_read_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}` // Updates to messages received by this user
        },
        (payload) => {
          const msg = payload.new;
          const oldMsg = payload.old;

          // If message was marked as read (changed from false to true)
          if (!oldMsg.read && msg.read) {
            const convId = msg.conversation_id;
            setUnreadCounts(prev => {
              const convUnread = prev.byConversation[convId] || 0;
              const newConvUnread = Math.max(0, convUnread - 1);
              const newByConv = { ...prev.byConversation };

              if (newConvUnread === 0) {
                delete newByConv[convId];
              } else {
                newByConv[convId] = newConvUnread;
              }

              return {
                total: Math.max(0, prev.total - 1),
                byConversation: newByConv
              };
            });
          }
          // If message was marked as unread (changed from true to false)
          else if (oldMsg.read && !msg.read) {
            const convId = msg.conversation_id;
            setUnreadCounts(prev => ({
              total: prev.total + 1,
              byConversation: {
                ...prev.byConversation,
                [convId]: (prev.byConversation[convId] || 0) + 1
              }
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(newMsgChannel);
      supabase.removeChannel(readStatusChannel);
    };
  }, [userId, refreshUnreadCounts]);

  return {
    total: unreadCounts.total,
    byConversation: unreadCounts.byConversation,
    isLoading,
    refresh: refreshUnreadCounts,
    markConversationAsRead,
    markMessageAsRead
  };
};

export default useUnreadMessages;
