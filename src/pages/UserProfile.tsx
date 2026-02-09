import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Calendar, Globe, Clock, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";
import { swapService } from "@/lib/swapService";
import { useProfileUpdates } from "@/hooks/useProfileUpdates";
import { Skeleton } from "@/components/ui/skeleton";
import { SwapCard } from "@/components/SwapCard";

const UserProfileSkeleton = () => (
  <div className="pb-12 bg-background animate-pulse">
    <main className="container mx-auto px-4 py-8">
      <div className="h-10 w-24 bg-muted rounded mb-6" />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
              <Skeleton className="h-5 w-40 mx-auto" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><Skeleton className="h-6 w-20" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[75%]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  </div>
);

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [latestSwaps, setLatestSwaps] = useState<any[]>([]);
  const [swapsLoading, setSwapsLoading] = useState(true);

  // Use real-time profile updates hook
  const { profile: user, isLoading: profileLoading } = useProfileUpdates(id || null);

  // Load reviews separately
  useEffect(() => {
    const loadReviews = async () => {
      try {
        if (!id) {
          setReviewsLoading(false);
          return;
        }

        const userReviews = await reviewService.getReviewsForUser(id);
        const avgRating = await reviewService.getAverageRating(id);

        setReviews(userReviews || []);
        setRating(avgRating || 0);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();

    const loadLatestSwaps = async () => {
      try {
        if (!id) return;
        setSwapsLoading(true);
        const userSwaps = await swapService.getSwapsByUser(id);
        setLatestSwaps(userSwaps.slice(0, 3));
      } catch (error) {
        console.error("Error loading swaps:", error);
      } finally {
        setSwapsLoading(false);
      }
    };

    loadLatestSwaps();
  }, [id]);

  const loading = profileLoading || reviewsLoading || swapsLoading;

  if (loading) return <UserProfileSkeleton />;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">User Not Found</h1>
        <Button asChild><Link to="/swaps">Back to Swaps</Link></Button>
      </div>
    );
  }

  return (
    <div className="pb-12 bg-background">
      <main className="container mx-auto px-4 py-8">

        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Profile Card & Details */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <img
                  src={user.profile_image_url || "/profile.svg"}
                  alt={user.full_name || "User"}
                  className="h-32 w-32 rounded-full object-cover mx-auto ring-4 ring-terracotta/20"
                />
                <h1 className="font-display text-2xl font-bold mt-4">{user.full_name || "User"}</h1>
                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />{user.city || "Location"}, {user.country || "Country"}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="h-5 w-5 fill-golden text-golden" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
                <Button variant="terracotta" className="w-full mt-4" asChild>
                  <Link to={`/messages?user=${user.id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />Send Message
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{user.languages?.join(', ') || 'Not specified'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">User Reviews Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {reviews.length > 0 ? (
                  reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{review.reviewer_name || "User"}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? 'fill-golden text-golden' : 'text-muted'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">"{review.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No reviews yet</p>
                )}
                {reviews.length > 3 && (
                  <p className="text-[10px] text-center text-muted-foreground pt-2 border-t border-border/50">
                    + {reviews.length - 3} more reviews
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {user.bio && (
              <Card>
                <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Latest Swaps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-terracotta" />
                Latest Swaps
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestSwaps.length > 0 ? (
                  latestSwaps.slice(0, 3).map((swap) => (
                    <div key={swap.id} className="h-full">
                      <SwapCard swap={swap} showProfile={false} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center bg-muted/30 rounded-lg border border-dashed">
                    <p className="text-muted-foreground italic">No swaps created yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
