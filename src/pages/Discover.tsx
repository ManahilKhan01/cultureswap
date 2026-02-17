import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  Star,
  ArrowRight,
  X,
  SlidersHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { skillCategories } from "@/data/mockData";
import { swapService } from "@/lib/swapService";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";
import { supabase } from "@/lib/supabase";
import { SwapCard } from "@/components/SwapCard";

interface SwapWithProfile {
  id: string;
  user_id: string;
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
  profile?: any;
  rating?: number;
}

const DiscoverSkeleton = () => (
  <div className="min-h-screen bg-background">
    <main className="container mx-auto px-4 py-8">
      {/* Skeleton Header */}
      <div className="mb-8 space-y-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse" />
      </div>

      {/* Skeleton Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-44 bg-muted rounded animate-pulse" />
          <div className="h-10 w-36 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Skeleton Results Count */}
      <div className="h-4 w-32 bg-muted rounded mb-6 animate-pulse" />

      {/* Skeleton Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-6 w-full bg-muted rounded animate-pulse" />
                <div className="h-12 w-full bg-muted rounded animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-9 w-16 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  </div>
);

const Discover = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [swaps, setSwaps] = useState<SwapWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize from URL param if present
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Load swaps from database on component mount
  useEffect(() => {
    const loadSwaps = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          profileService.getProfile(user.id).then(setUserProfile);
        }

        // 1. Fetch basic swaps FIRST (Very Fast)
        const allSwaps = await swapService.getAllSwaps();

        // Filter out current user's swaps (Show only OTHER users' swaps)
        const otherUsersSwaps = user
          ? allSwaps.filter((s) => s.user_id !== user.id)
          : allSwaps;

        setSwaps(otherUsersSwaps.map((s) => ({ ...s, rating: 0 })));
        setLoading(false); // Show cards immediately!

        // 2. Fetch profiles and ratings in background (Slower)
        const uniqueUserIds = [
          ...new Set(allSwaps.map((swap) => swap.user_id)),
        ];

        Promise.all([
          Promise.all(
            uniqueUserIds.map((userId) => profileService.getProfile(userId)),
          ),
          Promise.all(
            uniqueUserIds.map((userId) =>
              reviewService.getAverageRating(userId),
            ),
          ),
        ]).then(([profilesArray, ratingsArray]) => {
          const profiles: Record<string, any> = {};
          const ratings: Record<string, number> = {};

          uniqueUserIds.forEach((userId, index) => {
            profiles[userId] = profilesArray[index];
            ratings[userId] = ratingsArray[index];
          });

          const swapsWithRatings = allSwaps.map((swap) => ({
            ...swap,
            rating: ratings[swap.user_id] || 0,
          }));

          setProfilesMap(profiles);
          setSwaps(swapsWithRatings);
        });
      } catch (error) {
        console.error("Error loading swaps:", error);
        setLoading(false);
      }
    };

    loadSwaps();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel("discover_swaps")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "swaps" },
        () => {
          loadSwaps();
        },
      )
      .subscribe();

    // Listen for rating updates
    const handleRatingUpdate = () => {
      loadSwaps();
    };

    // Listen for profile updates to refresh user data
    const handleProfileUpdate = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const profile = await profileService.getProfile(user.id);
        setUserProfile(profile);
      }
    };

    window.addEventListener("ratingUpdated", handleRatingUpdate);
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("ratingUpdated", handleRatingUpdate);
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      supabase.removeChannel(subscription);
    };
  }, []);

  const selectCategory = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? "all" : category));
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const filteredSwaps = swaps.filter((swap) => {
    const profile = profilesMap[swap.user_id];

    // Search by location (city, country) and format (onsite, in-person, hybrid)
    const searchTerms = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      (profile?.city?.toLowerCase() || "").includes(searchTerms) ||
      (profile?.country?.toLowerCase() || "").includes(searchTerms) ||
      (swap.format?.toLowerCase() || "").includes(searchTerms) ||
      (swap.title?.toLowerCase() || "").includes(searchTerms) ||
      (swap.skill_offered?.toLowerCase() || "").includes(searchTerms) ||
      (swap.skill_wanted?.toLowerCase() || "").includes(searchTerms);

    const matchesCategory =
      selectedCategory === "all" ||
      swap.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesFormat =
      selectedFormat === "all" || swap.format === selectedFormat;

    return matchesSearch && matchesCategory && matchesFormat;
  });

  const sortedSwaps = [...filteredSwaps].sort((a, b) => {
    if (sortBy === "match") {
      // Prioritize matches from selected category if any
      if (selectedCategory !== "all") {
        const aMatches =
          a.category?.toLowerCase() === selectedCategory.toLowerCase() ? 1 : 0;
        const bMatches =
          b.category?.toLowerCase() === selectedCategory.toLowerCase() ? 1 : 0;
        if (aMatches !== bMatches) return bMatches - aMatches;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    if (sortBy === "rating") {
      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      return bRating - aRating;
    }
    if (sortBy === "recent") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return 0;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedFormat("all");
    setSortBy("match");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedFormat !== "all";

  // Pagination logic
  const totalPages = Math.ceil(sortedSwaps.length / itemsPerPage);
  const paginatedSwaps = sortedSwaps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && swaps.length === 0) return <DiscoverSkeleton />;

  return (
    <>
      <main className="w-full px-4 md:px-8 py-8">
        {/* Category Scroller (Minimalist) */}
        <div className="mb-6">
          <div className="relative group flex items-center border-b border-border/50 pb-4">
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 z-10 p-1 bg-background/80 hover:bg-muted/50 rounded-full hidden md:flex items-center justify-center transition-all bg-background"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>

            <div
              ref={scrollRef}
              className="flex items-center gap-8 overflow-x-auto scrollbar-hide px-10 w-full scroll-smooth"
            >
              <button
                onClick={() => setSelectedCategory("all")}
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "text-terracotta"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Categories
              </button>

              {skillCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.name)}
                  className={`whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? "text-terracotta"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              className="absolute right-0 z-10 p-1 bg-background/80 hover:bg-muted/50 rounded-full hidden md:flex items-center justify-center transition-all bg-background"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Discover Skills
          </h1>
          <p className="text-muted-foreground">
            Find your perfect skill exchange partner from our global community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, skill, or location"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Location Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filters */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-3">
                      <Label>Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {skillCategories.map((cat) => (
                          <Badge
                            key={cat.id}
                            variant={
                              selectedCategory === cat.name
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => selectCategory(cat.name)}
                          >
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedFormat !== "all" && (
              <Badge variant="secondary" className="gap-1 capitalize">
                {selectedFormat}
                <button onClick={() => setSelectedFormat("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-terracotta hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {paginatedSwaps.length} of {sortedSwaps.length} skill exchange
          {sortedSwaps.length !== 1 ? "s" : ""}
        </p>

        {/* Swaps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedSwaps.map((swap) => {
            const profile = profilesMap[swap.user_id];
            return (
              <Card
                key={swap.id}
                className="hover-lift overflow-hidden group border-border/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {profile ? (
                      <img
                        src={profile.profile_image_url || "/profile.svg"}
                        alt={profile.full_name || "User"}
                        className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm transition-opacity duration-300"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted animate-pulse border-2 border-white shadow-sm" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate group-hover:text-terracotta transition-colors">
                        {profile ? (
                          profile.full_name || "Anonymous"
                        ) : (
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        )}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {profile ? (
                          `${profile.city || "Location"}, ${profile.country || "Country"}`
                        ) : (
                          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-terracotta transition-colors flex items-center gap-2">
                    {swap.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                    {swap.description || "No description provided"}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">
                        Offers:
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-terracotta/10 text-terracotta border-0 hover:bg-terracotta hover:text-white transition-colors cursor-default"
                      >
                        {swap.skill_offered}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">
                        Wants:
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-teal/10 text-teal border-0 hover:bg-teal hover:text-white transition-colors cursor-default"
                      >
                        {swap.skill_wanted}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-golden text-golden" />
                        <span className="font-medium text-foreground">
                          {profile ? (
                            (swap.rating || 0).toFixed(1)
                          ) : (
                            <div className="h-4 w-8 bg-muted animate-pulse rounded" />
                          )}
                        </span>
                      </div>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="text-muted-foreground capitalize font-medium">
                        {swap.format || "online"}
                      </span>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-terracotta hover:bg-terracotta-dark text-white transition-all hover-lift active:scale-95"
                      asChild
                    >
                      <Link to={`/swap/${swap.id}?source=discover`}>
                        View
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12 pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1 hover-lift"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1 hover-lift"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedSwaps.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No swaps found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find more results
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </>
  );
};

export default Discover;
