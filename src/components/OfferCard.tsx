import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle, Loader2, Info, Handshake } from "lucide-react";
import { offerService, Offer } from "@/lib/offerService";
import { useToast } from "@/hooks/use-toast";

interface OfferCardProps {
    offer?: Offer;
    offerId?: string;
    currentUserId: string;
    onOfferUpdated?: () => void;
}

const DAY_LABELS: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
};

const DURATION_LABELS: Record<string, string> = {
    "30min": "30 min",
    "1hr": "1 hour",
    "1.5hr": "1.5 hours",
    "2hr": "2 hours",
    "3hr": "3 hours",
    custom: "Custom",
};

export const OfferCard = ({ offer: initialOffer, offerId, currentUserId, onOfferUpdated }: OfferCardProps) => {
    const { toast } = useToast();
    const [offer, setOffer] = useState<Offer | null>(initialOffer || null);
    const [loading, setLoading] = useState(!initialOffer && !!offerId);
    const [accepting, setAccepting] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    useEffect(() => {
        if (!offer && offerId) {
            const fetchOffer = async () => {
                try {
                    setLoading(true);
                    const data = await offerService.getOfferById(offerId);
                    setOffer(data);
                } catch (error) {
                    console.error('Error fetching offer:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchOffer();
        }
    }, [offerId, offer]);

    if (loading) {
        return (
            <Card className="max-w-sm p-8 flex items-center justify-center border-2 border-dashed border-muted">
                <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
            </Card>
        );
    }

    if (!offer) {
        return (
            <Card className="max-w-sm p-4 flex items-center gap-3 border-2 border-dashed border-muted text-muted-foreground italic">
                <Info className="h-4 w-4" />
                <span className="text-xs">Offer details unavailable</span>
            </Card>
        );
    }

    const isReceiver = offer.receiver_id === currentUserId;
    const isPending = offer.status === "pending";
    const canRespond = isReceiver && isPending;

    const handleAccept = async () => {
        try {
            setAccepting(true);
            await offerService.acceptOffer(offer.id);
            toast({
                title: "Offer Accepted!",
                description: "The swap is now active. Check your Swaps page!",
            });
            onOfferUpdated?.();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to accept offer",
                variant: "destructive",
            });
        } finally {
            setAccepting(false);
        }
    };

    const handleReject = async () => {
        try {
            setRejecting(true);
            await offerService.rejectOffer(offer.id);
            toast({
                title: "Offer Declined",
                description: "You've declined this offer.",
            });
            onOfferUpdated?.();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to reject offer",
                variant: "destructive",
            });
        } finally {
            setRejecting(false);
        }
    };

    const getStatusBadge = () => {
        switch (offer.status) {
            case "pending":
                return (
                    <Badge variant="outline" className="bg-golden/10 text-golden-dark border-golden/30 animate-pulse">
                        Pending
                    </Badge>
                );
            case "accepted":
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Accepted
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                        Declined
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <Card className={`overflow-hidden border-2 transition-all duration-300 max-w-sm shadow-lg ${isPending ? 'border-terracotta/40 bg-white/80 backdrop-blur-md' : 'border-neutral-200 bg-neutral-50/50'
            }`}>
            <div className="bg-terracotta text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Handshake className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider font-display">
                        Swap Proposal
                    </span>
                </div>
                {getStatusBadge()}
            </div>

            <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-lg leading-tight text-foreground">
                        {offer.title || "Swap Proposal"}
                    </h3>
                    {(offer.skill_offered || offer.skill_wanted) && (
                        <div className="flex flex-col gap-1.5 mt-2">
                            {offer.skill_offered && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-teal/10 text-teal-dark border-teal/20 text-[10px] h-5">Teacher</Badge>
                                    <span className="text-sm font-medium">{offer.skill_offered}</span>
                                </div>
                            )}
                            {offer.skill_wanted && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-terracotta/10 text-terracotta-dark border-terracotta/20 text-[10px] h-5">Learner</Badge>
                                    <span className="text-sm font-medium">{offer.skill_wanted}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-px bg-border/50" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase">Schedule</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {offer.session_days?.map((day) => (
                                <span key={day} className="text-[11px] font-medium bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                                    {DAY_LABELS[day] || day}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase">Duration</span>
                        </div>
                        <p className="text-sm font-semibold">
                            {DURATION_LABELS[offer.duration] || offer.duration}
                        </p>
                    </div>
                </div>

                {(offer.schedule || offer.notes) && (
                    <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                        {offer.schedule && (
                            <div className="flex gap-2 mb-2">
                                <Info className="h-4 w-4 text-terracotta/60 mt-0.5" />
                                <div className="text-xs">
                                    <span className="font-semibold text-foreground/80">Preferred Time: </span>
                                    <span className="text-muted-foreground">{offer.schedule}</span>
                                </div>
                            </div>
                        )}
                        {offer.notes && (
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                "{offer.notes}"
                            </p>
                        )}
                    </div>
                )}

                {canRespond && (
                    <div className="flex gap-2 pt-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 rounded-xl h-10 font-semibold"
                            onClick={handleReject}
                            disabled={accepting || rejecting}
                        >
                            {rejecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Decline"
                            )}
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 bg-terracotta hover:bg-terracotta-dark text-white rounded-xl h-10 font-semibold shadow-md active:scale-95 transition-transform"
                            onClick={handleAccept}
                            disabled={accepting || rejecting}
                        >
                            {accepting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Accept Offer"
                            )}
                        </Button>
                    </div>
                )}

                {!isReceiver && isPending && (
                    <div className="flex items-center justify-center gap-2 py-1">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground font-medium italic">
                            Awaiting response...
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default OfferCard;
