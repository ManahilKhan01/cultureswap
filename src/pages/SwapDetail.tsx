import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Star, MessageCircle, Video, ArrowLeftRight, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { mockSwaps, mockUsers } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { swapService } from "@/lib/swapService";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";

const SwapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Try to find in mock first, then database
  const mockSwap = mockSwaps.find(s => s.id === id);
  const [swap, setSwap] = useState<any>(mockSwap || null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(!mockSwap);
  const [rating, setRating] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        const swapData = await swapService.getSwapById(id!);

        if (swapData) {
          setSwap(swapData);

          // Check if current user is the creator
          if (user && swapData.user_id === user.id) {
            setIsCreator(true);
          }

          // Load partner profile
          const profile = await profileService.getProfile(swapData.user_id);
          if (profile) {
            const avgRating = await reviewService.getAverageRating(swapData.user_id);
            setRating(avgRating);
            setPartner({
              id: swapData.user_id,
              name: profile.full_name || "User",
              avatar: profile.profile_image_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
              location: profile.city || "Location",
              country: profile.country || "Country",
              rating: avgRating,
            });
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

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={true} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-terracotta mx-auto mb-4" />
            <p className="text-muted-foreground">Loading swap details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!swap) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={true} />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Swap Not Found</h1>
          <Button asChild><Link to="/swaps">Back to Swaps</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-teal/20 text-teal border-teal/30">Active</Badge>;
      case "pending": return <Badge className="bg-golden/20 text-golden border-golden/30">Pending</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Completed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const progressPercent = swap.totalSessions ? (swap.completedSessions! / swap.totalSessions) * 100 : 0;

  const handleScheduleSession = () => {
    if (!sessionDate || !sessionTime) {
      toast({ title: "Please select date and time", variant: "destructive" });
      return;
    }
    toast({ title: "Session Scheduled", description: `Your session is scheduled for ${sessionDate} at ${sessionTime}` });
    setScheduleOpen(false);
    setSessionDate("");
    setSessionTime("");
  };

  const handleLeaveReview = async () => {
    if (!reviewText.trim()) {
      toast({ title: "Please write a review", variant: "destructive" });
      return;
    }

    if (!partner) {
      toast({ title: "Partner not found", variant: "destructive" });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
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
      window.dispatchEvent(new CustomEvent('ratingUpdated', {
        detail: { userId: partner.id, rating: rating }
      }));

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!"
      });
      setReviewOpen(false);
      setReviewText("");
      setReviewRating(5);
    } catch (err: any) {
      console.error("Review submission error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit review",
        variant: "destructive"
      });
    }
  };

  const handleCancelSwap = async () => {
    try {
      await swapService.cancelSwap(swap.id);
      toast({ title: "Swap Cancelled", description: "The swap has been cancelled successfully." });
      setCancelOpen(false);
      navigate("/swaps");
    } catch (error: any) {
      console.error("Error cancelling swap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel swap",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/swaps"><ArrowLeft className="h-4 w-4 mr-2" />Back to Swaps</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-2xl mb-2">{swap.title}</CardTitle>
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
                    <p className="text-sm text-muted-foreground mb-1">You Teach</p>
                    <p className="font-semibold text-lg text-terracotta">{swap.skillOffered || swap.skill_offered}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background shadow-md">
                    <ArrowLeftRight className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm text-muted-foreground mb-1">You Learn</p>
                    <p className="font-semibold text-lg text-teal">{swap.skillWanted || swap.skill_wanted}</p>
                  </div>
                </div>

                {(swap.status === "active" || swap.status === "open") && swap.totalSessions && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">{swap.completedSessions}/{swap.totalSessions} sessions</span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                  </div>
                )}

                {swap.status === "completed" && swap.rating && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Your Rating:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < swap.rating! ? "text-golden fill-golden" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule & Details</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-terracotta" />
                  <div>
                    <p className="text-sm text-muted-foreground">Schedule</p>
                    <p className="font-medium">{swap.schedule || "To be determined"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-teal" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{swap.duration || swap.totalHours || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Video className="h-5 w-5 text-golden" />
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p className="font-medium capitalize">{swap.format || "online"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-navy" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="font-medium">{swap.totalHours || "N/A"} hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {partner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Swap Partner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={partner.avatar} alt={partner.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-border" />
                    <div>
                      <h3 className="font-semibold">{partner.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{partner.location}, {partner.country}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-golden text-golden" />
                        <span className="text-sm font-medium">{partner.rating}</span>
                        <span className="text-xs text-muted-foreground">({partner.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{partner.bio}</p>
                  <div className="flex gap-2">
                    {!isCreator && (
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/messages?user=${partner.id}&swap=${swap.id}`}>
                          <MessageCircle className="h-4 w-4 mr-2" />Message
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className={isCreator ? "w-full" : "flex-1"} asChild>
                      <Link to={`/user/${partner.id}`}>
                        <User className="h-4 w-4 mr-2" />Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                  <DialogTrigger asChild>
                    <Button variant="terracotta" className="w-full">Schedule Next Session</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Next Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input id="time" type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                      <Button variant="terracotta" onClick={handleScheduleSession}>Schedule</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={isCreator}>Leave Review</Button>
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
                            <button key={star} onClick={() => setReviewRating(star)}>
                              <Star className={`h-8 w-8 cursor-pointer transition-colors ${star <= reviewRating ? "fill-golden text-golden" : "text-muted hover:text-golden"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="review">Your Review</Label>
                        <Textarea id="review" rows={4} placeholder="Share your experience..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
                      <Button variant="terracotta" onClick={handleLeaveReview}>Submit Review</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {swap.status !== "completed" && (
                  <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full text-destructive">Cancel Swap</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Swap</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel this swap? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Swap</Button>
                        <Button variant="destructive" onClick={handleCancelSwap}>Cancel Swap</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SwapDetail;
