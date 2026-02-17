import { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Star,
  MessageCircle,
  Video,
  ArrowLeftRight,
  User,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SwapChatPanel } from "@/components/SwapChatPanel";
import { SessionManager } from "@/components/SessionManager";
import { SwapHistory } from "@/components/SwapHistory";
import { CreateOfferDialog } from "@/components/CreateOfferDialog";
import { mockSwaps, mockUsers } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { swapService } from "@/lib/swapService";
import { sessionService } from "@/lib/sessionService";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";
import { messageService } from "@/lib/messageService";
import { presenceService, type UserStatus } from "@/lib/presenceService";
import { StatusDot } from "@/components/StatusDot";
import { Skeleton } from "@/components/ui/skeleton";
import { validateReview } from "@/lib/validation";

const SwapDetailSkeleton = () => (
  <div className="flex-1 bg-background pb-12 animate-pulse">
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-32 mb-6" />

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="space-y-4">
              <Skeleton className="h-8 w-[60%]" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-md" />
                  <Skeleton className="h-10 flex-1 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  </div>
);

const SwapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source"); // 'discover' if coming from Discover, null otherwise

  // Try to find in mock first, then database
  const mockSwap = mockSwaps.find((s) => s.id === id);
  const [swap, setSwap] = useState<any>(mockSwap || null);
  const [partner, setPartner] = useState<any>(null);
  const [swapCreator, setSwapCreator] = useState<any>(null);
  const [loading, setLoading] = useState(!mockSwap);
  const [rating, setRating] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [fetchingSessions, setFetchingSessions] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<UserStatus>("offline");
  const [creatorStatus, setCreatorStatus] = useState<UserStatus>("offline");

  const loadRating = async (userId: string) => {
    try {
      const avgRating = await reviewService.getAverageRating(userId);
      setRating(avgRating);
      if (partner) {
        setPartner((prev: any) => ({ ...prev, rating: avgRating }));
      }
    } catch (error) {
      console.error("Error loading rating:", error);
    }
  };

  useEffect(() => {
    if (mockSwap) {
      if (mockSwap.participantId) {
        loadRating(mockSwap.participantId);
      }
      return;
    }

    const loadSwap = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        const swapData = await swapService.getSwapById(id!);

        if (swapData) {
          setSwap(swapData);

          // Check if current user is involved in the swap
          if (user) {
            const isOwner = swapData.user_id === user.id;
            setIsCreator(isOwner);

            // If viewing from Discover, load the swap creator's info
            if (source === "discover") {
              const creatorProfile = await profileService.getProfile(
                swapData.user_id,
              );
              if (creatorProfile) {
                const creatorRating = await reviewService.getAverageRating(
                  swapData.user_id,
                );
                setSwapCreator({
                  id: swapData.user_id,
                  name: creatorProfile.full_name || "User",
                  avatar: creatorProfile.profile_image_url || "/profile.svg",
                  location: creatorProfile.city || "Location",
                  country: creatorProfile.country || "Country",
                  rating: creatorRating,
                });

                // Fetch creator presence
                presenceService
                  .getUserPresence(swapData.user_id)
                  .then((p) => setCreatorStatus(p.status));
              }
            }

            // Correctly identify the partner ID
            // If I am the owner, the partner is partner_id
            // If I am the partner, the partner is user_id
            const partnerId = isOwner ? swapData.partner_id : swapData.user_id;

            if (partnerId) {
              // Load partner profile
              const profile = await profileService.getProfile(partnerId);
              if (profile) {
                const avgRating =
                  await reviewService.getAverageRating(partnerId);
                setRating(avgRating);
                setPartner({
                  id: partnerId,
                  name: profile.full_name || "User",
                  avatar: profile.profile_image_url || "/profile.svg",
                  location: profile.city || "Location",
                  country: profile.country || "Country",
                  rating: avgRating,
                });

                // Fetch partner presence
                presenceService
                  .getUserPresence(partnerId)
                  .then((p) => setPartnerStatus(p.status));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading swap:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSwap();
  }, [id, mockSwap]);

  useEffect(() => {
    if (swap?.id) {
      loadSessions();
    }
  }, [swap?.id]);

  // Listen for profile updates to refresh creator and partner info
  useEffect(() => {
    const handleProfileUpdate = async () => {
      // Refresh swap creator profile
      if (swapCreator?.id) {
        const updatedProfile = await profileService.getProfile(swapCreator.id);
        if (updatedProfile) {
          const updatedRating = await reviewService.getAverageRating(
            swapCreator.id,
          );
          setSwapCreator({
            ...swapCreator,
            name: updatedProfile.full_name || "User",
            avatar: updatedProfile.profile_image_url || "/profile.svg",
            location: updatedProfile.city || "Location",
            country: updatedProfile.country || "Country",
            rating: updatedRating,
          });
        }
      }
      // Refresh partner profile
      if (partner?.id) {
        const updatedProfile = await profileService.getProfile(partner.id);
        if (updatedProfile) {
          const updatedRating = await reviewService.getAverageRating(
            partner.id,
          );
          setPartner({
            ...partner,
            name: updatedProfile.full_name || "User",
            avatar: updatedProfile.profile_image_url || "/profile.svg",
            location: updatedProfile.city || "Location",
            country: updatedProfile.country || "Country",
            rating: updatedRating,
          });
        }
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [swapCreator?.id, partner?.id]);

  const loadSessions = async () => {
    try {
      setFetchingSessions(true);
      const data = await sessionService.getSessionsBySwap(id!);
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setFetchingSessions(false);
    }
  };

  const getNearestSession = () => {
    if (!sessions.length) return null;
    const futureSessions = sessions
      .filter(
        (s) =>
          s.status === "scheduled" && new Date(s.scheduled_at) > new Date(),
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      );

    return futureSessions.length > 0 ? futureSessions[0] : null;
  };

  const nearestSession = getNearestSession();
  const sessionCount = sessions.length;

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [showCancelReview, setShowCancelReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const reviewValidation = validateReview(reviewText);

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const validation = validateReview(newText);

    // If trying to add more content when already at word limit, block it
    // But allow if the new text is shorter (deletion)
    if (validation.wordCount > 80 && newText.length > reviewText.length) {
      return;
    }

    setReviewText(newText);
  };

  if (loading) return <SwapDetailSkeleton />;

  if (!swap) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Swap Not Found</h1>
        <Button asChild>
          <Link to="/swaps">Back to Swaps</Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-teal/20 text-teal border-teal/30">Active</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-golden/20 text-golden border-golden/30">
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const progressPercent = swap.totalSessions
    ? (swap.completedSessions! / swap.totalSessions) * 100
    : 0;

  const handleScheduleSession = async () => {
    if (!sessionDate || !sessionTime) {
      toast({ title: "Please select date and time", variant: "destructive" });
      return;
    }

    try {
      const scheduledAt = new Date(
        `${sessionDate}T${sessionTime}`,
      ).toISOString();
      await sessionService.createSession({
        swap_id: swap.id,
        scheduled_at: scheduledAt,
      });

      toast({
        title: "Session Scheduled",
        description: `Session scheduled for ${sessionDate} at ${sessionTime}. Meet link generated!`,
      });

      setScheduleOpen(false);
      setSessionDate("");
      setSessionTime("");
      loadSessions(); // This will refresh session list, count and next session
    } catch (error: any) {
      console.error("Schedule session error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule session",
        variant: "destructive",
      });
    }
  };

  const handleLeaveReview = async () => {
    if (!reviewText.trim()) {
      toast({ title: "Please write a review", variant: "destructive" });
      return;
    }

    const reviewValidation = validateReview(reviewText);
    if (!reviewValidation.isValid) {
      toast({
        title: reviewValidation.error || "Review is invalid",
        variant: "destructive",
      });
      return;
    }

    if (!partner) {
      toast({ title: "Partner not found", variant: "destructive" });
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert review into database
      const { data, error } = await supabase.from("reviews").insert([
        {
          reviewer_id: user.id,
          reviewee_id: partner.id,
          swap_id: swap.id,
          rating: reviewRating,
          comment: reviewText,
          would_recommend: true,
        },
      ]);

      if (error) throw error;

      // Refresh rating immediately
      await loadRating(partner.id);

      // Dispatch event so Discover and other pages update
      window.dispatchEvent(
        new CustomEvent("ratingUpdated", {
          detail: { userId: partner.id, rating: rating },
        }),
      );

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setReviewOpen(false);
      setReviewText("");
      setReviewRating(5);
    } catch (err: any) {
      console.error("Review submission error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleLeaveCancelReview = async () => {
    if (!reviewText.trim()) {
      toast({ title: "Please write a review", variant: "destructive" });
      return;
    }

    const reviewValidation = validateReview(reviewText);
    if (!reviewValidation.isValid) {
      toast({
        title: reviewValidation.error || "Review is invalid",
        variant: "destructive",
      });
      return;
    }

    if (!partner) {
      toast({ title: "Partner not found", variant: "destructive" });
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert review into database
      const { data, error } = await supabase.from("reviews").insert([
        {
          reviewer_id: user.id,
          reviewee_id: partner.id,
          swap_id: swap.id,
          rating: reviewRating,
          comment: reviewText,
          would_recommend: true,
        },
      ]);

      if (error) throw error;

      // Refresh rating immediately
      await loadRating(partner.id);

      // Dispatch event so Discover and other pages update
      window.dispatchEvent(
        new CustomEvent("ratingUpdated", {
          detail: { userId: partner.id, rating: rating },
        }),
      );

      toast({
        title: "Review Submitted",
        description:
          "Thank you for your feedback! Redirecting to your swaps...",
      });
      setShowCancelReview(false);
      setReviewSubmitted(true);
      setReviewText("");
      setReviewRating(5);

      // Redirect to swaps after a short delay
      setTimeout(() => navigate("/swaps"), 1500);
    } catch (err: any) {
      console.error("Review submission error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleCancelSwap = async () => {
    try {
      await swapService.cancelSwap(swap.id);
      toast({
        title: "Swap Cancelled",
        description: "Please leave a review for your swap partner.",
      });
      setCancelOpen(false);
      // Show review dialog after cancelling instead of redirecting
      setShowCancelReview(true);
    } catch (error: any) {
      console.error("Error cancelling swap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel swap",
        variant: "destructive",
      });
    }
  };

  const handleCreateOffer = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!swap.user_id) throw new Error("Swap user not found");

      // Get or create conversation with the swap creator
      const convId = await messageService.getOrCreateConversation(
        user.id,
        swap.user_id,
      );
      setConversationId(convId);

      // Open the CreateOfferDialog which will handle the full flow
      setCreateOfferOpen(true);
    } catch (error: any) {
      console.error("Error initializing offer creation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize offer",
        variant: "destructive",
      });
    }
  };

  const handleOfferCreated = async () => {
    try {
      // After offer is created, reload the swap to get updated partner info
      const updated = await swapService.getSwapById(id!);
      if (updated) {
        setSwap(updated);

        // If partner was set, load their profile
        if (updated.partner_id && updated.partner_id !== currentUserId) {
          const profile = await profileService.getProfile(updated.partner_id);
          if (profile) {
            const avgRating = await reviewService.getAverageRating(
              updated.partner_id,
            );
            setPartner({
              id: updated.partner_id,
              name: profile.full_name || "User",
              avatar: profile.profile_image_url || "/profile.svg",
              location: profile.city || "Location",
              country: profile.country || "Country",
              rating: avgRating,
            });
          }
        }
      }

      setCreateOfferOpen(false);
      toast({
        title: "Offer Created!",
        description:
          "Your offer has been sent. The other participant will see it in the chat.",
      });
    } catch (error: any) {
      console.error("Error after offer created:", error);
    }
  };

  return (
    <div className="flex-1 bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={source === 'discover' ? "/discover" : "/swaps"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {source === 'discover' ? "Back to Discover" : "Back to Swaps"}
          </Link>
        </Button>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-2xl mb-2">
                      {swap.title}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(swap.status)}
                      <Badge variant="outline">{swap.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">{swap.description}</p>

                <div className="flex items-center gap-4 p-6 rounded-xl bg-gradient-to-r from-terracotta/10 to-teal/10">
                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      You Teach
                    </p>
                    <p className="font-semibold text-lg text-terracotta">
                      {swap.skillOffered || swap.skill_offered}
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background shadow-md">
                    <ArrowLeftRight className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      You Learn
                    </p>
                    <p className="font-semibold text-lg text-teal">
                      {swap.skillWanted || swap.skill_wanted}
                    </p>
                  </div>
                </div>

                {(swap.status === "active" || swap.status === "open") &&
                  swap.totalSessions && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Progress</span>
                        <span className="text-muted-foreground">
                          {swap.completedSessions}/{swap.totalSessions} sessions
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                    </div>
                  )}

                {swap.status === "completed" && swap.rating && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Your Rating:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < swap.rating! ? "text-golden fill-golden" : "text-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Show Schedule & Details only if partner exists (deal is active) AND not viewing from Discover */}
            {partner && source !== "discover" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">Schedule & Details</CardTitle>
                  <Button
                    variant="terracotta"
                    size="sm"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-terracotta" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nearest Session
                      </p>
                      <p className="font-medium">
                        {nearestSession
                          ? `${new Date(nearestSession.scheduled_at).toLocaleDateString()} ${new Date(nearestSession.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "No upcoming sessions"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Video className="h-5 w-5 text-teal" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Number of Sessions
                      </p>
                      <p className="font-medium">{sessionCount} sessions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Video className="h-5 w-5 text-golden" />
                    <div>
                      <p className="text-sm text-muted-foreground">Format</p>
                      <p className="font-medium capitalize">
                        {swap.format || "online"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-navy" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Hours
                      </p>
                      <p className="font-medium">
                        {swap.duration || swap.total_hours || "N/A"} hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Show Swap Creator card when viewing from Discover */}
            {source === "discover" && swapCreator && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Swap Creator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={swapCreator.avatar}
                        alt={swapCreator.name}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
                      />
                      <StatusDot displayStatus={creatorStatus} size="md" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{swapCreator.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-golden text-golden" />
                        <span className="text-sm font-medium">
                          {swapCreator.rating?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {swapCreator.location}, {swapCreator.country}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link
                        to={`/messages?user=${swapCreator.id}&swap=${swap.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                    <Button variant="ghost" className="flex-1" asChild>
                      <Link to={`/user/${swapCreator.id}`}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {partner && source !== "discover" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Swap Partner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={partner.avatar}
                        alt={partner.name}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
                      />
                      <StatusDot displayStatus={partnerStatus} size="md" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{partner.name}</h3>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {partner && (
                      <Button variant="outline" className="flex-1" asChild>
                        <Link
                          to={`/messages?user=${partner.id}&swap=${swap.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className={!partner ? "w-full" : "flex-1"}
                      asChild
                    >
                      <Link to={`/user/${partner.id}`}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show Create Offer Card if viewing from Discover, no partner yet, and swap is open/pending */}
            {source === "discover" &&
              !partner &&
              swap &&
              (swap.status === "open" ||
                swap.status === "pending" ||
                !swap.partner_id) && (
                <Card className="border-green-500/30 bg-gradient-to-br from-green-50 to-green-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-700">
                      Create Offer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Interested in this skill exchange? Click below to create
                      an offer and start the swap!
                    </p>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleCreateOffer}
                    >
                      Create Offer
                    </Button>
                  </CardContent>
                </Card>
              )}

            {/* CreateOfferDialog - Using the same component as Messages */}
            {conversationId && (
              <CreateOfferDialog
                open={createOfferOpen}
                onOpenChange={setCreateOfferOpen}
                conversationId={conversationId}
                swapId={id}
                receiverId={swap.user_id}
                onOfferCreated={handleOfferCreated}
              />
            )}

            {/* Show Actions Card if partner exists AND not viewing from Discover */}
            {partner && source !== "discover" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                    <DialogTrigger asChild>
                      <Button variant="terracotta" className="w-full">
                        Schedule Next Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Next Session</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={sessionTime}
                            onChange={(e) => setSessionTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setScheduleOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="terracotta"
                          onClick={handleScheduleSession}
                        >
                          Schedule
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={isCreator}
                      >
                        Leave Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Leave a Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setReviewRating(star)}
                              >
                                <Star
                                  className={`h-8 w-8 cursor-pointer transition-colors ${star <= reviewRating ? "fill-golden text-golden" : "text-muted hover:text-golden"}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review">Your Review</Label>
                          <Textarea
                            id="review"
                            rows={4}
                            placeholder="Share your experience..."
                            value={reviewText}
                            onChange={handleReviewChange}
                            maxLength={500}
                            className={
                              !reviewValidation.isValid ||
                              reviewValidation.wordCount === 80 ||
                              reviewValidation.charCount === 500
                                ? "border-destructive focus-visible:ring-destructive"
                                : reviewValidation.wordCount > 0
                                  ? "border-green-500 focus-visible:ring-green-500"
                                  : ""
                            }
                          />
                          <div className="flex justify-between items-center text-xs mt-1">
                            {reviewValidation.error ? (
                              <p className="text-destructive font-medium">
                                {reviewValidation.error}
                              </p>
                            ) : (
                              <p className="text-muted-foreground">
                                Share your detailed experience with your
                                partner.
                              </p>
                            )}
                            <div
                              className={`font-medium ${
                                !reviewValidation.isValid ||
                                reviewValidation.wordCount === 80 ||
                                reviewValidation.charCount === 500
                                  ? "text-destructive"
                                  : reviewValidation.wordCount > 0
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              <span>
                                {reviewValidation.charCount} / 500 characters
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setReviewOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="terracotta"
                          onClick={handleLeaveReview}
                          disabled={!reviewValidation.isValid}
                        >
                          Submit Review
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Cancel Swap - Review Dialog */}
                  <Dialog
                    open={showCancelReview}
                    onOpenChange={setShowCancelReview}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Leave a Review for Your Swap Partner
                        </DialogTitle>
                        <DialogDescription>
                          Before leaving, please share your experience with{" "}
                          {partner?.name || "your partner"}. Your feedback helps
                          maintain our community quality.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setReviewRating(star)}
                              >
                                <Star
                                  className={`h-8 w-8 cursor-pointer transition-colors ${star <= reviewRating ? "fill-golden text-golden" : "text-muted hover:text-golden"}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cancelReview">Your Review</Label>
                          <Textarea
                            id="cancelReview"
                            rows={4}
                            placeholder="Share your experience..."
                            value={reviewText}
                            onChange={handleReviewChange}
                            maxLength={500}
                            className={
                              !reviewValidation.isValid ||
                              reviewValidation.wordCount === 80 ||
                              reviewValidation.charCount === 500
                                ? "border-destructive focus-visible:ring-destructive"
                                : reviewValidation.wordCount > 0
                                  ? "border-green-500 focus-visible:ring-green-500"
                                  : ""
                            }
                          />
                          <div className="flex justify-between items-center text-xs mt-1">
                            {reviewValidation.error ? (
                              <p className="text-destructive font-medium">
                                {reviewValidation.error}
                              </p>
                            ) : (
                              <p className="text-muted-foreground">
                                Share your detailed experience with your
                                partner.
                              </p>
                            )}
                            <div
                              className={`font-medium ${
                                !reviewValidation.isValid ||
                                reviewValidation.wordCount === 80 ||
                                reviewValidation.charCount === 500
                                  ? "text-destructive"
                                  : reviewValidation.wordCount > 0
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              <span>
                                {reviewValidation.charCount} / 500 characters
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCancelReview(false);
                            navigate("/swaps");
                          }}
                        >
                          Skip Review
                        </Button>
                        <Button
                          variant="terracotta"
                          onClick={handleLeaveCancelReview}
                          disabled={!reviewValidation.isValid}
                        >
                          Submit Review
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {swap.status !== "completed" && (
                    <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full text-destructive"
                        >
                          Cancel Swap
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Swap</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel this swap? This
                            action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setCancelOpen(false)}
                          >
                            Keep Swap
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleCancelSwap}
                          >
                            Cancel Swap
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Session Manager - Only show if sessions exist */}
            {(swap.status === "active" || swap.status === "open") &&
              sessions.length > 0 && (
                <SessionManager
                  swapId={swap.id}
                  sessions={sessions}
                  loading={fetchingSessions}
                />
              )}

            {/* Slide-in Chat Panel */}
            {partner && currentUserId && isChatOpen && (
              <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] z-50 bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                <SwapChatPanel
                  swapId={swap.id}
                  currentUserId={currentUserId}
                  otherUserId={partner.id}
                  otherUserName={partner.name}
                  otherUserAvatar={partner.avatar}
                  onClose={() => setIsChatOpen(false)}
                />
              </div>
            )}

            {/* Overlay for chat panel */}
            {isChatOpen && (
              <div
                className="fixed inset-0 bg-black/20 z-40 animate-in fade-in"
                onClick={() => setIsChatOpen(false)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SwapDetail;
