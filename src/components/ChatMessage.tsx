import { Download, FileText, CheckCheck, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attachmentService } from "@/lib/attachmentService";
import { getCacheBustedImageUrl } from "@/lib/cacheUtils";
import { format } from "date-fns";

interface ChatMessageProps {
  message: any;
  isMe: boolean;
  senderProfile: any;
  attachments: any[];
  onDownloadAll?: (attachments: any[]) => void;
  isAssistant?: boolean;
}

export const ChatMessage = ({
  message,
  isMe,
  senderProfile,
  attachments = [],
  onDownloadAll,
  isAssistant = false,
}: ChatMessageProps) => {
  const timestamp = new Date(message.created_at);
  const formattedTime = format(timestamp, "dd MMM, HH:mm");

  const handleDownload = async (attachment: any) => {
    try {
      const url = await attachmentService.getDownloadUrl(attachment.id);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  // Display name: "Me" for current user, otherwise show their name
  const displayName = isMe ? "Me" : senderProfile?.full_name || "User";

  return (
    <div className="flex flex-col mb-6 group animate-in fade-in slide-in-from-bottom-2 duration-300 w-full items-start">
      {/* Sender Info Table (Avatar + Name + Timestamp) */}
      <div className="flex items-center justify-between mb-1.5 w-full flex-row">
        <div className="flex items-center gap-2 flex-row">
          <div className="relative">
            <img
              src={getCacheBustedImageUrl(senderProfile?.profile_image_url)}
              alt={senderProfile?.full_name || "User"}
              className={`h-8 w-8 rounded-full object-cover shadow-sm ring-2 ${isAssistant ? "ring-blue-400 bg-blue-100" : "ring-border/50"}`}
            />
            {isAssistant && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-500 border border-white flex items-center justify-center">
                <span className="text-white text-[6px] font-bold">✨</span>
              </div>
            )}
          </div>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground/70">
          {formattedTime}
        </span>
      </div>

      {/* Message Content Container */}
      <div className="max-w-[85%] md:max-w-[70%] relative flex flex-col items-start">
        {/* Text Content */}
        {message.content && message.content.trim() && (
          <div
            className={`relative rounded-2xl px-4 py-3 shadow-sm ${
              isMe
                ? "bg-terracotta text-white rounded-tl-none"
                : `border rounded-tl-none ${isAssistant ? "bg-blue-50 border-blue-100 text-foreground" : "bg-white border-border/40 text-foreground"}`
            }`}
          >
            <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap font-medium">
              {message.content}
            </p>
          </div>
        )}

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-3 flex flex-col items-start">
            {attachments.length > 1 && onDownloadAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadAll(attachments)}
                className="h-8 text-[11px] font-bold tracking-tight rounded-lg bg-white/80 backdrop-blur border-border/50 hover:bg-terracotta/5 hover:text-terracotta transition-all"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download All ({attachments.length})
              </Button>
            )}

            <div
              className={`grid gap-3 ${attachments.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
            >
              {attachments.map((attachment) => {
                const isImage = attachmentService.isImage(attachment.file_type);
                return (
                  <div
                    key={attachment.id}
                    className="group/card relative bg-white border border-border/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-[300px]"
                  >
                    {isImage ? (
                      <div className="relative aspect-video bg-muted/20 overflow-hidden">
                        <img
                          src={attachment.url}
                          alt={attachment.file_name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="p-4 flex items-center justify-center bg-muted/10 h-[100px]">
                        <FileText className="h-10 w-10 text-terracotta/40" />
                      </div>
                    )}

                    <div className="p-3 bg-white flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[12px] font-bold text-foreground truncate"
                          title={attachment.file_name}
                        >
                          {attachment.file_name}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground/70">
                          {attachmentService.formatFileSize(
                            attachment.file_size,
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(attachment)}
                        className="h-8 w-8 rounded-full bg-soft-sand/50 hover:bg-terracotta hover:text-white transition-all shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
