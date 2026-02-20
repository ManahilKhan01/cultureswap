import { useState } from "react";
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SessionManagerProps {
  swapId: string;
  sessions: any[];
  loading?: boolean;
  currentUserId?: string;
  onDeleteSession?: (sessionId: string) => void;
}

export const SessionManager = ({
  swapId,
  sessions,
  loading = false,
  currentUserId,
  onDeleteSession,
}: SessionManagerProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (sessionId: string) => {
    if (!onDeleteSession) return;
    setDeletingId(sessionId);
    try {
      await onDeleteSession(sessionId);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            Scheduled
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
            Cancelled
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-terracotta/20 scrollbar-track-transparent">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 pr-8">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session.status)}
                      {session.duration_minutes && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-background/50 px-1.5 py-0.5 rounded">
                          {Math.round((session.duration_minutes / 60) * 10) /
                            10}{" "}
                          hours
                        </span>
                      )}
                    </div>
                    {session.scheduled_at && (
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-terracotta/70" />
                          <span className="font-medium text-foreground/80">
                            {formatDate(session.scheduled_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-terracotta/70" />
                          <span>{formatTime(session.scheduled_at)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="hidden sm:block">
                      <a
                        href={session.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                          session.status === "expired" ||
                          session.status === "cancelled"
                            ? "text-muted-foreground pointer-events-none"
                            : "text-terracotta hover:text-terracotta/80"
                        }`}
                      >
                        <Video className="h-3.5 w-3.5" />
                        Link
                      </a>
                    </div>

                    {/* Delete Button */}
                    {session.status === "scheduled" &&
                      currentUserId &&
                      onDeleteSession && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(session.id)}
                          disabled={deletingId === session.id}
                          title="Delete this session"
                        >
                          {deletingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <a
                    href={session.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 py-2 w-full rounded-lg transition-all text-sm font-medium group ${
                      session.status === "expired" ||
                      session.status === "cancelled"
                        ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                        : "bg-terracotta/5 text-terracotta hover:bg-terracotta hover:text-white"
                    }`}
                  >
                    <Video className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {session.status === "expired"
                      ? "Link Expired"
                      : "Join Meeting"}
                    {session.status !== "expired" &&
                      session.status !== "cancelled" && (
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      )}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
