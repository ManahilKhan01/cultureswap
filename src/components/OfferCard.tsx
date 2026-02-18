import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  Handshake,
  MapPin,
  Monitor,
  Undo2,
} from "lucide-react";
import { offerService, Offer } from "@/lib/offerService";
import { useToast } from "@/hooks/use-toast";

interface OfferCardProps {
  offer?: Offer;
  offerId?: string;
  currentUserId: string;
  onOfferUpdated?: () => void;
  refreshTrigger?: number;
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

export const OfferCard = ({
  offer: initialOffer,
  offerId,
  currentUserId,
  onOfferUpdated,
  refreshTrigger = 0,
}: OfferCardProps) => {
  const { toast } = useToast();
  const [offer, setOffer] = useState<Offer | null>(initialOffer || null);
  const [loading, setLoading] = useState(!initialOffer && !!offerId);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch offer on mount or when refreshTrigger changes
  useEffect(() => {
    if (offerId) {
      const fetchOffer = async () => {
        try {
          // Only show loading on first fetch if no data
          if (!offer) setLoading(true);

          const data = await offerService.getOfferById(offerId);

          setOffer((prev) => {
            // Only update if data actually changed to avoid re-renders/flicker
            if (
              !prev ||
              prev.status !== data.status ||
              prev.updated_at !== data.updated_at
            ) {
              return data;
            }
            return prev;
          });
        } catch (error) {
          console.error("Error fetching offer:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchOffer();
    }
  }, [offerId, refreshTrigger]); // Respond to refreshTrigger

  // Subscribe to real-time offer status updates
  useEffect(() => {
    const offerIdToWatch = offer?.id || offerId;
    if (!offerIdToWatch) return;

    const subscription = offerService.subscribeToOfferById(
      offerIdToWatch,
      (payload) => {
        if (payload.new && payload.new.id === offerIdToWatch) {
          setOffer(payload.new as Offer);
          onOfferUpdated?.();
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [offer?.id, offerId, onOfferUpdated]);

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
  const isSender = offer.sender_id === currentUserId;
  const isPending = offer.status === "pending";
  const canRespond = isReceiver && isPending;
  const canWithdraw = isSender && isPending;

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

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      await offerService.withdrawOffer(offer.id);
      toast({
        title: "Offer Withdrawn",
        description: "Your offer has been withdrawn.",
      });
      onOfferUpdated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw offer",
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = () => {
    switch (offer.status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-white/80 text-neutral-600 border-neutral-300 animate-pulse"
          >
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="bg-white/80 text-green-600 border-green-500/50"
          >
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 border-red-500/30"
          >
            Declined
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={`overflow-hidden border-2 transition-all duration-300 max-w-sm shadow-lg ${
        isPending
          ? "border-terracotta/40 bg-white/80 backdrop-blur-md"
          : "border-neutral-200 bg-neutral-50/50"
      }`}
    >
      <div className="bg-terracotta text-white px-4 py-2 flex items-center">
        <span className="text-xs font-bold font-display">swap offer</span>
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
                  <Badge
                    variant="secondary"
                    className="bg-teal/10 text-teal-dark border-teal/20 text-[10px] h-5"
                  >
                    Teacher
                  </Badge>
                  <span className="text-sm font-medium">
                    {offer.skill_offered}
                  </span>
                </div>
              )}
              {offer.skill_wanted && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-terracotta/10 text-terracotta-dark border-terracotta/20 text-[10px] h-5"
                  >
                    Learner
                  </Badge>
                  <span className="text-sm font-medium">
                    {offer.skill_wanted}
                  </span>
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
              <span className="text-[10px] font-bold">schedule</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {offer.session_days?.map((day) => (
                <span
                  key={day}
                  className="text-[11px] font-medium bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground"
                >
                  {DAY_LABELS[day] || day}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {offer.format === "in-person" ? (
                <MapPin className="h-3.5 w-3.5" />
              ) : (
                <Monitor className="h-3.5 w-3.5" />
              )}
              <span className="text-[10px] font-bold">format</span>
            </div>
            <p className="text-sm font-semibold capitalize">
              {offer.format || "Online"}
            </p>
          </div>
        </div>

        {offer.format === "in-person" && offer.address && (
          <div className="flex items-start gap-2 bg-terracotta/5 rounded-lg p-2.5 border border-terracotta/15">
            <MapPin className="h-3.5 w-3.5 text-terracotta mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-foreground/80">
                Location:{" "}
              </span>
              <span className="text-muted-foreground">{offer.address}</span>
            </div>
          </div>
        )}

        {(offer.schedule || offer.notes) && (
          <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
            {offer.schedule && (
              <div className="flex gap-2 mb-2">
                <Info className="h-4 w-4 text-terracotta/60 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground/80">
                    Preferred Time:{" "}
                  </span>
                  <span className="text-muted-foreground">
                    {offer.schedule}
                  </span>
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

        {/* Status footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            {offer.status === "pending" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-[11px] text-amber-600 font-semibold uppercase tracking-wide">
                  Pending
                </span>
              </>
            )}
            {offer.status === "accepted" && (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[11px] text-green-600 font-semibold uppercase tracking-wide">
                  Accepted
                </span>
              </>
            )}
            {offer.status === "rejected" && (
              <>
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] text-red-500 font-semibold uppercase tracking-wide">
                  Declined
                </span>
              </>
            )}
          </div>
          {canWithdraw && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50 gap-1.5"
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Undo2 className="h-3 w-3" />
              )}
              Withdraw
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferCard;
