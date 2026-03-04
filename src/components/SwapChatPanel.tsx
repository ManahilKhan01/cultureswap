import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  Paperclip,
  X,
  CheckCheck,
  Download,
  FileText,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messageService } from "@/lib/messageService";
import { attachmentService } from "@/lib/attachmentService";
import { historyService } from "@/lib/historyService";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { OfferCard } from "@/components/OfferCard";
import { ChatMessage } from "@/components/ChatMessage";

interface SwapChatPanelProps {
  swapId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  onClose?: () => void;
}

export const SwapChatPanel = ({
  swapId,
  currentUserId,
  otherUserId,
  otherUserName = "User",
  otherUserAvatar,
  onClose,
}: SwapChatPanelProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, [swapId, currentUserId, otherUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`swap_chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            );
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
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "swap_offers",
        },
        () => {
          loadMessages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, swapId]);

  const loadMessages = async () => {
    try {
      setLoading(true);

      // Get or create conversation
      const convId = await messageService.getOrCreateConversation(
        currentUserId,
        otherUserId,
      );
      setConversationId(convId);

      // Get messages for this conversation (no swap_id filtering to sync with main chat)
      const data = await messageService.getMessagesByConversation(convId);
      setMessages(data || []);

      // Load attachments for all messages
      const attachmentsMap: Record<string, any[]> = {};
      for (const msg of data || []) {
        const msgAttachments = await attachmentService.getAttachmentsByMessage(
          msg.id,
        );
        if (msgAttachments.length > 0) {
          attachmentsMap[msg.id] = msgAttachments;
        }
      }
      setAttachments(attachmentsMap);
    } catch (error) {
      console.error("Error loading swap messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOfferUpdated = () => {
    loadMessages();
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;

    try {
      setSending(true);

      // Send message
      const newMessage = await messageService.sendMessage({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        conversation_id: conversationId!,
        swap_id: swapId || undefined,
        content: messageText.trim() || "",
      });

      if (newMessage) {
        // Upload attachments if any
        if (selectedFiles.length > 0) {
          const uploadedAttachments = [];
          for (const file of selectedFiles) {
            const attachment = await attachmentService.createAttachment(
              file,
              newMessage.id,
            );
            uploadedAttachments.push(attachment);
          }

          // Update attachments state
          setAttachments((prev) => ({
            ...prev,
            [newMessage.id]: uploadedAttachments,
          }));

          // Log file exchange activity
          await historyService.logActivity({
            swap_id: swapId,
            user_id: currentUserId,
            activity_type: "file_exchange",
            description: `Shared ${selectedFiles.length} file(s)`,
            metadata: { file_count: selectedFiles.length },
          });
        }

        // Log message activity
        await historyService.logActivity({
          swap_id: swapId,
          user_id: currentUserId,
          activity_type: "message",
          description: "Sent a message",
          metadata: { message_id: newMessage.id },
        });

        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        setSelectedFiles([]);
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

  const handleDownloadAll = async (msgAttachments: any[]) => {
    for (const attachment of msgAttachments) {
      try {
        const url = await attachmentService.getDownloadUrl(attachment.id);
        window.open(url, "_blank");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="h-full flex flex-col shadow-xl rounded-none border-0">
      <CardHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherUserAvatar && (
              <div className="relative">
                <img
                  src={otherUserAvatar}
                  alt={otherUserName}
                  className={`h-10 w-10 rounded-full object-cover ring-2 ${otherUserName?.toLowerCase().includes("assistant")
                      ? "ring-blue-400 bg-blue-100"
                      : "ring-border"
                    }`}
                />
                {otherUserName?.toLowerCase().includes("assistant") && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white text-[10px] flex items-center justify-center text-white font-bold">
                    ✨
                  </div>
                )}
              </div>
            )}
            <div>
              <CardTitle
                className={`text-lg ${otherUserName?.toLowerCase().includes("assistant") ? "text-blue-700" : ""}`}
              >
                {otherUserName?.toLowerCase().includes("assistant") && "🤖 "}
                {otherUserName}
              </CardTitle>
              {/* <p
                className={`text-xs ${otherUserName?.toLowerCase().includes("assistant") ? "text-blue-600 font-medium" : "text-muted-foreground"}`}
              >
                {otherUserName?.toLowerCase().includes("assistant")
                  ? "AI Assistant"
                  : "Swap Chat"}
              </p> */}
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.sender_id === currentUserId;
                const msgAttachments = attachments[message.id] || [];
                const hasOffer = !!message.offer_id;
                const isAssistant = otherUserName
                  ?.toLowerCase()
                  .includes("assistant");

                // Construct a profile object for ChatMessage
                const senderProfile = isMe
                  ? {
                    full_name: "You",
                    profile_image_url: null, // Will fallback to default in ChatMessage if needed
                  }
                  : {
                    full_name: otherUserName,
                    profile_image_url: otherUserAvatar,
                  };

                if (hasOffer) {
                  return (
                    <div
                      key={message.id}
                      className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="max-w-[85%]">
                        <OfferCard
                          offerId={message.offer_id}
                          currentUserId={currentUserId}
                          onOfferUpdated={handleOfferUpdated}
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
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm shadow-sm"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="hover:bg-background rounded-full p-1 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full shrink-0 h-10 w-10 text-muted-foreground hover:bg-muted"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <div className="flex-1 bg-muted/40 hover:bg-muted/60 focus-within:bg-background focus-within:ring-1 focus-within:ring-border rounded-2xl border border-transparent transition-all px-4 py-1.5">
              <Textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="resize-none border-none focus-visible:ring-0 p-0 text-sm min-h-[36px] max-h-[120px] bg-transparent py-2 flex items-center"
                rows={1}
              />
            </div>

            <Button
              variant="terracotta"
              size="icon"
              onClick={handleSendMessage}
              disabled={
                sending || (!messageText.trim() && selectedFiles.length === 0)
              }
              className="rounded-full shrink-0 h-10 w-10 shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 -ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
