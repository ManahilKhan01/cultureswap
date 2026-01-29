import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Calendar, Globe, Clock, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

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
  }, [id]);

  const loading = profileLoading || reviewsLoading;

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
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/swaps"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <img
                  src={user.profile_image_url || "/download.png"}
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
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {user.bio && (
              <Card>
                <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {user.skills_offered && user.skills_offered.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Skills Offered</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {user.skills_offered.map((skill: string, idx: number) => (
                    <Badge key={idx} className="bg-terracotta/10 text-terracotta border-terracotta/30">{skill}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {user.skills_wanted && user.skills_wanted.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Skills Wanted</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {user.skills_wanted.map((skill: string, idx: number) => (
                    <Badge key={idx} className="bg-teal/10 text-teal border-teal/30">{skill}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {reviews && reviews.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Reviews</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.reviewer_name || "Anonymous"}</p>
                          <div className="flex gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < (review.rating || 0) ? "fill-golden text-golden" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
