import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import logo from "@/assets/logo.svg";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  Bell,
  MessageCircle,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Handshake,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { notificationService } from "@/lib/notificationService";
import { messageService } from "@/lib/messageService";
import { profileService } from "@/lib/profileService";
import { presenceService } from "@/lib/presenceService";
import { StatusDot } from "@/components/StatusDot";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useProfileUpdates } from "@/hooks/useProfileUpdates";
import { getCacheBustedImageUrl } from "@/lib/cacheUtils";

interface NavbarProps {
  isLoggedIn?: boolean;
}

const Navbar = ({ isLoggedIn = false }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, any>>({});
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationProfiles, setConversationProfiles] = useState<
    Record<string, any>
  >({});
  const [loadingConvs, setLoadingConvs] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Use the new unread messages hook for accurate real-time tracking
  const { total: unreadMessages, markConversationAsRead } = useUnreadMessages(
    currentUser?.id || null,
  );

  // Use real-time profile updates hook
  const { profile } = useProfileUpdates(currentUser?.id || null);

  // Compute display values from real-time profile or cache
  const userName =
    profile?.full_name?.split(" ")[0] ||
    currentUser?.email?.split("@")[0] ||
    "User";
  const userImage = profile?.profile_image_url || null;
  const userImageUrl = getCacheBustedImageUrl(userImage);

  useEffect(() => {
    // Get logged in user
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);

          // Start presence heartbeat
          presenceService.startHeartbeat();

          // Load notifications
          const unreadNotifs = await notificationService.getUnreadNotifications(
            user.id,
          );
          setNotifications(unreadNotifs);
          setUnreadCount(unreadNotifs.length); // Show actual unread count

          // Load sender profiles
          const profiles: Record<string, any> = {};
          for (const notif of unreadNotifs) {
            if (notif.sender_id && !profiles[notif.sender_id]) {
              const senderProfile = await profileService.getProfile(
                notif.sender_id,
              );
              profiles[notif.sender_id] = senderProfile;
            }
          }
          setSenderProfiles(profiles);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };

    if (isLoggedIn) {
      loadUser();
    }
  }, [isLoggedIn]);

  // Handle subscriptions separately once currentUser is available
  // Load conversations for message dropdown
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    const loadConversations = async () => {
      try {
        setLoadingConvs(true);
        const convs = await messageService.getConversations(currentUser.id);

        // Load profiles for each conversation
        const profiles: Record<string, any> = {};
        for (const conv of convs) {
          if (conv.otherUserId && !profiles[conv.otherUserId]) {
            const profile = await profileService.getProfile(conv.otherUserId);
            profiles[conv.otherUserId] = profile;
          }
        }

        setConversations(convs.slice(0, 7)); // Show max 7 conversations
        setConversationProfiles(profiles);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoadingConvs(false);
      }
    };

    loadConversations();
  }, [isLoggedIn, currentUser?.id, unreadMessages]); // Reload when unread count changes

  // Handle subscriptions separately once currentUser is available
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    // Set up real-time subscription for notifications
    const subscription = notificationService.subscribeToNotifications(
      currentUser.id,
      async (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Load sender profile
        if (newNotification.sender_id) {
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
  }, [isLoggedIn, currentUser?.id]);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Swaps", href: "/swaps" },
    { name: "Discover", href: "/discover" },
    // { name: "Community", href: "/community" }, // Hidden for now
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear localStorage cache
      localStorage.removeItem("navbar_profile_cache");
      // Redirect to landing page
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-3 sm:px-6 md:px-8">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 transition-all duration-300 hover:opacity-80 active:scale-95 group"
          >
            <img
              src="/logo.svg"
              alt="CultureSwap Logo"
              className="h-[40px] w-[140px] sm:h-[45px] sm:w-[165px] object-contain transition-transform duration-300 group-hover:scale-105 max-w-full"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn &&
              navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Messages Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <MessageCircle className="h-5 w-5" />
                      {unreadMessages > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-terracotta text-white text-[10px] shadow-sm ring-1 ring-white">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-3 border-b border-border">
                      <h4 className="font-semibold">Messages</h4>
                    </div>
                    {loadingConvs ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Loading conversations...
                      </div>
                    ) : (
                      <>
                        {conversations.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            No conversations yet
                          </div>
                        ) : (
                          conversations.map((conv) => {
                            const profile =
                              conversationProfiles[conv.otherUserId];
                            const isUnread =
                              conv.lastMessage?.receiver_id ===
                                currentUser?.id && !conv.lastMessage?.read;
                            const isAssistant =
                              profile?.full_name
                                ?.toLowerCase()
                                .includes("assistant") ||
                              profile?.email === "assistant@cultureswap.app";

                            return (
                              <DropdownMenuItem
                                key={conv.id}
                                className={`p-3 cursor-pointer hover:bg-muted ${isAssistant ? "bg-blue-50/50" : ""}`}
                                onClick={async () => {
                                  // Mark conversation as read if it's unread
                                  if (isUnread && conv.id) {
                                    try {
                                      await markConversationAsRead(conv.id);
                                    } catch (error) {
                                      console.error(
                                        "Error marking conversation as read:",
                                        error,
                                      );
                                    }
                                  }
                                  navigate(
                                    `/messages?user=${conv.otherUserId}`,
                                  );
                                }}
                              >
                                <div className="flex items-start gap-3 w-full">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={getCacheBustedImageUrl(
                                        profile?.profile_image_url,
                                      )}
                                      alt="User"
                                      className={`h-10 w-10 rounded-full object-cover shadow-sm ${isAssistant ? "ring-2 ring-blue-400 bg-blue-100" : ""}`}
                                    />
                                    {isAssistant && (
                                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white flex items-center justify-center">
                                        <span className="text-white text-[8px] font-bold">
                                          ✨
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p
                                        className={`font-medium text-sm truncate ${isUnread ? "font-bold" : ""} ${isAssistant ? "text-blue-700" : ""}`}
                                      >
                                        {isAssistant && "🤖 "}
                                        {profile?.full_name || "User"}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                                        {new Date(
                                          conv.lastMessage?.created_at,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {isUnread && (
                                        <div className="h-2 w-2 rounded-full bg-terracotta flex-shrink-0" />
                                      )}
                                      <p
                                        className={`text-xs truncate ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                                      >
                                        {conv.lastMessage?.content ||
                                          "No messages yet"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            );
                          })
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Button
                            variant="ghost"
                            className="w-full text-center text-sm font-bold text-terracotta hover:text-terracotta-dark hover:bg-terracotta/10 px-0 py-2 cursor-pointer h-auto transition-colors"
                            onClick={() => navigate("/messages")}
                          >
                            View All Messages
                          </Button>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-terracotta text-white text-xs">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-3 border-b border-border">
                      <h4 className="font-semibold">Notifications</h4>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => {
                        const senderProfile =
                          senderProfiles[notification.sender_id];
                        return (
                          <DropdownMenuItem
                            key={notification.id}
                            className={`p-3 cursor-pointer hover:bg-muted ${!notification.read ? "bg-terracotta/5" : ""}`}
                            onClick={() => {
                              notificationService.markAsRead(notification.id);
                              setUnreadCount((prev) => Math.max(0, prev - 1));
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notification.id
                                    ? { ...n, read: true }
                                    : n,
                                ),
                              );
                              // Navigate to the appropriate location based on notification data
                              const notifData = notification.data || {};
                              if (notifData.conversation_id) {
                                // For offers and messages with conversation context
                                navigate(
                                  `/messages?user=${notification.sender_id}`,
                                );
                              } else if (notifData.swap_id) {
                                // For swap-related notifications
                                navigate(`/swap/${notifData.swap_id}`);
                              } else if (notification.sender_id) {
                                // Fallback to sender's chat
                                navigate(
                                  `/messages?user=${notification.sender_id}`,
                                );
                              } else {
                                // Fallback to notifications page
                                navigate("/notifications");
                              }
                            }}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={getCacheBustedImageUrl(
                                    senderProfile?.profile_image_url,
                                  )}
                                  alt="Sender"
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                                {/* Notification type icon */}
                                {notification.type === "new_offer" && (
                                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-terracotta border-2 border-white flex items-center justify-center">
                                    <Handshake className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                                {notification.type === "offer_accepted" && (
                                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                    <CheckCircle className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                                {!notification.read &&
                                  !["new_offer", "offer_accepted"].includes(
                                    notification.type,
                                  ) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-terracotta border-2 border-white" />
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {senderProfile?.full_name || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {notification.body}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                    {notifications.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Button
                            variant="ghost"
                            className="w-full text-center text-sm font-bold text-terracotta hover:text-terracotta-dark hover:bg-terracotta/10 px-0 py-2 cursor-pointer h-auto transition-colors"
                            onClick={() => navigate("/notifications")}
                          >
                            View All Notifications
                          </Button>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 pl-2 pr-3">
                      <div className="relative">
                        <img
                          key={userImageUrl}
                          src={userImageUrl}
                          alt={userName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <StatusDot displayStatus="online" size="sm" />
                      </div>
                      <span className="text-sm font-medium">{userName}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="gap-2">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="gap-2 text-destructive cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login/Signup buttons shown when user is not logged in */}
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="terracotta" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="relative">
                <Menu className="h-6 w-6" />
                {(unreadMessages > 0 || unreadCount > 0) && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-terracotta"></span>
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 mt-6">
                {isLoggedIn && (
                  <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <div>
                      <p className="font-semibold">{userName}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {isLoggedIn && (
                    <>
                      <Link
                        to="/messages"
                        onClick={() => setIsOpen(false)}
                        className={`px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center justify-between ${
                          isActive("/messages")
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5" />
                          <span>Messages</span>
                        </div>
                        {unreadMessages > 0 && (
                          <Badge className="bg-terracotta text-white rounded-full px-2 py-0.5 text-[10px]">
                            {unreadMessages > 9 ? "9+" : unreadMessages}
                          </Badge>
                        )}
                      </Link>

                      <Link
                        to="/notifications"
                        onClick={() => setIsOpen(false)}
                        className={`px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center justify-between ${
                          isActive("/notifications")
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5" />
                          <span>Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                          <Badge className="bg-terracotta text-white rounded-full px-2 py-0.5 text-[10px]">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </>
                  )}

                  {isLoggedIn &&
                    navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          isActive(link.href)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-border">
                  {isLoggedIn ? (
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/profile" onClick={() => setIsOpen(false)}>
                          My Profile
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-destructive"
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                      >
                        Log Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          Log In
                        </Link>
                      </Button>
                      <Button variant="terracotta" asChild className="w-full">
                        <Link to="/signup" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
