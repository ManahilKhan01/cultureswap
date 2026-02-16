import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  MoreVertical,
  MessageCircle,
  Star,
  Archive,
  Handshake,
  ChevronLeft,
  ChevronDown,
  Send,
  Paperclip,
  CheckCheck,
  FileText,
  Download,
  X,
  Bell,
  Loader2,
  User,
  Image as ImageIcon,
  File,
  Plus,
  PlusCircle,
  XCircle,
  Zap,
  Camera,
  Video,
  Clock,
  MessageSquareMore,
  Pencil,
  Minus,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { messageService } from "@/lib/messageService";
import { profileService } from "@/lib/profileService";
import { swapService } from "@/lib/swapService";
import { attachmentService } from "@/lib/attachmentService";
import { historyService } from "@/lib/historyService";
import { offerService, Offer } from "@/lib/offerService";
import { useToast } from "@/hooks/use-toast";
import { CreateOfferDialog } from "@/components/CreateOfferDialog";
import { OfferCard } from "@/components/OfferCard";
import { CameraModal } from "@/components/CameraModal";
import { ChatMessage } from "@/components/ChatMessage";
import { chatManagementService } from "@/lib/chatManagementService";
import { aiAssistantService } from "@/lib/aiAssistantService";
import { presenceService, type UserPresence } from "@/lib/presenceService";
import { StatusDot } from "@/components/StatusDot";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { getCacheBustedImageUrl } from "@/lib/cacheUtils";

import { Skeleton } from "@/components/ui/skeleton";

