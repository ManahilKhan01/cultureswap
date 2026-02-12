import { supabase } from "./supabase";

export interface OfferData {
  conversation_id: string;
  swap_id?: string;
  receiver_id: string;
  title: string;
  skill_offered: string;
  skill_wanted: string;
  category?: string;
  format?: string;
  address?: string;
  session_days: string[];
  duration: string;
  schedule?: string;
  notes?: string;
}

export interface Offer {
  id: string;
  conversation_id: string;
  swap_id?: string;
  sender_id: string;
  receiver_id: string;
  title: string;
  skill_offered: string;
  skill_wanted: string;
  category?: string;
  format?: string;
  address?: string;
  session_days: string[];
  duration: string;
  schedule?: string;
  notes?: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export const offerService = {
  /**
   * Create a new offer for a swap
   */
  async createOffer(offerData: OfferData): Promise<Offer | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("swap_offers")
        .insert([
          {
            conversation_id: offerData.conversation_id,
            swap_id: offerData.swap_id || null,
            sender_id: user.id,
            receiver_id: offerData.receiver_id,
            title: offerData.title,
            skill_offered: offerData.skill_offered,
            skill_wanted: offerData.skill_wanted,
            category: offerData.category,
            format: offerData.format,
            address: offerData.address || null,
            session_days: offerData.session_days,
            duration: offerData.duration,
            schedule: offerData.schedule,
            notes: offerData.notes,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating offer:", error);
        throw error;
      }

      // Send a message in the chat with this offer_id
      await supabase.from("messages").insert([
        {
          sender_id: user.id,
          receiver_id: offerData.receiver_id,
          conversation_id: offerData.conversation_id,
          offer_id: data.id,
          content: `Sent a swap offer: ${offerData.title}`,
        },
      ]);

      // Create notification for the receiver
      await supabase.from("notifications").insert([
        {
          user_id: offerData.receiver_id,
          sender_id: user.id,
          type: "new_offer",
          title: "New Swap Offer",
          body: `You received a new proposal for: ${offerData.title}`,
          data: {
            conversation_id: offerData.conversation_id,
            offer_id: data.id,
          },
          read: false,
        },
      ]);

      return data;
    } catch (error) {
      console.error("offerService.createOffer error:", error);
      throw error;
    }
  },

  /**
   * Get all offers for a specific swap
   */
  async getOffersBySwap(swapId: string): Promise<Offer[]> {
    try {
      const { data, error } = await supabase
        .from("swap_offers")
        .select("*")
        .eq("swap_id", swapId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching offers:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("offerService.getOffersBySwap error:", error);
      throw error;
    }
  },

  /**
   * Get a single offer by ID
   */
  async getOfferById(offerId: string): Promise<Offer | null> {
    try {
      const { data, error } = await supabase
        .from("swap_offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (error) {
        console.error("Error fetching offer:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("offerService.getOfferById error:", error);
      throw error;
    }
  },

  /**
   * Get pending offers for the current user (offers they received)
   */
  async getPendingOffersForUser(): Promise<Offer[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("swap_offers")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending offers:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("offerService.getPendingOffersForUser error:", error);
      throw error;
    }
  },

  /**
   * Accept an offer - updates offer status and activates the swap
   */
  async acceptOffer(
    offerId: string,
  ): Promise<{ offer: Offer; swap: any } | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the offer first
      const offer = await this.getOfferById(offerId);
      if (!offer) throw new Error("Offer not found");

      // Verify user is the receiver
      if (offer.receiver_id !== user.id) {
        throw new Error("Only the receiver can accept this offer");
      }

      // Update offer status to accepted
      const { data: updatedOffer, error: offerError } = await supabase
        .from("swap_offers")
        .update({ status: "accepted" })
        .eq("id", offerId)
        .select()
        .single();

      if (offerError) {
        console.error("Error accepting offer:", offerError);
        throw offerError;
      }

      // Create or update swap
      let updatedSwap;
      if (offer.swap_id) {
        // If it was an offer for an existing swap listing
        const { data, error } = await supabase
          .from("swaps")
          .update({
            partner_id: offer.sender_id,
            status: "active",
            conversation_id: offer.conversation_id,
            origin_offer_id: offer.id,
          })
          .eq("id", offer.swap_id)
          .select()
          .single();

        if (error) throw error;
        updatedSwap = data;
      } else {
        // Chat-first flow: Create a brand new swap
        const { data, error } = await supabase
          .from("swaps")
          .insert([
            {
              user_id: offer.sender_id,
              partner_id: offer.receiver_id,
              title: offer.title || "Untitled Swap",
              skill_offered: offer.skill_offered,
              skill_wanted: offer.skill_wanted,
              category: offer.category,
              format: offer.format,
              duration: offer.duration,
              status: "active",
              conversation_id: offer.conversation_id,
              origin_offer_id: offer.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        updatedSwap = data;
      }

      // Reject all other pending offers for this swap/conversation
      if (offer.swap_id) {
        await supabase
          .from("swap_offers")
          .update({ status: "rejected" })
          .eq("swap_id", offer.swap_id)
          .eq("status", "pending")
          .neq("id", offerId);
      }

      // Create notification for the sender
      await supabase.from("notifications").insert([
        {
          user_id: offer.sender_id,
          sender_id: user.id,
          type: "offer_accepted",
          title: "Offer Accepted!",
          body: `Your offer for ${offer.title} was accepted! The swap is now active.`,
          data: {
            swap_id: updatedSwap.id,
            offer_id: offerId,
            conversation_id: offer.conversation_id,
          },
          read: false,
        },
      ]);

      // Send a confirmation message in chat
      await supabase.from("messages").insert([
        {
          sender_id: user.id,
          receiver_id: offer.sender_id,
          conversation_id: offer.conversation_id,
          content: `Accepted the swap offer! 🎉`,
        },
      ]);

      return { offer: updatedOffer, swap: updatedSwap };
    } catch (error) {
      console.error("offerService.acceptOffer error:", error);
      throw error;
    }
  },

  /**
   * Reject an offer
   */
  async rejectOffer(offerId: string): Promise<Offer | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the offer first
      const offer = await this.getOfferById(offerId);
      if (!offer) throw new Error("Offer not found");

      // Verify user is the receiver
      if (offer.receiver_id !== user.id) {
        throw new Error("Only the receiver can reject this offer");
      }

      const { data, error } = await supabase
        .from("swap_offers")
        .update({ status: "rejected" })
        .eq("id", offerId)
        .select()
        .single();

      if (error) {
        console.error("Error rejecting offer:", error);
        throw error;
      }

      // Create notification for the sender
      await supabase.from("notifications").insert([
        {
          user_id: offer.sender_id,
          sender_id: user.id,
          type: "offer_rejected",
          title: "Offer Declined",
          body: "Your offer was not accepted.",
          data: { swap_id: offer.swap_id, offer_id: offerId },
          read: false,
        },
      ]);

      return data;
    } catch (error) {
      console.error("offerService.rejectOffer error:", error);
      throw error;
    }
  },

  /**
   * Subscribe to offer changes for a specific swap
   */
  subscribeToOffers(swapId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`swap_offers:swap_id=eq.${swapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "swap_offers",
          filter: `swap_id=eq.${swapId}`,
        },
        callback,
      )
      .subscribe();
  },

  /**
   * Subscribe to changes on a specific offer by ID (for real-time status updates)
   * Note: We subscribe to all swap_offers changes and filter in callback for better reliability
   */
  subscribeToOfferById(offerId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`offer_updates_${offerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "swap_offers",
        },
        (payload) => {
          // Filter in callback for reliability across all Supabase tiers
          if (payload.new && (payload.new as any).id === offerId) {
            callback(payload);
          }
        },
      )
      .subscribe();
  },

  /**
   * Subscribe to offers received by the current user (INSERT and UPDATE)
   */
  subscribeToUserOffers(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`swap_offers:receiver_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "swap_offers",
          filter: `receiver_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  },

  /**
   * Subscribe to offers sent by the current user (for sender to see status changes)
   */
  subscribeToSentOffers(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`swap_offers:sender_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "swap_offers",
          filter: `sender_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  },
};
