import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { skillCategories } from "@/data/mockData";
import { Search, Filter, Clock, CheckCircle, AlertCircle, ArrowLeftRight, MessageCircle, Plus, Loader2, XCircle, Sparkles, BookOpen, Users, Zap } from "lucide-react";
import { swapService } from "@/lib/swapService";
import { profileService } from "@/lib/profileService";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Swap {
  id: string;
  user_id: string;
  partner_id?: string;
  title: string;
  description?: string;
  skill_offered: string;
  skill_wanted: string;
  category?: string;
  duration?: string;
  format?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const SwapsSkeleton = () => (
  <main className="flex-1 container mx-auto px-4 py-8 animate-pulse">
    {/* Page Header Skeleton */}
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-40 rounded-md" />
    </div>


    {/* Search and Filters Skeleton */}
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Skeleton className="h-10 flex-1 rounded-md" />
      <Skeleton className="h-10 w-full sm:w-40 rounded-md" />
    </div>

    {/* Tabs Skeleton */}
    <div className="space-y-6">
      <div className="flex gap-2 bg-muted/50 p-1 w-fit rounded-lg">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 flex-1 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </main>
);

const Swaps = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingSwapId, setCancellingSwapId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_offered: "",
    skill_wanted: "",
    category: "",
    duration: "",
    format: "online"
  });

  // Load user's swaps from database
  useEffect(() => {
    const loadSwaps = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        // Fetch all swaps where user is owner or partner
        const userSwaps = await swapService.getUserSwapsWithPartner(user.id);
        setSwaps(userSwaps);

        // Load profiles for all users involved in swaps
        const userIds = new Set<string>();
        userSwaps.forEach(swap => {
          if (swap.user_id) userIds.add(swap.user_id);
          if (swap.partner_id) userIds.add(swap.partner_id);
        });

        const profilesMap: Record<string, any> = {};
        for (const userId of userIds) {
          try {
            const profile = await profileService.getProfile(userId);
            profilesMap[userId] = profile;
          } catch (e) {
            console.error(`Failed to load profile for ${userId}:`, e);
          }
        }
        setProfiles(profilesMap);

      } catch (error) {
        console.error('Error loading swaps:', error);
        toast({
          title: "Error",
          description: "Failed to load swaps",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSwaps();

    // Subscribe to real-time updates
    let subscription: any;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        subscription = swapService.subscribeToUserSwaps(user.id, () => {
          loadSwaps(); // Reload on any change
        });
      }
    });

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [toast]);

  // Listen for profile updates to refresh user profiles
  useEffect(() => {
    const handleProfileUpdate = async () => {
      // Reload all profiles
      const userIds = new Set<string>();
      swaps.forEach(swap => {
        if (swap.user_id) userIds.add(swap.user_id);
        if (swap.partner_id) userIds.add(swap.partner_id);
      });

      const updatedProfiles: Record<string, any> = {};
      for (const userId of userIds) {
        try {
          const profile = await profileService.getProfile(userId);
          updatedProfiles[userId] = profile;
        } catch (e) {
          console.error(`Failed to load profile for ${userId}:`, e);
        }
      }
      setProfiles(prev => ({ ...prev, ...updatedProfiles }));
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [swaps]);

  // Filter swaps based on search
  const filteredSwaps = swaps.filter((swap) => {
    const matchesSearch =
      (swap.skill_offered?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (swap.skill_wanted?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (swap.title?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group swaps by status
  const activeSwaps = filteredSwaps.filter(s => s.status === "active");
  const openSwaps = filteredSwaps.filter(s => s.status === "open"); // NEW: Open only
  const completedSwaps = filteredSwaps.filter(s => s.status === "completed");
  const cancelledSwaps = filteredSwaps.filter(s => s.status === "cancelled");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-teal/20 text-teal border-teal/30">Active</Badge>;
      case "open":
        return <Badge className="bg-golden/20 text-golden border-golden/30">Open</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOtherUser = (swap: Swap) => {
    if (!currentUser) return null;
    const otherUserId = swap.user_id === currentUser.id ? swap.partner_id : swap.user_id;
    return otherUserId ? profiles[otherUserId] : null;
  };

  const handleCreateSwap = async () => {
    if (!formData.title.trim() || !formData.skill_offered.trim() || !formData.skill_wanted.trim()) {
      toast({
        title: "Error",
        description: "Please fill in Title, Skill Offered, and Skill Wanted",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a swap",
          variant: "destructive"
        });
        return;
      }

      const newSwap = await swapService.createSwap(user.id, formData);

      if (newSwap) {
        setSwaps([newSwap, ...swaps]);
      }

      toast({
        title: "Success!",
        description: "Your skill swap has been created!"
      });

      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        skill_offered: "",
        skill_wanted: "",
        category: "",
        duration: "",
        format: "online"
      });
    } catch (error: any) {
      console.error("Error creating swap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create swap",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSwap = async (swapId: string) => {
    try {
      setCancellingSwapId(swapId);
      await swapService.cancelSwap(swapId);

      // Update local state
      setSwaps(swaps.map(s =>
        s.id === swapId ? { ...s, status: 'cancelled' } : s
      ));

      toast({
        title: "Swap Cancelled",
        description: "The swap has been cancelled successfully."
      });
    } catch (error: any) {
      console.error("Error cancelling swap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel swap",
        variant: "destructive"
      });
    } finally {
      setCancellingSwapId(null);
    }
  };

  const SwapCard = ({ swap }: { swap: Swap }) => {
    const otherUser = getOtherUser(swap);
    const isOwner = currentUser && swap.user_id === currentUser.id;
    const hasPartner = !!swap.partner_id;

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {hasPartner && otherUser ? (
                <>
                  <img
                    src={otherUser.profile_image_url || "/profile.svg"}
                    alt={otherUser.full_name || "Partner"}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{otherUser.full_name || "Partner"}</h3>
                    <p className="text-sm text-muted-foreground">{otherUser.city || "Location"}, {otherUser.country || "Country"}</p>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="font-semibold text-foreground">{swap.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? "Your swap - waiting for partner" : "No partner yet"}
                  </p>
                </div>
              )}
            </div>
            {getStatusBadge(swap.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skill Exchange */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">{isOwner ? "You Teach" : "You Learn"}</p>
              <p className="font-medium text-terracotta">{swap.skill_offered}</p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">{isOwner ? "You Learn" : "You Teach"}</p>
              <p className="font-medium text-teal">{swap.skill_wanted}</p>
            </div>
          </div>

          {/* Swap Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {swap.duration && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{swap.duration}</span>
              </div>
            )}
            {swap.format && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="capitalize">{swap.format}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {hasPartner && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to={`/messages?user=${otherUser?.id || swap.partner_id}&swap=${swap.id}`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Link>
              </Button>
            )}
            <Button variant="terracotta" size="sm" className="flex-1" asChild>
              <Link to={`/swap/${swap.id}`}>
                View Details
              </Link>
            </Button>

            {/* Cancel Swap Button - only for active swaps */}
            {(swap.status === "active" || swap.status === "open") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={cancellingSwapId === swap.id}
                  >
                    {cancellingSwapId === swap.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Swap?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this swap? This action cannot be undone.
                      {hasPartner && " The other participant will be notified."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Swap</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelSwap(swap.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Cancel Swap
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) return <SwapsSkeleton />;

  return (
    <>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              My Swaps
            </h1>
            <p className="text-muted-foreground">
              Manage and track all your skill exchange sessions
            </p>
          </div>

          <Button
            variant="terracotta"
            className="gap-2 font-semibold"
            onClick={() => navigate("/swap/create")}
          >
            <Plus className="h-4 w-4" />
            Create New Swap
          </Button>
        </div>



        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto">
            <TabsTrigger value="my_swaps" className="gap-2">
              <BookOpen className="h-4 w-4" />
              My Swaps ({openSwaps.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Clock className="h-4 w-4" />
              Active ({activeSwaps.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({completedSwaps.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Cancelled ({cancelledSwaps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my_swaps">
            {openSwaps.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openSwaps.map((swap) => (
                  <SwapCard key={swap.id} swap={swap} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Open Swaps</h3>
                <p className="text-muted-foreground mb-4">
                  Open swaps are those waiting for a partner.
                </p>
                <Button variant="terracotta" asChild>
                  <Link to="/swap/create">Create New Swap</Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeSwaps.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeSwaps.map((swap) => (
                  <SwapCard key={swap.id} swap={swap} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Active Swaps</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first skill swap or discover skills to begin!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="terracotta" asChild>
                    <Link to="/swap/create">Add Skill</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/discover">Discover Skills</Link>
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedSwaps.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedSwaps.map((swap) => (
                  <SwapCard key={swap.id} swap={swap} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Completed Swaps Yet</h3>
                <p className="text-muted-foreground">
                  Complete your active swaps to see them here.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledSwaps.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cancelledSwaps.map((swap) => (
                  <SwapCard key={swap.id} swap={swap} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Cancelled Swaps</h3>
                <p className="text-muted-foreground">
                  Your cancelled swaps will appear here.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

    </>
  );
};

export default Swaps;
