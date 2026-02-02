import { supabase } from './supabase';

const ASSISTANT_EMAIL = 'swapy@cultureswap.app';
const ASSISTANT_NAME = 'Swapy';
let cachedAssistantId: string | null = null;

export const aiAssistantService = {
  // Get or create the AI assistant user
  async getOrCreateAssistantUser() {
    try {
      // Return cached assistant if available
      if (cachedAssistantId) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', cachedAssistantId)
          .single();

        if (profile) return profile;
      }

      // First check if assistant exists in user_profiles by email
      const { data: existingAssistant } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', ASSISTANT_EMAIL)
        .maybeSingle();

      if (existingAssistant) {
        cachedAssistantId = existingAssistant.id;
        return existingAssistant;
      }

      // If no assistant exists, we need to create one
      // Try to get current user to use as base for assistant ID
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Use a system UUID format but different from user
      // Store assistant in a special way - use email as key
      const assistantProfile = {
        id: user.id, // Will be overridden by system
        email: ASSISTANT_EMAIL,
        full_name: ASSISTANT_NAME,
        profile_image_url: '/Ai.svg',
        bio: 'Hi, I\'m Swapy! Your AI assistant for CultureSwap. I\'m here to help you with cultural exchange and swap services!',
        is_verified: true,
        country: 'Global',
        city: 'Virtual',
      };

      // Check if we can insert with a system user ID
      // First, let's check the auth users table for a system account
      const { data: authUsers } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', ASSISTANT_EMAIL)
        .maybeSingle();

      let finalAssistantId = authUsers?.id;

      if (!finalAssistantId) {
        // Create assistant in user_profiles directly with a deterministic ID
        // Use MD5 hash of email but in UUID format
        finalAssistantId = '00000000-0000-4000-a000-000000000001'; // RFC4122 compliant UUIDv4 format
      }

      // Try to insert the assistant profile
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert([
          {
            ...assistantProfile,
            id: finalAssistantId,
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) {
        console.warn('Could not create assistant profile, using fallback:', insertError);
        // Return a virtual profile for display purposes
        cachedAssistantId = finalAssistantId;
        return {
          id: finalAssistantId,
          email: ASSISTANT_EMAIL,
          full_name: ASSISTANT_NAME,
          profile_image_url: '/Ai.svg',
          is_verified: true,
          country: 'Global',
          city: 'Virtual',
          bio: assistantProfile.bio,
        };
      }

      if (newProfile) {
        cachedAssistantId = newProfile.id;
        return newProfile;
      }

      // Fallback: return profile with generated ID
      cachedAssistantId = finalAssistantId;
      return {
        id: finalAssistantId,
        email: ASSISTANT_EMAIL,
        full_name: ASSISTANT_NAME,
        profile_image_url: '/Ai.svg',
        is_verified: true,
        country: 'Global',
        city: 'Virtual',
        bio: assistantProfile.bio,
      };
    } catch (error) {
      console.error('Error in getOrCreateAssistantUser:', error);

      // Absolute fallback: return a virtual assistant profile
      const fallbackId = '00000000-0000-4000-a000-000000000001';
      cachedAssistantId = fallbackId;

      return {
        id: fallbackId,
        email: ASSISTANT_EMAIL,
        full_name: ASSISTANT_NAME,
        profile_image_url: '/Ai.svg',
        is_verified: true,
        country: 'Global',
        city: 'Virtual',
        bio: 'Hi, I\'m Swapy! Your AI assistant for CultureSwap.',
      };
    }
  },

  // Get or create assistant conversation for a user
  async getOrCreateAssistantConversation(userId: string) {
    try {
      const assistant = await this.getOrCreateAssistantUser();
      const assistantId = assistant.id;

      // For assistant chats, we skip the conversations table entirely
      // because assistant IDs aren't real auth users and would violate FK constraints
      // Instead, return a virtual conversation ID that works with message-based lookup

      console.log('Using message-based conversation for assistant');

      // Return a deterministic ID based on user + assistant
      const virtualConvId = `assistant-conv-${userId}`;
      return virtualConvId;
    } catch (error) {
      console.error('Error in getOrCreateAssistantConversation:', error);
      throw error;
    }
  },

  // Generate AI response based on user message
  async generateResponse(userMessage: string, conversationHistory: any[] = []): Promise<string> {
    try {
      // Prepare context from conversation history
      const recentMessages = conversationHistory.slice(-10); // Last 10 messages for context

      const context = recentMessages.map(msg =>
        `${msg.sender_name || 'User'}: ${msg.content}`
      ).join('\n');

      // Use rule-based responses for now (can be replaced with actual LLM integration)
      const response = this.generateRuleBasedResponse(userMessage, context);

      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      return this.getDefaultResponse();
    }
  },

  // Rule-based response generator (can be replaced with OpenAI, etc.)
  generateRuleBasedResponse(message: string, context: string = ''): string {
    const lowerMessage = message.toLowerCase();

    // Greeting
    if (lowerMessage.match(/^(hi|hello|hey|greetings)/)) {
      return "Hello! 👋 Welcome to CultureSwap! I'm Swapy, your AI assistant. I'm here to help you with cultural exchanges, answering questions about swaps, and providing guidance. How can I assist you today?";
    }

    // Help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I'd be happy to help! 🌍 I can assist you with:\n\n• Creating and managing cultural swaps\n• Understanding how the platform works\n• Answering questions about cultural exchanges\n• Tips for successful connections\n\nWhat specifically would you like to know about?";
    }

    // Swap-related questions
    if (lowerMessage.includes('swap')) {
      return "Great question about swaps! 🤝 A cultural swap on CultureSwap is when two people exchange skills or cultural knowledge. For example, you might teach Spanish while learning Mandarin.\n\nTo create a swap:\n1. Go to 'Create Swap'\n2. Fill in your skills (what you offer and what you want to learn)\n3. Browse other users' swaps\n4. Connect and start your cultural exchange!\n\nWould you like more details about any part of the process?";
    }

    // Safety/Trust questions
    if (lowerMessage.includes('safe') || lowerMessage.includes('trust') || lowerMessage.includes('verify')) {
      return "Safety and trust are important to us! 🔒 CultureSwap has several features to ensure a safe experience:\n\n• User verification through email\n• Profile ratings and reviews\n• Transparent communication through our chat system\n• Detailed user profiles\n\nAlways take time to review a user's profile and ratings before connecting. Do you have specific safety concerns I can address?";
    }

    // Profile questions
    if (lowerMessage.includes('profile')) {
      return "Your profile is your identity on CultureSwap! 📝 A great profile includes:\n\n• A clear profile picture\n• Your interests and skills\n• Languages you speak\n• What you're looking to learn\n• Any relevant experience\n\nThe more detailed your profile, the better matches you'll find! Would you like tips on what to include?";
    }

    // Technical issues
    if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('problem')) {
      return "I'm sorry you're experiencing an issue! 😔 Please describe what's happening, and I'll do my best to help.\n\nCommon issues and solutions:\n• Can't login? Check your email and password\n• Messages not showing? Try refreshing the page\n• Images not uploading? Ensure the file is under 5MB\n\nWhat specific problem are you encountering?";
    }

    // Appreciation
    if (lowerMessage.includes('thank')) {
      return "You're welcome! 😊 I'm here to help anytime you need. Feel free to reach out with any questions about CultureSwap!";
    }

    // Default friendly response
    return "That's an interesting question! 🤔 While I'm still learning, I'm here to help with CultureSwap-related topics. Could you provide more details or rephrase your question? Or would you like to know about:\n\n• How to create a swap\n• Tips for finding the right cultural partner\n• Safety guidelines\n• How to edit your profile\n\nJust let me know!";
  },

  // Get default fallback response
  getDefaultResponse(): string {
    return "I'm having trouble processing that right now, but I'm here to help! 💙 Could you please try rephrasing your question or let me know how I can assist you with CultureSwap?";
  },

  // Send assistant message to user (legacy - now handled client-side)
  async sendAssistantMessage(
    conversationId: string,
    userId: string,
    content: string
  ) {
    try {
      // This is now handled client-side to avoid foreign key issues
      // Just return a virtual message object
      return {
        id: `assistant-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: '00000000-0000-4000-a000-000000000001',
        receiver_id: userId,
        content,
        created_at: new Date().toISOString(),
        read: true,
        is_assistant: true,
      };
    } catch (error) {
      console.error('Error in sendAssistantMessage:', error);
      throw error;
    }
  },

  // Check if a profile is the assistant
  isAssistantProfile(profile: any): boolean {
    if (!profile) return false;
    const name = profile.full_name?.toLowerCase() || '';
    const email = profile.email?.toLowerCase() || '';
    return (
      name.includes('assistant') ||
      email === ASSISTANT_EMAIL ||
      profile.id === '00000000-0000-4000-a000-000000000001'
    );
  },

  // Check if a conversation is with the assistant
  isAssistantConversation(conversationId: string): boolean {
    return conversationId.startsWith('assistant-conv-');
  },
};
