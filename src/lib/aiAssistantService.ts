import { supabase } from "./supabase";

const ASSISTANT_EMAIL = "swapy@cultureswap.app";
const ASSISTANT_NAME = "Swapy";
let cachedAssistantId: string | null = null;

export const aiAssistantService = {
  // Get or create the AI assistant user
  async getOrCreateAssistantUser() {
    try {
      // Return cached assistant if available
      if (cachedAssistantId) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", cachedAssistantId)
          .single();

        if (profile) return profile;
      }

      // First check if assistant exists in user_profiles by email
      const { data: existingAssistant } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", ASSISTANT_EMAIL)
        .maybeSingle();

      if (existingAssistant) {
        cachedAssistantId = existingAssistant.id;
        return existingAssistant;
      }

      // If no assistant exists, we need to create one
      // Try to get current user to use as base for assistant ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Use a system UUID format but different from user
      // Store assistant in a special way - use email as key
      const assistantProfile = {
        id: user.id, // Will be overridden by system
        email: ASSISTANT_EMAIL,
        full_name: ASSISTANT_NAME,
        profile_image_url: "/Ai.svg",
        bio: "Hi, I'm Swapy! Your AI assistant for CultureSwap. I'm here to help you with cultural exchange and swap services!",
        is_verified: true,
        country: "Global",
        city: "Virtual",
      };

      // Check if we can insert with a system user ID
      // First, let's check the auth users table for a system account
      const { data: authUsers } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", ASSISTANT_EMAIL)
        .maybeSingle();

      let finalAssistantId = authUsers?.id;

      if (!finalAssistantId) {
        // Create assistant in user_profiles directly with a deterministic ID
        // Use MD5 hash of email but in UUID format
        finalAssistantId = "00000000-0000-4000-a000-000000000001"; // RFC4122 compliant UUIDv4 format
      }

      // Try to insert the assistant profile
      const { data: newProfile, error: insertError } = await supabase
        .from("user_profiles")
        .insert([
          {
            ...assistantProfile,
            id: finalAssistantId,
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) {
        // Return a virtual profile for display purposes
        cachedAssistantId = finalAssistantId;
        return {
          id: finalAssistantId,
          email: ASSISTANT_EMAIL,
          full_name: ASSISTANT_NAME,
          profile_image_url: "/Ai.svg",
          is_verified: true,
          country: "Global",
          city: "Virtual",
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
        profile_image_url: "/Ai.svg",
        is_verified: true,
        country: "Global",
        city: "Virtual",
        bio: assistantProfile.bio,
      };
    } catch (error) {
      // Absolute fallback: return a virtual assistant profile
      const fallbackId = "00000000-0000-4000-a000-000000000001";
      cachedAssistantId = fallbackId;

      return {
        id: fallbackId,
        email: ASSISTANT_EMAIL,
        full_name: ASSISTANT_NAME,
        profile_image_url: "/Ai.svg",
        is_verified: true,
        country: "Global",
        city: "Virtual",
        bio: "Hi, I'm Swapy! Your AI assistant for CultureSwap.",
      };
    }
  },

  // Get or create assistant conversation for a user
  async getOrCreateAssistantConversation(userId: string) {
    try {
      // For assistant chats, we skip the conversations table entirely
      // because assistant IDs aren't real auth users and would violate FK constraints
      // Instead, return a virtual conversation ID that works with message-based lookup

      // Silent assistant conversation log

      // Return a deterministic ID based on user + assistant
      const virtualConvId = `assistant-conv-${userId}`;
      return virtualConvId;
    } catch (error) {
      throw error;
    }
  },

  // System prompt for OpenAI - STRICT CultureSwap focus
  getSystemPrompt(): string {
    return `You are Swapy, the friendly AI assistant for CultureSwap - a platform for cultural and skill exchange.

CRITICAL RULES:
1. You ONLY answer questions about CultureSwap, cultural exchange, skill sharing, language learning, and related topics.
2. If someone asks about ANYTHING unrelated (politics, coding help, recipes, general knowledge, etc.), politely decline and redirect them to CultureSwap topics.
3. Example decline: "That's an interesting question! But I'm Swapy, and I specialize in helping with CultureSwap. 😊 Is there anything about swaps, profiles, or finding partners I can help with?"

ABOUT CULTURESWAP:
- CultureSwap connects people to exchange skills and cultural knowledge
- Users can teach what they know (e.g., Spanish, Guitar, Cooking) and learn what they want
- It's 100% FREE - no money involved, just skill-for-skill exchange
- Key features: Discover page, Swap Offers, Messaging, User Profiles, Reviews

YOUR PERSONALITY:
- Friendly and warm 😊
- Use emojis occasionally (but not excessively)
- Be concise and helpful
- Encourage users to explore CultureSwap features
- If you don't know something specific about the platform, admit it and suggest they check the website`;
  },

  // Generate AI response using OpenAI API
  async generateResponse(
    userMessage: string,
    conversationHistory: any[] = [],
  ): Promise<string> {
    try {
      // Prepare context from conversation history
      const recentMessages = conversationHistory.slice(-10);

      const context = recentMessages
        .map((msg) => `${msg.sender_name || "User"}: ${msg.content}`)
        .join("\n");

      // Check for OpenAI API key
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (apiKey) {
        // Use OpenAI API
        try {
          const response = await this.callOpenAIAPI(
            userMessage,
            context,
            apiKey,
          );
          if (response) return response;
        } catch (apiError) {}
      }

      // Fallback to rule-based responses
      return this.generateRuleBasedResponse(userMessage, context);
    } catch (error) {
      return this.getDefaultResponse();
    }
  },

  // Call Supabase Edge Function that proxies OpenAI
  async callOpenAIAPI(
    userMessage: string,
    context: string,
    _apiKey: string,
  ): Promise<string | null> {
    try {
      // Call our Supabase Edge Function which handles the OpenAI call server-side
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: { message: userMessage, context },
      });

      if (error) {
        return null;
      }

      return data?.reply || null;
    } catch (error) {
      return null;
    }
  },

  // Simple fallback response (only used if Claude API fails)
  generateRuleBasedResponse(message: string, context: string = ""): string {
    return "I'm having a little trouble connecting right now. 😅 Please try again in a moment, or feel free to explore CultureSwap on your own!";
  },

  // Get default fallback response
  getDefaultResponse(): string {
    return "I'm having trouble processing that right now, but I'm here to help! 💙 Could you please try rephrasing your question or let me know how I can assist you with CultureSwap?";
  },

  // Send assistant message to user (legacy - now handled client-side)
  async sendAssistantMessage(
    conversationId: string,
    userId: string,
    content: string,
  ) {
    try {
      // This is now handled client-side to avoid foreign key issues
      // Just return a virtual message object
      return {
        id: `assistant-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: "00000000-0000-4000-a000-000000000001",
        receiver_id: userId,
        content,
        created_at: new Date().toISOString(),
        read: true,
        is_assistant: true,
      };
    } catch (error) {
      console.error("Error in sendAssistantMessage:", error);
      throw error;
    }
  },

  // Check if a profile is the assistant
  isAssistantProfile(profile: any): boolean {
    if (!profile) return false;
    const name = profile.full_name?.toLowerCase() || "";
    const email = profile.email?.toLowerCase() || "";
    return (
      name.includes("assistant") ||
      email === ASSISTANT_EMAIL ||
      profile.id === "00000000-0000-4000-a000-000000000001"
    );
  },

  // Check if a conversation is with the assistant
  isAssistantConversation(conversationId: string): boolean {
    return conversationId.startsWith("assistant-conv-");
  },
};
