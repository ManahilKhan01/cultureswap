import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Handshake,
  MessageCircle,
  CheckCircle,
  XCircle,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/lib/notificationService";
import { profileService } from "@/lib/profileService";
import { supabase } from "@/lib/supabase";
import { getCacheBustedImageUrl } from "@/lib/cacheUtils";

const Notifications = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUser(user);

        // Get all notifications (not just unread)
        const allNotifs = await notificationService.getAllNotifications(
          user.id,
        );
        setNotifications(allNotifs);

        // Load sender profiles
        const profiles: Record<string, any> = {};
        for (const notif of allNotifs) {
          if (notif.sender_id && !profiles[notif.sender_id]) {
            const senderProfile = await profileService.getProfile(
              notif.sender_id,
            );
            profiles[notif.sender_id] = senderProfile;
          }
        }
        setSenderProfiles(profiles);
      } catch (error) {
        console.error("Error loading notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Subscribe to new notifications
  useEffect(() => {
    if (!currentUser?.id) return;

    const subscription = notificationService.subscribeToNotifications(
      currentUser.id,
      async (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);

        // Load sender profile
        if (
          newNotification.sender_id &&
          !senderProfiles[newNotification.sender_id]
        ) {
          const profile = await profileService.getProfile(
            newNotification.sender_id,
          );
          setSenderProfiles((prev) => ({
            ...prev,
            [newNotification.sender_id]: profile,
          }));
        }
      },
    );

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [currentUser?.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case "new_offer":
        return <Handshake className="h-5 w-5 text-terracotta" />;
      case "offer_accepted":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "offer_rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "message":
        return <MessageCircle className="h-5 w-5 text-teal" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    }

    // Navigate based on notification data
    const notifData = notification.data || {};
    if (notifData.conversation_id || notification.sender_id) {
      navigate(`/messages?user=${notification.sender_id}`);
    } else if (notifData.swap_id) {
      navigate(`/swap/${notifData.swap_id}`);
    }
  };

  const markAllRead = async () => {
    if (!currentUser?.id) return;

    try {
      await notificationService.markAllAsRead(currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Notifications
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notifications`
                : "You're all caught up!"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const senderProfile = senderProfiles[notification.sender_id];
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? "bg-terracotta/5" : ""}`}
                  >
                    <div className="relative flex-shrink-0">
                      {senderProfile?.profile_image_url ? (
                        <img
                          src={getCacheBustedImageUrl(
                            senderProfile.profile_image_url,
                          )}
                          alt={senderProfile.full_name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center ${!notification.read ? "bg-terracotta/10" : "bg-muted"}`}
                        >
                          {getIcon(notification.type)}
                        </div>
                      )}
                      {/* Type icon badge */}
                      <div
                        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center ${
                          notification.type === "offer_accepted"
                            ? "bg-green-500"
                            : notification.type === "offer_rejected"
                              ? "bg-red-500"
                              : notification.type === "new_offer"
                                ? "bg-terracotta"
                                : "bg-teal"
                        }`}
                      >
                        {notification.type === "new_offer" && (
                          <Handshake className="h-2.5 w-2.5 text-white" />
                        )}
                        {notification.type === "offer_accepted" && (
                          <CheckCircle className="h-2.5 w-2.5 text-white" />
                        )}
                        {notification.type === "offer_rejected" && (
                          <XCircle className="h-2.5 w-2.5 text-white" />
                        )}
                        {notification.type === "message" && (
                          <MessageCircle className="h-2.5 w-2.5 text-white" />
                        )}
                        {![
                          "new_offer",
                          "offer_accepted",
                          "offer_rejected",
                          "message",
                        ].includes(notification.type) && (
                          <Bell className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`font-medium ${!notification.read ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.body}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge className="bg-terracotta text-white shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Notifications;
