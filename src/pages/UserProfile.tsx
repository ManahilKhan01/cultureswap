import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Globe,
  Clock,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";
import { swapService } from "@/lib/swapService";
import {
  presenceService,
  getStatusLabel,
  type UserStatus,
} from "@/lib/presenceService";
import { StatusDot } from "@/components/StatusDot";
import { useProfileUpdates } from "@/hooks/useProfileUpdates";
import { Skeleton } from "@/components/ui/skeleton";

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
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
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
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [latestSwaps, setLatestSwaps] = useState<any[]>([]);
  const [swapsLoading, setSwapsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>("offline");

  // Use real-time profile updates hook
  const { profile: user, isLoading: profileLoading } = useProfileUpdates(
    id || null,
  );

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

    // Fetch presence
    if (id) {
      presenceService.getUserPresence(id).then((p) => setUserStatus(p.status));
    }
  }, [id]);

  const loading = profileLoading || reviewsLoading || swapsLoading;

  if (loading) return <UserProfileSkeleton />;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">User Not Found</h1>
        <Button asChild>
          <Link to="/swaps">Back to Swaps</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-12 bg-background">
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/swaps">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="relative inline-block">
                  <img
                    src={user.profile_image_url || "/profile.svg"}
                    alt={user.full_name || "User"}
                    className="h-32 w-32 rounded-full object-cover mx-auto ring-4 ring-terracotta/20"
                  />
                  <StatusDot
                    displayStatus={userStatus}
                    size="lg"
                    className="bottom-1 right-1"
                  />
                </div>
                <h1 className="font-display text-2xl font-bold mt-4">
                  {user.full_name || "User"}
                </h1>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span
                    className={`h-2 w-2 rounded-full ${userStatus === "online" ? "bg-green-500" : userStatus === "busy" ? "bg-red-500" : "bg-gray-400"}`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {getStatusLabel(userStatus)}
                  </span>
                </div>
                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {user.city || "Location"}, {user.country || "Country"}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="h-5 w-5 fill-golden text-golden" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({reviews.length} reviews)
                  </span>
                </div>
                <Button variant="terracotta" className="w-full mt-4" asChild>
                  <Link to={`/messages?user=${user.id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined{" "}
                    {new Date(user.created_at || Date.now()).toLocaleDateString(
                      "en-US",
                      { month: "long", year: "numeric" },
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{user.languages?.join(", ") || "Not specified"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content (Middle Column) */}
          <div className="lg:col-span-1 space-y-6">
            {user.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {user.skills_offered && user.skills_offered.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills Offered</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {user.skills_offered.map((skill: string, idx: number) => (
                    <Badge
                      key={idx}
                      className="bg-terracotta/10 text-terracotta border-terracotta/30"
                    >
                      {skill}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {user.skills_wanted && user.skills_wanted.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills Wanted</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {user.skills_wanted.map((skill: string, idx: number) => (
                    <Badge
                      key={idx}
                      className="bg-teal/10 text-teal border-teal/30"
                    >
                      {skill}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel: Public View Additions */}
          <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Latest Swaps
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {latestSwaps.length > 0 ? (
                  latestSwaps.map((swap) => (
                    <div key={swap.id} className="group cursor-default">
                      <h4 className="text-sm font-semibold group-hover:text-terracotta transition-colors line-clamp-1">
                        {swap.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 h-4 border-terracotta/20 text-terracotta"
                        >
                          {swap.skill_offered}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          for
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 h-4 border-teal/20 text-teal"
                        >
                          {swap.skill_wanted}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No swaps created yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  User Reviews Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {reviews.length > 0 ? (
                  reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">
                          {review.reviewer_name || "User"}
                        </span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-2.5 w-2.5 ${i < review.rating ? "fill-golden text-golden" : "text-muted"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        "{review.comment}"
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No reviews yet
                  </p>
                )}
                {reviews.length > 3 && (
                  <p className="text-[10px] text-center text-muted-foreground pt-2 border-t border-border/50">
                    + {reviews.length - 3} more reviews
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