const MessageListSkeleton = () => (
  <div className="p-2 space-y-2">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const AutoReplySkeleton = () => (
  <div className="space-y-4 animate-in fade-in duration-300">
    <div className="p-4 rounded-xl bg-muted/20 border border-muted/30 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[75%]" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-11 flex-1 rounded-xl" />
      <Skeleton className="h-11 flex-[2] rounded-xl" />
    </div>
  </div>
);

const Messages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Presence state
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>(
    {},
  );

  const userIdParam = searchParams.get("user");
  const swapIdParam = searchParams.get("swap");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [currentSwap, setCurrentSwap] = useState<any>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unread" | "starred" | "archived" | "offers" | "assistant"
  >("all");
  const [starredChats, setStarredChats] = useState<Set<string>>(new Set());
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [activeQuickSubPanel, setActiveQuickSubPanel] = useState<
    "main" | "responses" | "auto-reply" | "camera"
  >("main");
  const [autoReplyPreview, setAutoReplyPreview] = useState("");
  const [isGeneratingAutoReply, setIsGeneratingAutoReply] = useState(false);
  const [quickResponses, setQuickResponses] = useState<string[]>(() => {
    const saved = localStorage.getItem("customQuickResponses");
    return saved
      ? JSON.parse(saved)
      : [
          "I will text you later.",
          "I will let you know.",
          "Sounds good, thanks!",
          "Let me check and get back to you.",
          "Sure, that works for me.",
        ];
  });
  const [editingResponseIndex, setEditingResponseIndex] = useState<
    number | null
  >(null);
  const [nextResponseText, setNextResponseText] = useState("");
  const [isAddingResponse, setIsAddingResponse] = useState(false);
  const [editResponseValue, setEditResponseValue] = useState("");

  // Key to force OfferCard components to re-fetch when offers are updated
  const [offerRefreshKey, setOfferRefreshKey] = useState(0);

  // Use the unread messages hook for real-time tracking
  const { markConversationAsRead } = useUnreadMessages(currentUser?.id || null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (
      !selectedConversation?.id ||
      selectedConversation.id === "loading" ||
      !currentUser
    )
      return;

    // Mark all unread messages in this conversation as read
    const markAsRead = async () => {
      try {
        await markConversationAsRead(selectedConversation.id);
        // Reload conversations to update the list (removes from unread filter)
        if (currentUser?.id) {
          await loadConversations(currentUser.id);
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
        // Non-blocking error - don't show toast as it can be distracting
      }
    };

    markAsRead();
  }, [selectedConversation?.id, currentUser, markConversationAsRead]);

  // Check if a user is an assistant
  const isAssistantUser = (profile: any) => {
    if (!profile) return false;
    const name = profile.full_name?.toLowerCase() || "";
    const email = profile.email?.toLowerCase() || "";
    return (
      name.includes("assistant") ||
      name.includes("support") ||
      name.includes("system") ||
      name.includes("swapy") ||
      email.includes("swapy") ||
      profile.id === "00000000-0000-4000-a000-000000000001"
    );
  };

  // Check if conversation is a custom offer (from offers table)
  const isCustomOfferConversation = (conv: any) => {
    return conv.swapId && !conv.isDefaultSwap;
  };

  // Apply filters to conversations
  const applyFilters = (convs: any[]) => {
    let filtered = [...convs];

    // Remove archived chats unless viewing archived filter
    if (activeFilter !== "archived") {
      filtered = filtered.filter((conv) => !archivedChats.has(conv.id));
    } else {
      filtered = filtered.filter((conv) => archivedChats.has(conv.id));
    }

    // Apply specific filters
    switch (activeFilter) {
      case "starred":
        filtered = filtered.filter((conv) => starredChats.has(conv.id));
        break;
      case "unread":
        // Unread: where current user is receiver and has unread messages
        filtered = filtered.filter((conv) => {
          const lastMsg = conv.lastMessage;
          return (
            lastMsg?.receiver_id === currentUser?.id && lastMsg?.read === false
          );
        });
        break;
      case "offers":
        filtered = filtered.filter((conv) => isCustomOfferConversation(conv));
        break;
      case "assistant":
        filtered = filtered.filter((conv) =>
          isAssistantUser(userProfiles[conv.otherUserId]),
        );
        break;
      case "all":
      default:
        break;
    }

    return filtered;
  };

  // Star/Unstar handlers
  const handleStarChat = async (
    e: React.MouseEvent,
    conversationId: string,
  ) => {
    e.stopPropagation();
    try {
      if (starredChats.has(conversationId)) {
        await chatManagementService.unstarChat(currentUser.id, conversationId);
        setStarredChats((prev) => {
          const updated = new Set(prev);
          updated.delete(conversationId);
          return updated;
        });
      } else {
        await chatManagementService.starChat(currentUser.id, conversationId);
        setStarredChats((prev) => new Set(prev).add(conversationId));
      }
    } catch (error) {
      console.error("Error starring chat:", error);
      toast({
        title: "Error",
        description: "Failed to star chat",
        variant: "destructive",
      });
    }
  };

  // Archive/Unarchive handlers
  const handleArchiveChat = async (
    e: React.MouseEvent,
    conversationId: string,
  ) => {
    e.stopPropagation();
    try {
      if (archivedChats.has(conversationId)) {
        await chatManagementService.unarchiveChat(
          currentUser.id,
          conversationId,
        );
        setArchivedChats((prev) => {
          const updated = new Set(prev);
          updated.delete(conversationId);
          return updated;
        });
      } else {
        await chatManagementService.archiveChat(currentUser.id, conversationId);
        setArchivedChats((prev) => new Set(prev).add(conversationId));
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
      }
      loadConversations(currentUser.id);
      toast({
        title: "Success",
        description: archivedChats.has(conversationId)
          ? "Chat unarchived"
          : "Chat archived",
      });
    } catch (error) {
      console.error("Error archiving chat:", error);
      toast({
        title: "Error",
        description: "Failed to archive chat",
        variant: "destructive",
      });
    }
  };

  // Open or create assistant chat
  const handleOpenAssistantChat = async () => {
    try {
      if (!currentUser) {
        toast({
          title: "Error",
          description: "Please log in first",
          variant: "destructive",
        });
        return;
      }

      setMenuOpenId(null);

      try {
        // Get assistant profile
        const assistant = await aiAssistantService.getOrCreateAssistantUser();
        console.log("Assistant profile obtained:", assistant);

        // Get or create assistant conversation (returns virtual ID)
        const conversationId =
          await aiAssistantService.getOrCreateAssistantConversation(
            currentUser.id,
          );
        console.log("Conversation ID:", conversationId);

        // For assistant chat, try to load from messages between user and assistant
        // If conversation ID is virtual (starts with "assistant-conv-"), query by users instead
        let convMessages: any[] = [];

        if (conversationId.startsWith("assistant-conv-")) {
          // Use message-based lookup (avoids conversations table entirely)
          console.log("Loading messages via message-based fallback");
          try {
            convMessages = await messageService.getMessagesBetweenUsers(
              currentUser.id,
              assistant.id,
            );
          } catch (msgError) {
            console.warn(
              "Could not load from messages, starting fresh:",
              msgError,
            );
            convMessages = [];
          }
        } else {
          // Try normal conversation-based lookup
          try {
            convMessages =
              await messageService.getMessagesByConversation(conversationId);
          } catch (convError) {
            console.warn(
              "Conversation lookup failed, trying message fallback:",
              convError,
            );
            convMessages = await messageService.getConversation(
              currentUser.id,
              assistant.id,
            );
          }
        }

        console.log("Messages loaded:", convMessages.length);

        // If no messages exist, add Swapy's automatic greeting
        if (convMessages.length === 0) {
          const greetingMessage = {
            id: `assistant-greeting-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: assistant.id,
            receiver_id: currentUser.id,
            content: "Hi, I'm Swapy. How can I assist you?",
            created_at: new Date().toISOString(),
            is_read: true,
            is_assistant: true,
          };
          convMessages = [greetingMessage];
          console.log("Added automatic greeting from Swapy");
        }

        // Load attachments in bulk for better performance
        const attachmentsMap: Record<string, any[]> = {};
        if (convMessages.length > 0) {
          try {
            const messageIds = convMessages.map((m) => m.id);
            const allAttachments =
              await attachmentService.getAttachmentsByConversation(messageIds);

            // Group attachments by message ID
            for (const att of allAttachments) {
              if (!attachmentsMap[att.message_id]) {
                attachmentsMap[att.message_id] = [];
              }
              attachmentsMap[att.message_id].push(att);
            }
          } catch (e) {
            console.warn("Could not load attachments:", e);
          }
        }

        // Set user profiles
        setUserProfiles((prev) => ({
          ...prev,
          [assistant.id]: assistant,
        }));

        // Select the assistant conversation
        setSelectedConversation({
          id: conversationId,
          otherUserId: assistant.id,
          otherProfile: assistant,
        });

        setOtherUserProfile(assistant);
        setMessages(convMessages);
        setAttachments(attachmentsMap);
        setCurrentSwap(null);

        toast({
          title: "Success",
          description: "Assistant chat opened",
        });
      } catch (error) {
        console.error("Full error opening assistant chat:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Error opening assistant chat:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to open assistant chat. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  const loadConversations = async (uId: string) => {
    try {
      const allConversations = await messageService.getConversations(uId);

      // Load profiles and metadata in parallel for better performance
      const missingProfileIds = allConversations
        .map((conv) => conv.otherUserId)
        .filter((id) => !userProfiles[id]);

      const [fetchedProfiles, metadata] = await Promise.all([
        missingProfileIds.length > 0
          ? profileService.getManyProfiles(missingProfileIds)
          : Promise.resolve([]),
        chatManagementService.getAllChatMetadata(uId),
      ]);

      // Update profiles if any were fetched
      if (fetchedProfiles.length > 0) {
        const newProfiles = { ...userProfiles };
        fetchedProfiles.forEach((profile: any) => {
          if (profile && profile.id) {
            newProfiles[profile.id] = profile;
          }
        });
        setUserProfiles(newProfiles);
      }

      // Sort conversations by last message timestamp (descending)
      const sortedConversations = [...allConversations].sort((a, b) => {
        const timeA = new Date(a.lastMessage.created_at).getTime();
        const bTime = new Date(b.lastMessage.created_at).getTime();
        return bTime - timeA;
      });

      setConversations(sortedConversations);
      setStarredChats(metadata.starredChats as any);
      setArchivedChats(metadata.archivedChats as any);

      // Fetch presence for all conversation users
      const allUserIds = allConversations
        .map((c: any) => c.otherUserId)
        .filter(Boolean);
      if (allUserIds.length > 0) {
        presenceService.getBatchPresence(allUserIds).then(setPresenceMap);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  // Effect 1: Initial load of auth and conversation list
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        setCurrentUser(user);
        await loadConversations(user.id);
      } catch (error) {
        console.error("Error in initial load:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Effect 2: Load specific chat messages when search params change
  useEffect(() => {
    const loadChatData = async () => {
      if (!currentUser) return;

      try {
        if (userIdParam) {
          setMessagesLoading(true);

          // 1. Instantly update profile info and selected state if we have it in cache
          const existingProfile = userProfiles[userIdParam];
          const profile =
            existingProfile || (await profileService.getProfile(userIdParam));

          if (!existingProfile) {
            setUserProfiles((prev) => ({ ...prev, [userIdParam]: profile }));
          }

          setOtherUserProfile(profile);

          // 2. Get conversation and messages
          const convId = await messageService.getOrCreateConversation(
            currentUser.id,
            userIdParam,
          );
          const convMessages =
            await messageService.getMessagesByConversation(convId);

          // 3. Update swap context if present
          if (swapIdParam) {
            const swap = await swapService.getSwapById(swapIdParam);
            setCurrentSwap(swap);
          } else {
            setCurrentSwap(null);
          }

          // 4. Load attachments in bulk
          const attachmentsMap: Record<string, any[]> = {};
          if (convMessages.length > 0) {
            const messageIds = convMessages.map((m) => m.id);
            const allAttachments =
              await attachmentService.getAttachmentsByConversation(messageIds);

            // Group attachments by message ID
            for (const att of allAttachments) {
              if (!attachmentsMap[att.message_id]) {
                attachmentsMap[att.message_id] = [];
              }
              attachmentsMap[att.message_id].push(att);
            }
          }

          // 5. Commit state updates in one go to prevent flickering
          setMessages(convMessages);
          setAttachments(attachmentsMap);
          setSelectedConversation({
            id: convId,
            otherUserId: userIdParam,
            otherProfile: profile,
            swapId: swapIdParam,
          });
        } else {
          setSelectedConversation(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading chat detail:", error);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadChatData();
  }, [userIdParam, swapIdParam, currentUser]);

  // Separate effect to handle polling for the ACTIVE conversation
  useEffect(() => {
    // Polling fallback to ensure sync (every 3 seconds)
    const pollInterval = setInterval(() => {
      if (
        selectedConversation?.id &&
        !aiAssistantService.isAssistantConversation(selectedConversation.id)
      ) {
        loadConversations(currentUser.id);
        // Only fetch if tab is visible to save resources
        if (!document.hidden) {
          messageService
            .getMessagesByConversation(selectedConversation.id)
            .then((msgs) => {
              if (msgs && msgs.length > 0) {
                setMessages((prev) => {
                  // Only update if count differs or last message is different
                  if (
                    prev.length !== msgs.length ||
                    prev[prev.length - 1]?.id !== msgs[msgs.length - 1]?.id
                  ) {
                    return msgs;
                  }
                  return prev;
                });

                // Check for offer updates in polled messages
                const lastMsg = msgs[msgs.length - 1];
                const msgContent = (lastMsg?.content || "").toLowerCase();
                if (
                  msgContent.includes("accepted") ||
                  msgContent.includes("declined") ||
                  msgContent.includes("offer")
                ) {
                  setOfferRefreshKey((prev) => prev + 1);
                }
              }
            })
            .catch((err) => console.error("Polling error:", err));
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [selectedConversation?.id, currentUser]);

  // Real-time subscription for global messages (updates conversation list)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("global_messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Filter in callback for reliability
          if (newMsg && newMsg.receiver_id === currentUser.id) {
            console.log("✅ Global message received for user:", newMsg.id);
            loadConversations(currentUser.id);
          }
        },
      )
      .subscribe((status) => {
        console.log("📡 Global messages subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Real-time for current conversation
  useEffect(() => {
    if (!selectedConversation?.id || !currentUser) return;

    // Skip real-time subscriptions for virtual assistant conversations
    if (aiAssistantService.isAssistantConversation(selectedConversation.id)) {
      console.log(
        "Using virtual conversation, skipping real-time subscriptions",
      );
      return;
    }

    const channel = supabase
      .channel(`chat_realtime_${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMsg = payload.new as any;
          console.log("📨 Real-time payload received:", {
            eventType: payload.eventType,
            msgId: newMsg?.id,
            conversationId: newMsg?.conversation_id,
            expectedConversation: selectedConversation.id,
            senderId: newMsg?.sender_id,
            currentUserId: currentUser.id,
          });

          // Filter in callback for reliability
          if (!newMsg || newMsg.conversation_id !== selectedConversation.id) {
            console.log("❌ Message filtered out - wrong conversation");
            return;
          }

          if (payload.eventType === "INSERT") {
            console.log(
              "✅ Real-time message received:",
              newMsg.id,
              "from:",
              newMsg.sender_id,
            );
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) {
                console.log("⚠️ Message already exists, skipping:", newMsg.id);
                return prev;
              }
              const next = [...prev, newMsg].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );
              return next;
            });

            // Load attachments for new message
            const msgAttachments =
              await attachmentService.getAttachmentsByMessage(newMsg.id);
            if (msgAttachments.length > 0) {
              setAttachments((prev) => ({
                ...prev,
                [newMsg.id]: msgAttachments,
              }));
            }

            loadConversations(currentUser.id);

            // If message indicates offer status change, refresh all offer cards
            const msgContent = (newMsg.content || "").toLowerCase();
            if (
              msgContent.includes("accepted") ||
              msgContent.includes("declined") ||
              msgContent.includes("offer")
            ) {
              console.log("Offer-related message, refreshing cards");
              setOfferRefreshKey((prev) => prev + 1);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "swap_offers",
        },
        async (payload) => {
          const changedOffer = payload.new as any;
          // Check if this offer is relevant to current conversation
          if (
            changedOffer &&
            changedOffer.conversation_id === selectedConversation.id
          ) {
            console.log(
              "Offer updated in real-time:",
              changedOffer.id,
              changedOffer.status,
            );
            // Re-fetch messages to refresh any OfferCard components
            const msgs = await messageService.getMessagesByConversation(
              selectedConversation.id,
            );
            setMessages(msgs);
            // Also update the offerRefreshKey to force OfferCard re-fetch
            setOfferRefreshKey((prev) => prev + 1);
          }
        },
      )
      .subscribe((status) => {
        console.log(
          "📡 Chat subscription status:",
          status,
          "for conversation:",
          selectedConversation.id,
        );
        if (status === "SUBSCRIBED") {
          console.log(
            "✅ Real-time chat subscription ACTIVE for:",
            selectedConversation.id,
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, currentUser]);

  // Listen for profile updates to refresh user data
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (currentUser) {
        const updatedProfile = await profileService.getProfile(currentUser.id);
        if (updatedProfile) {
          setCurrentUser({ ...currentUser, ...updatedProfile });
        }
      }
      // Also refresh the other user profile if viewing a conversation
      if (selectedConversation?.otherUserId) {
        const updatedOtherProfile = await profileService.getProfile(
          selectedConversation.otherUserId,
        );
        if (updatedOtherProfile) {
          setOtherUserProfile(updatedOtherProfile);
        }
      }
      // Refresh all user profiles in conversations
      if (currentUser) {
        await loadConversations(currentUser.id);
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [currentUser, selectedConversation]);

  // Real-time subscriptions for chat starred/archived status
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`chat_metadata:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_starred",
          filter: `user_id=eq.${currentUser.id}`,
        },
        async () => {
          // Reload starred chats
          const starred = await chatManagementService.getStarredChats(
            currentUser.id,
          );
          setStarredChats(new Set(starred));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_archived",
          filter: `user_id=eq.${currentUser.id}`,
        },
        async () => {
          // Reload archived chats
          const archived = await chatManagementService.getArchivedChats(
            currentUser.id,
          );
          setArchivedChats(new Set(archived));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Enhanced Quick Actions Helpers
  const handleQuickResponse = async (text: string) => {
    setMessageText(text);
    setQuickActionsOpen(false);
    setActiveQuickSubPanel("main");
    // We'll let the user click "Send" or we can auto-send
    // Based on requirements: "Automatically insert/send that message into the chat"
    // So let's auto-send
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleAutoReplyGenerate = async () => {
    try {
      setIsGeneratingAutoReply(true);
      setActiveQuickSubPanel("auto-reply");

      const lastMessage =
        messages.length > 0 ? messages[messages.length - 1].content : "";
      const reply = await aiAssistantService.generateResponse(
        lastMessage,
        messages,
      );

      setAutoReplyPreview(reply);
    } catch (error) {
      console.error("Error generating auto reply:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI reply",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAutoReply(false);
    }
  };

  const handleAutoReplySend = () => {
    setMessageText(autoReplyPreview);
    setQuickActionsOpen(false);
    setActiveQuickSubPanel("main");
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleInitiateCall = async () => {
    // Generate a random Google Meet link
    const randomId =
      Math.random().toString(36).substring(2, 5) +
      "-" +
      Math.random().toString(36).substring(2, 6) +
      "-" +
      Math.random().toString(36).substring(2, 5);
    const meetLink = `https://meet.google.com/${randomId}`;
    const message = `Let's connect on Google Meet: ${meetLink}`;

    setMessageText(message);
    setQuickActionsOpen(false);
    setTimeout(() => handleSendMessage(), 100);

    // Optionally open link
    window.open(meetLink, "_blank");
  };

  const handleOpenCamera = () => {
    setIsCameraModalOpen(true);
    setQuickActionsOpen(false);
  };

  const handleAddResponse = () => {
    if (!nextResponseText.trim()) return;
    const updated = [...quickResponses, nextResponseText.trim()];
    setQuickResponses(updated);
    localStorage.setItem("customQuickResponses", JSON.stringify(updated));
    setNextResponseText("");
    setIsAddingResponse(false);
    toast({ title: "Success", description: "Quick response added" });
  };

  const handleDeleteResponse = (index: number) => {
    const updated = quickResponses.filter((_, i) => i !== index);
    setQuickResponses(updated);
    localStorage.setItem("customQuickResponses", JSON.stringify(updated));
    toast({ title: "Success", description: "Quick response deleted" });
  };

  const handleUpdateResponse = (index: number) => {
    if (!editResponseValue.trim()) return;
    const updated = [...quickResponses];
    updated[index] = editResponseValue.trim();
    setQuickResponses(updated);
    localStorage.setItem("customQuickResponses", JSON.stringify(updated));
    setEditingResponseIndex(null);
    setEditResponseValue("");
    toast({ title: "Success", description: "Quick response updated" });
  };

  const handleDownloadAll = async (msgAttachments: any[]) => {
    for (const attachment of msgAttachments) {
      try {
        const url = await attachmentService.getDownloadUrl(attachment.id);
        window.open(url, "_blank");
        // Small delay to avoid browser blocking multiple tabs
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    }
    toast({
      title: "Downloading...",
      description: `Starting download for ${msgAttachments.length} files.`,
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;

    try {
      setSending(true);

      // Check if this is an assistant conversation (uses virtual ID)
      const isAssistantChat = aiAssistantService.isAssistantConversation(
        selectedConversation.id,
      );

      let newMessage: any;

      if (isAssistantChat) {
        // For assistant chat, create message locally without trying to save to DB
        newMessage = {
          id: `local-${Date.now()}-${Math.random()}`,
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          receiver_id: selectedConversation.otherUserId,
          content: messageText.trim() || "",
          created_at: new Date().toISOString(),
          is_read: true,
        };

        setMessages((prev) => [...prev, newMessage]);
        console.log("Created local assistant message:", newMessage);
      } else {
        // For regular conversations, save to database
        newMessage = await messageService.sendMessage({
          sender_id: currentUser.id,
          receiver_id: selectedConversation.otherUserId,
          conversation_id: selectedConversation.id,
          swap_id: selectedConversation.swapId || undefined,
          content: messageText.trim() || "",
        });

        if (newMessage) {
          setMessages((prev) => [...prev, newMessage]);
        }
      }

      if (newMessage) {
        // Upload attachments if any (for assistant chats, store locally; for regular, use DB)
        if (selectedFiles.length > 0) {
          const uploadedAttachments = [];
          for (const file of selectedFiles) {
            if (!isAssistantChat) {
              const attachment = await attachmentService.createAttachment(
                file,
                newMessage.id,
              );
              uploadedAttachments.push(attachment);
            } else {
              // For assistant chat, create local attachment representation
              const localAttachment = {
                id: `local-att-${Date.now()}`,
                message_id: newMessage.id,
                file_name: file.name,
                file_size: file.size,
                file_url: URL.createObjectURL(file),
              };
              uploadedAttachments.push(localAttachment);
            }
          }
          setAttachments((prev) => ({
            ...prev,
            [newMessage.id]: uploadedAttachments,
          }));
        }

        // Log swap activity (only for regular conversations with swap context)
        if (!isAssistantChat && selectedConversation.swapId) {
          if (selectedFiles.length > 0) {
            await historyService.logActivity({
              swap_id: selectedConversation.swapId,
              user_id: currentUser.id,
              activity_type: "file_exchange",
              description: `Shared ${selectedFiles.length} file(s)`,
              metadata: { file_count: selectedFiles.length },
            });
          }

          await historyService.logActivity({
            swap_id: selectedConversation.swapId,
            user_id: currentUser.id,
            activity_type: "message",
            description: "Sent a message",
            metadata: { message_id: newMessage.id },
          });
        }

        setMessageText("");
        setSelectedFiles([]);
        loadConversations(currentUser.id);

        // If this is an assistant chat, generate and send AI response
        if (
          otherUserProfile &&
          aiAssistantService.isAssistantProfile(otherUserProfile)
        ) {
          try {
            // Generate AI response
            const aiResponse = await aiAssistantService.generateResponse(
              messageText.trim(),
              messages,
            );

            // Create a virtual assistant message for display
            const assistantMessage = {
              id: `assistant-${Date.now()}-${Math.random()}`,
              conversation_id: selectedConversation.id,
              sender_id: otherUserProfile.id,
              receiver_id: currentUser.id,
              content: aiResponse,
              created_at: new Date().toISOString(),
              is_read: true,
              is_assistant: true,
            };

            // Add AI message to UI with a slight delay for natural feel
            setTimeout(() => {
              setMessages((prev) => [...prev, assistantMessage]);
              loadConversations(currentUser.id);
            }, 50);
          } catch (error) {
            console.error("Error generating AI response:", error);
            // Don't show error to user, just fail silently for AI responses
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const selectConversation = async (conversation: any) => {
    try {
      setLoading(false);
      const otherProfile = userProfiles[conversation.otherUserId];
      setOtherUserProfile(otherProfile);

      const convMessages = await messageService.getMessagesByConversation(
        conversation.id,
      );

      setSelectedConversation({
        ...conversation,
        otherProfile,
      });
      setMessages(convMessages);

      // Load attachments for all messages
      const attachmentsMap: Record<string, any[]> = {};
      for (const msg of convMessages) {
        const msgAttachments = await attachmentService.getAttachmentsByMessage(
          msg.id,
        );
        if (msgAttachments.length > 0) {
          attachmentsMap[msg.id] = msgAttachments;
        }
      }
      setAttachments(attachmentsMap);

      if (conversation.swapId) {
        const swap = await swapService.getSwapById(conversation.swapId);
        setCurrentSwap(swap);
      } else {
        setCurrentSwap(null);
      }
    } catch (error) {
      console.error("Error selecting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const startChatWithUser = async (otherUser: any) => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get or create conversation ID
      const convId = await messageService.getOrCreateConversation(
        currentUser.id,
        otherUser.id,
      );

      // Update local cache of messages/conversations
      await loadConversations(currentUser.id);

      // Find the conversation object
      const conv = {
        id: convId,
        otherUserId: otherUser.id,
        // Other fields will be filled by selectConversation
      };

      await selectConversation(conv);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOfferCreated = () => {
    if (selectedConversation?.id) {
      const load = async () => {
        const msgs = await messageService.getMessagesByConversation(
          selectedConversation.id,
        );
        setMessages(msgs);
      };
      load();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredConversations = applyFilters(conversations).filter((conv) => {
    const profile = userProfiles[conv.otherUserId];
    const name = profile?.full_name?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  const canCreateOffer =
    selectedConversation &&
    currentUser &&
    otherUserProfile &&
    !isAssistantUser(otherUserProfile);

  return (
    <div className="flex flex-col h-[calc(100dvh-72px)] md:h-[calc(100vh-80px)] bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full py-0 md:py-4 px-0 md:px-4">
          <div className="bg-card md:rounded-2xl border-none md:border border-border shadow-none md:shadow-xl h-full flex overflow-hidden">
            {/* Left Panel: Conversations List */}
            <div
              className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-muted/10 ${selectedConversation ? "hidden md:flex" : "flex"}`}
            >
              <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold font-display text-foreground">
                      {activeFilter === "all"
                        ? "Messages"
                        : activeFilter === "starred"
                          ? "Starred Chats"
                          : activeFilter === "archived"
                            ? "Archived Chats"
                            : activeFilter === "unread"
                              ? "Unread Messages"
                              : activeFilter === "offers"
                                ? "Custom Offers"
                                : activeFilter === "assistant"
                                  ? "Assistant Chats"
                                  : "Messages"}
                    </h1>
                    {/* Filter Dropdown */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg px-2 h-8 hover:bg-muted flex items-center gap-1.5 text-muted-foreground"
                        onClick={() =>
                          setMenuOpenId(
                            menuOpenId === "filter-menu" ? null : "filter-menu",
                          )
                        }
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      {menuOpenId === "filter-menu" && (
                        <div className="absolute left-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                          <button
                            onClick={() => {
                              setActiveFilter("unread");
                              setMenuOpenId(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors ${activeFilter === "unread" ? "bg-terracotta/10 text-terracotta font-semibold" : ""}`}
                          >
                            <Bell className="h-4 w-4" />
                            Unread
                          </button>
                          <button
                            onClick={() => {
                              setActiveFilter("starred");
                              setMenuOpenId(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors border-t border-border/50 ${activeFilter === "starred" ? "bg-terracotta/10 text-terracotta font-semibold" : ""}`}
                          >
                            <Star className="h-4 w-4" />
                            Starred
                          </button>
                          <button
                            onClick={() => {
                              setActiveFilter("archived");
                              setMenuOpenId(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors border-t border-border/50 ${activeFilter === "archived" ? "bg-terracotta/10 text-terracotta font-semibold" : ""}`}
                          >
                            <Archive className="h-4 w-4" />
                            Archived
                          </button>
                          <button
                            onClick={() => {
                              setActiveFilter("all");
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors border-t border-border text-muted-foreground"
                          >
                            <X className="h-4 w-4" />
                            Clear Filter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* AI Assistant Quick Access */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-2 h-8 hover:bg-blue-50 flex items-center gap-1.5"
                    onClick={handleOpenAssistantChat}
                    title="Open AI Assistant"
                  >
                    <img src="/Ai.svg" alt="AI" className="h-[25px] w-[25px]" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background/50 border-muted focus-visible:ring-terracotta"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {loading ? (
                  <MessageListSkeleton />
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const profile = userProfiles[conv.otherUserId];
                    const isSelected =
                      selectedConversation?.otherUserId === conv.otherUserId;
                    const isStarred = starredChats.has(conv.id);
                    const isArchived = archivedChats.has(conv.id);
                    const isUnread =
                      conv.lastMessage?.receiver_id === currentUser?.id &&
                      conv.lastMessage?.read === false;
                    const isAssistant = isAssistantUser(profile);

                    return (
                      <div key={conv.id} className="relative group px-2 mb-1">
                        <button
                          onClick={() =>
                            setSearchParams({ user: conv.otherUserId })
                          }
                          className={`w-full p-3 flex items-center gap-3 transition-all rounded-xl text-left ${
                            isSelected
                              ? "bg-terracotta/10 ring-1 ring-terracotta/20 shadow-sm"
                              : isAssistant
                                ? "bg-blue-50/50 hover:bg-blue-50"
                                : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              key={getCacheBustedImageUrl(
                                profile?.profile_image_url,
                              )}
                              src={getCacheBustedImageUrl(
                                profile?.profile_image_url,
                              )}
                              alt="Avatar"
                              className={`h-11 w-11 rounded-full object-cover ring-2 shadow-sm ${
                                isSelected
                                  ? "ring-terracotta/30"
                                  : isAssistant
                                    ? "ring-blue-400 bg-blue-100"
                                    : "ring-background"
                              }`}
                            />
                            {isAssistant && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white flex items-center justify-center">
                                <span className="text-white text-[8px] font-bold">
                                  ✨
                                </span>
                              </div>
                            )}
                            {!isAssistant && (
                              <StatusDot
                                displayStatus={
                                  presenceMap[conv.otherUserId]?.status ||
                                  "offline"
                                }
                                size="sm"
                              />
                            )}
                            {isUnread && !isSelected && (
                              <div className="absolute -top-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-terracotta border-[1.5px] border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center justify-between mb-0.5 gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <p
                                  className={`text-sm font-bold truncate ${isAssistant ? "text-blue-700" : "text-foreground"} ${isUnread ? "font-black" : ""}`}
                                >
                                  {isAssistant && "🤖 "}
                                  {profile?.full_name || "User"}
                                </p>
                                {isStarred && (
                                  <Star className="h-3 w-3 flex-shrink-0 text-golden fill-golden" />
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-muted-foreground/60 flex-shrink-0 uppercase">
                                {formatTime(conv.lastMessage.created_at)}
                              </span>
                            </div>
                            <p
                              className={`text-xs truncate font-medium ${isSelected ? "text-terracotta" : isAssistant ? "text-blue-600" : isUnread ? "font-bold text-foreground" : "text-muted-foreground/80"}`}
                            >
                              {conv.lastMessage.content}
                            </p>
                          </div>
                        </button>

                        {/* Chat Context Menu */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(
                                  menuOpenId === conv.id ? null : conv.id,
                                );
                              }}
                              className="p-1.5 rounded-lg transition-colors hover:bg-muted"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {menuOpenId === conv.id && (
                              <div className="absolute right-0 mt-0 w-40 bg-white border border-border rounded-lg shadow-lg">
                                <button
                                  onClick={(e) => handleStarChat(e, conv.id)}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2 transition-colors"
                                >
                                  <Star
                                    className={`h-4 w-4 ${isStarred ? "fill-golden text-golden" : ""}`}
                                  />
                                  {isStarred ? "Unstar" : "Star"}
                                </button>
                                <button
                                  onClick={(e) => handleArchiveChat(e, conv.id)}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2 transition-colors border-t border-border"
                                >
                                  <Archive className="h-4 w-4" />
                                  {isArchived ? "Unarchive" : "Archive"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Chat Window */}
            <div
              className={`flex-1 flex flex-col bg-background/50 ${!selectedConversation ? "hidden md:flex" : "flex"}`}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 px-4 md:p-4 border-b border-border flex items-center justify-between sticky top-0 backdrop-blur-sm z-10 bg-white/40 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden -ml-2 rounded-full"
                        onClick={() => {
                          setSelectedConversation(null);
                          setSearchParams({});
                        }}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <div className="relative">
                        <img
                          key={getCacheBustedImageUrl(
                            otherUserProfile?.profile_image_url,
                          )}
                          src={getCacheBustedImageUrl(
                            otherUserProfile?.profile_image_url,
                          )}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full object-cover shadow-sm ring-1 ring-border"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-none mb-1.5">
                          {otherUserProfile?.full_name || "User"}
                        </p>
                        <p className="text-[11px] font-medium truncate flex items-center gap-1.5 text-muted-foreground">
                          {isAssistantUser(otherUserProfile) ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse"></span>
                              AI Assistant
                            </>
                          ) : (
                            <>
                              {presenceMap[otherUserProfile?.id]?.status ===
                                "online" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              )}
                              Local time:{" "}
                              {(() => {
                                try {
                                  const timezone = otherUserProfile?.timezone;
                                  // Check if timezone is in valid IANA format, otherwise use local
                                  const validTimezone =
                                    timezone && !timezone.startsWith("UTC")
                                      ? timezone
                                      : Intl.DateTimeFormat().resolvedOptions()
                                          .timeZone;
                                  return new Date().toLocaleTimeString(
                                    "en-US",
                                    {
                                      timeZone: validTimezone,
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  );
                                } catch (e) {
                                  // Fallback if timezone parsing fails
                                  return new Date().toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  );
                                }
                              })()}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {canCreateOffer && (
                      <Button
                        variant="terracotta"
                        size="sm"
                        onClick={() => setCreateOfferOpen(true)}
                        className="rounded-full px-4 shadow-md transition-transform hover:scale-105"
                      >
                        <Handshake className="h-4 w-4 mr-2" />
                        Send Offer
                      </Button>
                    )}
                  </div>

                  {/* Messages Stream */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-soft-sand/20 relative"
                  >
                    {messagesLoading && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
                      </div>
                    )}
                    {messages.length > 0 ? (
                      messages.map((message, index) => {
                        const isMe = message.sender_id === currentUser?.id;
                        const hasOffer = !!message.offer_id;
                        const msgAttachments = attachments[message.id] || [];
                        const senderProfile = isMe
                          ? currentUser
                          : userProfiles[message.sender_id] || otherUserProfile;
                        const isAssistant = isAssistantUser(senderProfile);

                        if (hasOffer) {
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMe ? "justify-end" : "justify-start"} mb-6 animate-in fade-in slide-in-from-bottom-2`}
                            >
                              <div className="max-w-[85%] md:max-w-[70%]">
                                <OfferCard
                                  key={message.offer_id}
                                  offerId={message.offer_id}
                                  currentUserId={currentUser?.id || ""}
                                  onOfferUpdated={handleOfferCreated}
                                  refreshTrigger={offerRefreshKey}
                                />
                              </div>
                            </div>
                          );
                        }

                        return (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            isMe={isMe}
                            senderProfile={senderProfile}
                            attachments={msgAttachments}
                            onDownloadAll={handleDownloadAll}
                            isAssistant={isAssistant}
                          />
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                        <MessageCircle className="h-12 w-12 stroke-1" />
                        <p className="text-sm">
                          No messages yet. Send a greeting!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="bg-muted/20 border-t border-border">
                    {/* Quick Actions Panel */}
                    {quickActionsOpen && (
                      <div className="bg-background border-b border-border p-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="w-full max-w-4xl mx-auto">
                          {activeQuickSubPanel === "main" && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 gap-2 rounded-xl hover:bg-terracotta/5 hover:border-terracotta/30 group transition-all"
                                onClick={() => {
                                  setCreateOfferOpen(true);
                                  setQuickActionsOpen(false);
                                }}
                              >
                                <div className="h-10 w-10 rounded-full bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20">
                                  <FileText className="h-5 w-5 text-terracotta" />
                                </div>
                                <span className="text-xs font-semibold">
                                  Create an offer
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 gap-2 rounded-xl hover:bg-blue-50 hover:border-blue-200 group transition-all"
                                onClick={() =>
                                  setActiveQuickSubPanel("responses")
                                }
                              >
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200">
                                  <Zap className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="text-xs font-semibold">
                                  Quick response
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 gap-2 rounded-xl hover:bg-teal/5 hover:border-teal/30 group transition-all"
                                onClick={handleAutoReplyGenerate}
                              >
                                <div className="h-10 w-10 rounded-full bg-teal/10 flex items-center justify-center group-hover:bg-teal/20">
                                  <Clock className="h-5 w-5 text-teal-600" />
                                </div>
                                <span className="text-xs font-semibold">
                                  Auto Reply
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 gap-2 rounded-xl hover:bg-amber/5 hover:border-amber/30 group transition-all"
                                onClick={() => {
                                  fileInputRef.current?.setAttribute(
                                    "accept",
                                    "image/*",
                                  );
                                  fileInputRef.current?.click();
                                  setQuickActionsOpen(false);
                                }}
                              >
                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200">
                                  <ImageIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <span className="text-xs font-semibold">
                                  Photo album
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 gap-2 rounded-xl hover:bg-indigo/5 hover:border-indigo/30 group transition-all"
                                onClick={handleInitiateCall}
                              >
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200">
                                  <Video className="h-5 w-5 text-indigo-600" />
                                </div>
                                <span className="text-xs font-semibold">
                                  Initiate call
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 gap-2 rounded-xl hover:bg-muted group transition-all"
                                onClick={handleOpenCamera}
                              >
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80">
                                  <Camera className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="text-xs font-semibold">
                                  Open Camera
                                </span>
                              </Button>
                            </div>
                          )}

                          {activeQuickSubPanel === "responses" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-blue-600" />
                                  Quick Responses
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveQuickSubPanel("main")}
                                  className="h-8 text-xs underline"
                                >
                                  Back
                                </Button>
                              </div>

                              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                {quickResponses.map((resp, i) => (
                                  <div
                                    key={i}
                                    className="group relative flex items-center gap-2"
                                  >
                                    {editingResponseIndex === i ? (
                                      <div className="flex-1 flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                                        <Input
                                          value={editResponseValue}
                                          onChange={(e) =>
                                            setEditResponseValue(e.target.value)
                                          }
                                          className="flex-1 h-10 py-2 border-terracotta/30 focus-visible:ring-terracotta"
                                          autoFocus
                                        />
                                        <Button
                                          size="icon"
                                          variant="terracotta"
                                          className="h-10 w-10 shrink-0"
                                          onClick={() =>
                                            handleUpdateResponse(i)
                                          }
                                        >
                                          <CheckCheck className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-10 w-10 shrink-0"
                                          onClick={() =>
                                            setEditingResponseIndex(null)
                                          }
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleQuickResponse(resp)
                                          }
                                          className="flex-1 text-left p-3 rounded-lg bg-muted/30 hover:bg-blue-50 hover:text-blue-700 text-sm transition-all border border-transparent hover:border-blue-200 truncate"
                                        >
                                          {resp}
                                        </button>
                                        <div className="flex shrink-0 gap-1 pr-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                              setEditingResponseIndex(i);
                                              setEditResponseValue(resp);
                                            }}
                                            title="Edit response"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() =>
                                              handleDeleteResponse(i)
                                            }
                                            title="Delete response"
                                          >
                                            <Minus className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}

                                {/* Add New Section */}
                                {isAddingResponse ? (
                                  <div className="mt-2 flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                                    <Input
                                      placeholder="Type new response..."
                                      value={nextResponseText}
                                      onChange={(e) =>
                                        setNextResponseText(e.target.value)
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" && handleAddResponse()
                                      }
                                      className="flex-1 h-11 border-terracotta/30 focus-visible:ring-terracotta"
                                      autoFocus
                                    />
                                    <Button
                                      variant="terracotta"
                                      className="h-11 px-6 shadow-sm"
                                      onClick={handleAddResponse}
                                    >
                                      Add
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-11 w-11"
                                      onClick={() => setIsAddingResponse(false)}
                                    >
                                      <X className="h-5 w-5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="mt-2 w-full h-12 border-dashed border-2 border-muted-foreground/30 text-muted-foreground hover:text-terracotta hover:border-terracotta/50 hover:bg-terracotta/5 rounded-xl transition-all"
                                    onClick={() => setIsAddingResponse(true)}
                                  >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Custom Response
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {activeQuickSubPanel === "auto-reply" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-blue-500" />
                                  AI Auto Reply
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveQuickSubPanel("main")}
                                  className="h-8 text-xs underline"
                                >
                                  Back
                                </Button>
                              </div>

                              {isGeneratingAutoReply ? (
                                <AutoReplySkeleton />
                              ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 italic text-sm text-blue-800 leading-relaxed shadow-inner min-h-[60px]">
                                    "{autoReplyPreview}"
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className="flex-1 rounded-xl h-11 text-xs"
                                      onClick={handleAutoReplyGenerate}
                                    >
                                      Regenerate
                                    </Button>
                                    <Button
                                      variant="terracotta"
                                      className="flex-[2] rounded-xl h-11 text-sm shadow-md"
                                      onClick={handleAutoReplySend}
                                    >
                                      Send AI Reply
                                    </Button>
                                  </div>
                                  <p className="text-center text-[10px] text-muted-foreground">
                                    AI-generated replies are meant for
                                    convenience. Please review before sending.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="py-3 px-2">
                      {/* Selected Files Preview */}
                      {selectedFiles.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                            >
                              <Paperclip className="h-3 w-3" />
                              <span className="flex-1 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {attachmentService.formatFileSize(file.size)}
                              </span>
                              <button
                                onClick={() =>
                                  setSelectedFiles((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="w-full px-2 md:px-4 flex gap-2 items-end">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setSelectedFiles((prev) => [...prev, ...files]);
                          }}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (quickActionsOpen) {
                              setQuickActionsOpen(false);
                            } else {
                              setActiveQuickSubPanel("main");
                              setQuickActionsOpen(true);
                            }
                          }}
                          className={`flex-shrink-0 transition-transform ${quickActionsOpen ? "rotate-0 text-terracotta" : "rotate-0 text-muted-foreground"}`}
                        >
                          {quickActionsOpen ? (
                            <XCircle className="h-6 w-6" />
                          ) : (
                            <PlusCircle className="h-6 w-6" />
                          )}
                        </Button>

                        <div className="flex-1 flex items-end bg-background/50 rounded-2xl border border-border px-3 focus-within:ring-1 focus-within:ring-terracotta/30 transition-all">
                          <Textarea
                            placeholder="Type your message..."
                            value={messageText}
                            onChange={(e) => {
                              setMessageText(e.target.value);
                              // Close quick actions when user starts typing if desired,
                              // but requirement says "The quick options panel should not block or override the keyboard"
                            }}
                            onFocus={() => {
                              // Optional: hide quick actions on focus to give space for keyboard
                              // setQuickActionsOpen(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="flex-1 resize-none border-0 shadow-none outline-none ring-0 ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:shadow-none px-1 py-3 text-sm min-h-[44px] max-h-[120px] bg-transparent"
                            rows={1}
                          />
                        </div>
                        <Button
                          variant="terracotta"
                          size="icon"
                          onClick={handleSendMessage}
                          disabled={
                            sending ||
                            (!messageText.trim() && selectedFiles.length === 0)
                          }
                          className="h-11 w-11 rounded-2xl shadow-md transition-transform active:scale-95 flex-shrink-0"
                        >
                          {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/10">
                  <div className="h-20 w-20 bg-gradient-to-br from-terracotta/10 to-teal/10 rounded-full flex items-center justify-center mb-4">
                    <Handshake className="h-10 w-10 text-terracotta/60" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-2">
                    Your Conversations
                  </h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                    Select a conversation from the list to view your chat
                    history and swap offers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedConversation && (
        <CreateOfferDialog
          open={createOfferOpen}
          onOpenChange={setCreateOfferOpen}
          conversationId={selectedConversation.id}
          swapId={currentSwap?.id}
          receiverId={selectedConversation.otherUserId}
          onOfferCreated={handleOfferCreated}
        />
      )}

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(file) => {
          setSelectedFiles((prev) => [...prev, file]);
          // We can also auto-trigger send if we want
          // handleSendMessage();
        }}
      />
    </div>
  );
};

export default Messages;
