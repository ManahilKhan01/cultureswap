import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { offerService } from "@/lib/offerService";
import { swapService } from "@/lib/swapService";
import { useToast } from "@/hooks/use-toast";
import { validateSwapContent } from "@/lib/validation";

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  swapId?: string;
  receiverId: string;
  onOfferCreated?: () => void;
}

const DAYS_OF_WEEK = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

export const CreateOfferDialog = ({
  open,
  onOpenChange,
  conversationId,
  swapId,
  receiverId,
  onOfferCreated,
}: CreateOfferDialogProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [availableSwaps, setAvailableSwaps] = useState<any[]>([]);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [selectedSwapId, setSelectedSwapId] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("");

  useEffect(() => {
    if (open && receiverId) {
      fetchReceiverSwaps();
    }
  }, [open, receiverId]);

  const fetchReceiverSwaps = async () => {
    try {
      setLoadingSwaps(true);
      const swaps = await swapService.getSwapsByUser(receiverId);
      // Filter for open swaps (pending a partner)
      // We exclude 'active' swaps which already have a partner
      const activeSwaps = swaps.filter((s) => s.status === "open");
      setAvailableSwaps(activeSwaps);

      // If a specific swapId was passed (e.g. from a context where we already know the swap), select it
      if (swapId) {
        setSelectedSwapId(swapId);
      }
    } catch (error) {
      console.error("Error fetching receiver swaps:", error);
      toast({
        title: "Error",
        description: "Failed to load available swaps.",
        variant: "destructive",
      });
    } finally {
      setLoadingSwaps(false);
    }
  };

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSubmit = async () => {
    if (!selectedSwapId) {
      toast({
        title: "Error",
        description: "Please select a swap to offer on",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    const selectedSwap = availableSwaps.find((s) => s.id === selectedSwapId);
    if (!selectedSwap) {
      toast({
        title: "Error",
        description: "Selected swap not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      await offerService.createOffer({
        conversation_id: conversationId,
        swap_id: selectedSwapId,
        receiver_id: receiverId,
        title: selectedSwap.title, // Use the swap's title
        skill_offered: selectedSwap.skill_wanted, // I offer what they want
        skill_wanted: selectedSwap.skill_offered, // I want what they offer
        category: selectedSwap.category,
        format: selectedSwap.format,
        address:
          selectedSwap.format === "in-person"
            ? selectedSwap.address
            : undefined, // Assuming address exists on swap
        session_days: selectedDays,
        duration: selectedSwap.duration || "60 mins", // Default or from swap
        schedule: schedule || undefined,
        notes: notes || undefined,
        ...(expiresIn ? { expires_in_days: parseInt(expiresIn, 10) } : {}),
      } as any);

      toast({
        title: "Offer Sent!",
        description: "Your offer has been sent to the other user.",
      });

      // Reset form
      setSelectedSwapId("");
      setSelectedDays([]);
      setSchedule("");
      setNotes("");

      onOpenChange(false);
      onOfferCreated?.();
    } catch (error: any) {
      console.error("Error creating offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send offer",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Swap Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 px-6 -mx-6 pr-4">
          {/* Swap Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select a Swap Request</Label>
            {loadingSwaps ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableSwaps.length > 0 ? (
              <div className="space-y-3">
                {availableSwaps.map((swap) => (
                  <div
                    key={swap.id}
                    onClick={() => setSelectedSwapId(swap.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedSwapId === swap.id
                        ? "border-terracotta bg-terracotta/5 ring-1 ring-terracotta"
                        : "border-border hover:border-terracotta/50 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {swap.title}
                        </h4>
                        <div className="mt-1.5 flex flex-col gap-0.5">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              They want to learn
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {swap.skill_wanted}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              You will learn
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {swap.skill_offered}
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedSwapId === swap.id && (
                        <div className="h-4 w-4 rounded-full bg-terracotta flex items-center justify-center shrink-0 mt-0.5">
                          <Send className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">
                  This user has no open swap requests.
                </p>
              </div>
            )}
          </div>

          {/* Offer expiration */}
          <div className="flex items-center justify-between border-b border-border pb-4 my-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="expires-check"
                checked={!!expiresIn}
                onCheckedChange={(checked) => setExpiresIn(checked ? "1" : "")}
                disabled={submitting}
              />
              <Label
                htmlFor="expires-check"
                className="text-sm font-medium cursor-pointer"
              >
                Offer expires in
              </Label>
            </div>
            {!!expiresIn && (
              <Select
                value={expiresIn}
                onValueChange={setExpiresIn}
                disabled={submitting}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="4">4 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="6">6 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Description / Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Description{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (Max 20 words)
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Briefly describe your offer..."
              value={notes}
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/);
                if (
                  words.length <= 20 ||
                  e.target.value.length < notes.length
                ) {
                  setNotes(e.target.value);
                }
              }}
              className="resize-none"
              rows={3}
              disabled={submitting}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {
                notes
                  .trim()
                  .split(/\s+/)
                  .filter((w) => w).length
              }
              /20 words
            </p>
          </div>

          {/* Session Days */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Available Days *</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.id}
                    checked={selectedDays.includes(day.id)}
                    onCheckedChange={() => toggleDay(day.id)}
                    disabled={submitting}
                  />
                  <Label
                    htmlFor={day.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule / Time Preference */}
          <div className="space-y-2">
            <Label htmlFor="schedule">Preferred Time</Label>
            <Input
              id="schedule"
              placeholder="e.g., Evenings after 6 PM"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="terracotta"
              onClick={handleSubmit}
              disabled={submitting || !selectedSwapId}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Offer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOfferDialog;
