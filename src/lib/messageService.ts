import { supabase } from './supabase';

interface MessageData {
  sender_id: string;
  receiver_id: string;
  conversation_id?: string;
  swap_id?: string;
  offer_id?: string;
  content: string;
}

export const messageService = {
  // Get or create a conversation between two users
  async getOrCreateConversation(userId1: string, userId2: string) {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        uid1: userId1,
        uid2: userId2
      });

      if (error) {
        const u1 = userId1 < userId2 ? userId1 : userId2;
        const u2 = userId1 < userId2 ? userId2 : userId1;

        const { data: conv, error: fetchError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user1_id', u1)
          .eq('user2_id', u2)
          .maybeSingle();

        if (!conv) {
          const { data: newConv, error: insertError } = await supabase
            .from('conversations')
            .insert([{ user1_id: u1, user2_id: u2 }])
            .select('id')
            .single();
          if (insertError) throw insertError;
          return newConv.id;
        }
        if (fetchError) throw fetchError;
        return conv.id;
      }
      return data;
    } catch (error) {
      console.error('messageService.getOrCreateConversation error:', error);
      throw error;
    }
  },

  // Get conversation by ID
  async getMessagesByConversation(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('messageService.getMessagesByConversation error:', error);
      throw error;
    }
  },

  // Send a message
  async sendMessage(messageData: MessageData) {
    try {
      let conversationId = messageData.conversation_id;

      if (!conversationId) {
        conversationId = await this.getOrCreateConversation(messageData.sender_id, messageData.receiver_id);
      }

      const payload = {
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        content: messageData.content,
        conversation_id: conversationId,
        ...(messageData.swap_id ? { swap_id: messageData.swap_id } : {}),
        ...(messageData.offer_id ? { offer_id: messageData.offer_id } : {}),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error sending message:', error.message);
        throw new Error(error.message);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('messageService.sendMessage error:', error);
      throw error;
    }
  },

  // Get conversation between two users
  async getConversation(userId1: string, userId2: string) {
    try {
      const conversationId = await this.getOrCreateConversation(userId1, userId2);
      return this.getMessagesByConversation(conversationId);
    } catch (error) {
      console.error('messageService.getConversation error, falling back:', error);
      const { data, error: legacyError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true });

      if (legacyError) throw legacyError;
      return data || [];
    }
  },

  // Get all conversations for a user
  async getConversations(userId: string) {
    try {
      // 1. Fetch all conversations relation
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations, falling back to messages grouping:', error);
        // Fallback: Fetch messages directly if conversations table fails
        const { data: legacyMessages, error: legacyError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (legacyError) throw legacyError;

        const conversationMap = new Map();
        for (const msg of legacyMessages || []) {
          const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
          const key = [userId, otherUserId].sort().join('_');
          if (!conversationMap.has(key)) {
            conversationMap.set(key, { otherUserId, lastMessage: msg, allMessages: [] });
          }
          conversationMap.get(key).allMessages.push(msg);
        }
        return Array.from(conversationMap.values());
      }

      // 2. Optimization: Batch fetch recent messages to avoid N+1 queries
      // We fetch the last 1000 messages. This covers significantly more history, reducing the chance of falling back to individual queries.
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('*') // Keeping * to ensure we don't miss any new fields used by the UI (like type, attachments, etc)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(1000);

      // Group recent messages by conversation_id in memory
      const messageMap = new Map<string, any>();
      if (recentMessages) {
        for (const msg of recentMessages) {
          if (msg.conversation_id && !messageMap.has(msg.conversation_id)) {
            messageMap.set(msg.conversation_id, msg);
          }
        }
      }

      // 3. Map conversations to their last message
      const formattedConversations = await Promise.all(conversations.map(async (conv) => {
        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

        // Strategy A: Check if we already have the message from our batch fetch (Fastest & Most Common)
        let lastMsg = messageMap.get(conv.id);

        // Strategy B: If not in recent batch (Dormant chat), fetch specifically (Slower fallback)
        if (!lastMsg) {
          const { data: specificMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          lastMsg = specificMsg;
        }

        return {
          id: conv.id,
          otherUserId,
          lastMessage: lastMsg || { content: "No messages yet", created_at: conv.created_at },
        };
      }));

      return formattedConversations;
    } catch (error) {
      console.error('messageService.getConversations error:', error);
      throw error;
    }
  },

  // Mark message as read
  async markAsRead(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .select();

      if (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('messageService.markAsRead error:', error);
      throw error;
    }
  },

  // Mark all messages in a conversation as read for a specific user
  async markConversationAsRead(conversationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking conversation as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('messageService.markConversationAsRead error:', error);
      throw error;
    }
  },

  // Get unread message count for a user
  async getUnreadCount(userId: string) {
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('messageService.getUnreadCount error:', error);
      throw error;
    }
  },

  // Get unread message count for a specific conversation
  async getUnreadCountByConversation(conversationId: string, userId: string) {
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error getting conversation unread count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('messageService.getUnreadCountByConversation error:', error);
      throw error;
    }
  },

  // Get conversation by swap ID
  async getConversationBySwap(swapId: string, userId1: string, userId2: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('swap_id', swapId)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching swap conversation:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('messageService.getConversationBySwap error:', error);
      throw error;
    }
  },
};
