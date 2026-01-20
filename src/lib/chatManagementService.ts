import { supabase } from './supabase';

export const chatManagementService = {
  // Star a chat
  async starChat(userId: string, conversationId: string) {
    const { data, error } = await supabase
      .from('chat_starred')
      .insert([
        {
          user_id: userId,
          conversation_id: conversationId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Unstar a chat
  async unstarChat(userId: string, conversationId: string) {
    const { error } = await supabase
      .from('chat_starred')
      .delete()
      .eq('user_id', userId)
      .eq('conversation_id', conversationId);

    if (error) throw error;
  },

  // Archive a chat
  async archiveChat(userId: string, conversationId: string) {
    const { data, error } = await supabase
      .from('chat_archived')
      .insert([
        {
          user_id: userId,
          conversation_id: conversationId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Unarchive a chat
  async unarchiveChat(userId: string, conversationId: string) {
    const { error } = await supabase
      .from('chat_archived')
      .delete()
      .eq('user_id', userId)
      .eq('conversation_id', conversationId);

    if (error) throw error;
  },

  // Get all starred chats for a user
  async getStarredChats(userId: string) {
    const { data, error } = await supabase
      .from('chat_starred')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((item: any) => item.conversation_id);
  },

  // Get all archived chats for a user
  async getArchivedChats(userId: string) {
    const { data, error } = await supabase
      .from('chat_archived')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((item: any) => item.conversation_id);
  },

  // Check if a chat is starred
  async isStarred(userId: string, conversationId: string) {
    const { data, error } = await supabase
      .from('chat_starred')
      .select('id')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Check if a chat is archived
  async isArchived(userId: string, conversationId: string) {
    const { data, error } = await supabase
      .from('chat_archived')
      .select('id')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Get chat metadata (starred and archived status)
  async getChatMetadata(userId: string, conversationId: string) {
    const [isStarred, isArchived] = await Promise.all([
      this.isStarred(userId, conversationId),
      this.isArchived(userId, conversationId),
    ]);

    return { isStarred, isArchived };
  },

  // Get all chat metadata for a user
  async getAllChatMetadata(userId: string) {
    const [starredChats, archivedChats] = await Promise.all([
      this.getStarredChats(userId),
      this.getArchivedChats(userId),
    ]);

    return {
      starredChats: new Set(starredChats),
      archivedChats: new Set(archivedChats),
    };
  },
};
