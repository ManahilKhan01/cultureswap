import { Link } from "react-router-dom";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SwapProfile {
    full_name?: string;
    profile_image_url?: string;
    city?: string;
    country?: string;
}

interface Swap {
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
    profile?: SwapProfile;
    rating?: number;
}

interface SwapCardProps {
    swap: Swap;
    profile?: SwapProfile;
    showProfile?: boolean;
}

export const SwapCard = ({ swap, profile: propProfile, showProfile = true }: SwapCardProps) => {
    const profile = propProfile || swap.profile;

    return (
        <Card className="hover-lift overflow-hidden group border-border/50 h-full flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
                {showProfile && (
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
                                {profile ? (profile.full_name || "Anonymous") : <div className="h-4 w-24 bg-muted animate-pulse rounded" />}
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
                )}

                <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-terracotta transition-colors flex items-center gap-2">
                    {swap.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
                    {swap.description || "No description provided"}
                </p>

                <div className="space-y-3 mb-4 mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Offers:</span>
                        <Badge variant="secondary" className="bg-terracotta/10 text-terracotta border-0 hover:bg-terracotta hover:text-white transition-colors cursor-default">
                            {swap.skill_offered}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Wants:</span>
                        <Badge variant="secondary" className="bg-teal/10 text-teal border-0 hover:bg-teal hover:text-white transition-colors cursor-default">
                            {swap.skill_wanted}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-golden text-golden" />
                            <span className="font-medium text-foreground">
                                {profile ? (swap.rating || 0).toFixed(1) : (swap.rating !== undefined ? swap.rating.toFixed(1) : "0.0")}
                            </span>
                        </div>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-muted-foreground capitalize font-medium">{swap.format || "online"}</span>
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
};
