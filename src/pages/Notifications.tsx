import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Users, MessageCircle, Award, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { mockNotifications, Notification } from "@/data/mockData";

const Notifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const getIcon = (type: string) => {
    switch (type) {
      case "match": return <Users className="h-5 w-5 text-terracotta" />;
      case "message": return <MessageCircle className="h-5 w-5 text-teal" />;
      case "badge": return <Award className="h-5 w-5 text-golden" />;
      case "review": return <Star className="h-5 w-5 text-golden" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: "All notifications marked as read" });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up!"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />Mark All Read
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!notification.read ? "bg-terracotta/10" : "bg-muted"}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    {!notification.read && <Badge className="bg-terracotta text-white shrink-0">New</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{formatTime(notification.timestamp)}</p>
                </div>
                {notification.link && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={notification.link}>View</Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
