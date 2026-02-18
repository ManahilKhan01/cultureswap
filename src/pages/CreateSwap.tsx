import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { swapService } from "@/lib/swapService";
import { supabase } from "@/lib/supabase";
import { skillCategories } from "@/data/mockData";
import { validateSwapContent } from "@/lib/validation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Zap,
  BookOpen,
  Sparkles,
  Clock,
  Calendar,
  Globe,
  MapPin,
  Monitor,
  Eye,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RequiredLabel = () => (
  <TooltipProvider>
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span className="text-destructive ml-1 cursor-help">*</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>This field is required</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const CreateSwap = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_offered: "",
    skill_wanted: "",
    category: "",
    duration: "",
    format: "online",
    address: "",
    availability: "",
    preferences: "",
    expiration: "4", // Default to 4 days
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1: {
        const titleError = validateSwapContent(formData.title, "Title");
        if (titleError) {
          toast({ title: titleError, variant: "destructive" });
          return false;
        }

        const skillOfferedError = validateSwapContent(
          formData.skill_offered,
          "Skill Offered",
        );
        if (skillOfferedError) {
          toast({ title: skillOfferedError, variant: "destructive" });
          return false;
        }

        const skillWantedError = validateSwapContent(
          formData.skill_wanted,
          "Skill Wanted",
        );
        if (skillWantedError) {
          toast({ title: skillWantedError, variant: "destructive" });
          return false;
        }
        return true;
      }
      case 2:
        if (!formData.category) {
          toast({
            title: "Category Required",
            description: "Please select a category for your swap",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        if (!formData.duration) {
          toast({
            title: "Duration Required",
            description: "Please select a typical duration",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a swap",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Combine availability and preferences into description for now to avoid schema issues
      const finalDescription = `${formData.description}\n\nAvailability: ${formData.availability}\nPreferences: ${formData.preferences}`;

      const submitData = {
        title: formData.title,
        description: finalDescription,
        skill_offered: formData.skill_offered,
        skill_wanted: formData.skill_wanted,
        category: formData.category,
        duration: formData.duration,
        format: formData.format,
        expires_at: new Date(
          Date.now() + parseInt(formData.expiration) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      const swap = await swapService.createSwap(user.id, submitData);

      if (swap) {
        toast({
          title: "Success! 🎉",
          description: "Your skill swap has been published successfully.",
        });
        navigate("/swaps");
      }
    } catch (error: any) {
      console.error("Error creating swap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create swap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = skillCategories.map((cat) => cat.name);

  const durations = [
    "30 minutes",
    "1 hour",
    "2 hours",
    "3 hours",
    "5 hours",
    "10 hours",
    "20+ hours",
  ];

  const formatOptions = [
    { value: "online", label: "Online", icon: Monitor, color: "text-teal" },
    {
      value: "in-person",
      label: "In-Person",
      icon: MapPin,
      color: "text-terracotta",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 md:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/swaps")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Exit Builder</span>
            </button>
            {/* <div className="text-sm font-bold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              Step <span className="text-primary">{currentStep}</span> of{" "}
              {totalSteps}
            </div> */}
          </div>

          <div className="space-y-2">
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="h-2"
            />
            <div className="flex justify-between text-xs font-semibold text-muted-foreground  tracking-widest px-1 font-display">
              <span className={currentStep >= 1 ? "text-primary" : ""}>
                Define
              </span>
              <span className={currentStep >= 2 ? "text-primary" : ""}>
                Detail
              </span>
              <span className={currentStep >= 3 ? "text-primary" : ""}>
                Logistics
              </span>
              <span className={currentStep >= 4 ? "text-primary" : ""}>
                Finish
              </span>
            </div>
          </div>
        </div>

        <div>
          {/* Step 1: Define Your Swap */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                <h1 className="text-3xl font-bold font-display">
                  Define Your Swap
                </h1>
                <p className="text-muted-foreground mt-2">
                  Start with the core of your exchange. Share what you offer and
                  what you’re looking to learn.
                </p>
              </div>

              <Card className="border-2 border-warm-cream">
                <CardContent className="pt-6 space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-base font-semibold">
                      Swap Title <RequiredLabel />
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Learn Spanish while cooking Tapas"
                      value={formData.title}
                      onChange={handleChange}
                      className="h-12 text-lg border-muted hover:border-primary/30 focus:border-primary transition-all"
                    />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-terracotta">
                        Tip:
                      </span>{" "}
                      Use a catchy title that explains both skills clearly.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label
                        htmlFor="skill_offered"
                        className="text-base font-semibold"
                      >
                        I Can Teach <RequiredLabel />
                      </Label>
                      <Input
                        id="skill_offered"
                        name="skill_offered"
                        placeholder="e.g., Advanced JavaScript"
                        value={formData.skill_offered}
                        onChange={handleChange}
                        className="h-12 border-muted hover:border-teal/30 focus:border-teal"
                      />
                      <p className="text-xs text-muted-foreground">
                        The skill or cultural knowledge you're sharing.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="skill_wanted"
                        className="text-base font-semibold"
                      >
                        I Want to Learn <RequiredLabel />
                      </Label>
                      <Input
                        id="skill_wanted"
                        name="skill_wanted"
                        placeholder="e.g., Origami Art"
                        value={formData.skill_wanted}
                        onChange={handleChange}
                        className="h-12 border-muted hover:border-golden/30 focus:border-golden"
                      />
                      <p className="text-xs text-muted-foreground">
                        What you hope to gain from this exchange.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Add Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6">
                <h1 className="text-3xl font-bold font-display">
                  Add More Context
                </h1>
                <p className="text-muted-foreground mt-2">
                  Help others understand your experience level and how the swap
                  works.
                </p>
              </div>

              <Card className="border-2 border-teal/10">
                <CardContent className="pt-6 space-y-8">
                  <div className="space-y-3">
                    <Label
                      htmlFor="description"
                      className="text-base font-semibold"
                    >
                      Swap Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Briefly state your experience level, the skill or cultural knowledge you can share, and the specific skill you want to learn through this exchange.
"
                      value={formData.description}
                      onChange={handleChange}
                      rows={6}
                      maxLength={500}
                      className="text-base resize-none border-muted hover:border-primary/30"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>30–500 characters recommended (80–120 words)</span>
                      <span
                        className={
                          formData.description.length > 450
                            ? "text-destructive font-semibold"
                            : formData.description.length < 30
                              ? "text-golden"
                              : "text-teal"
                        }
                      >
                        {formData.description.length}/500 chars
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label
                        htmlFor="category"
                        className="text-base font-semibold"
                      >
                        Category <RequiredLabel />
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => handleSelectChange("category", v)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        Preferred Format <RequiredLabel />
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {formatOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              handleSelectChange("format", opt.value)
                            }
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                              formData.format === opt.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted hover:border-muted-foreground/30 bg-transparent"
                            }`}
                          >
                            <opt.icon
                              className={`h-6 w-6 mb-2 ${formData.format === opt.value ? opt.color : "text-muted-foreground"}`}
                            />
                            <span
                              className={`text-xs font-semibold uppercase tracking-wider ${formData.format === opt.value ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Address - shown only for In-Person */}
                  {formData.format === "in-person" && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label
                        htmlFor="address"
                        className="text-base font-semibold"
                      >
                        Meeting Address <RequiredLabel />
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="e.g., Central Library, 123 Main St, City"
                        value={formData.address}
                        onChange={handleChange}
                        className="h-12 border-muted hover:border-terracotta/30 focus:border-terracotta"
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide a public meeting location for safety.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Set Logistics */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6">
                <h1 className="text-3xl font-bold font-display">
                  Scheduling & Logistics
                </h1>
                <p className="text-muted-foreground mt-2">
                  When do you want to meet and for how long?
                </p>
              </div>

              <Card className="border-2 border-golden/10">
                <CardContent className="pt-6 space-y-8">
                  <div className="space-y-3">
                    <Label
                      htmlFor="duration"
                      className="text-base font-semibold"
                    >
                      Typical Session Duration <RequiredLabel />
                    </Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(v) => handleSelectChange("duration", v)}
                    >
                      <SelectTrigger className="h-12 border-muted hover:border-terracotta/30 focus:border-terracotta">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((dur) => (
                          <SelectItem key={dur} value={dur}>
                            {dur}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="expiration"
                      className="text-base font-semibold"
                    >
                      Swap Expiration <RequiredLabel />
                    </Label>
                    <Select
                      value={formData.expiration}
                      onValueChange={(v) => handleSelectChange("expiration", v)}
                    >
                      <SelectTrigger className="h-12 border-muted hover:border-terracotta/30 focus:border-terracotta">
                        <SelectValue placeholder="Select expiration limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="2">2 Days</SelectItem>
                        <SelectItem value="3">3 Days</SelectItem>
                        <SelectItem value="4">4 Days (Max)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="h-3 w-3" />
                      Swap will automatically expire and be removed after this
                      limit.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="availability"
                      className="text-base font-semibold"
                    >
                      Availability
                    </Label>
                    <Textarea
                      id="availability"
                      name="availability"
                      placeholder="e.g., Weekends from 2 PM to 6 PM UTC, or Tuesdays after 5 PM."
                      value={formData.availability}
                      onChange={handleChange}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="preferences"
                      className="text-base font-semibold"
                    >
                      Extra Preferences
                    </Label>
                    <Input
                      id="preferences"
                      name="preferences"
                      placeholder="e.g., Prefer Zoom for video, or quiet library for in-person"
                      value={formData.preferences}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Preview & Publish */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6">
                <h1 className="text-3xl font-bold font-display">
                  Preview & Publish
                </h1>
                <p className="text-muted-foreground mt-2">
                  Check everything before making your swap live to the
                  community.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="border-2 border-primary/20 overflow-hidden">
                    <div className="bg-primary/5 px-6 py-4 border-b border-primary/10">
                      <h2 className="text-2xl font-bold font-display tracking-tight text-primary-dark">
                        {formData.title || "Your Swap Title"}
                      </h2>
                    </div>
                    <CardContent className="pt-6 space-y-6">
                      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-muted">
                        <div className="flex-1 text-center">
                          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                            Teaching
                          </p>
                          <p className="font-semibold text-lg text-terracotta">
                            {formData.skill_offered || "..."}
                          </p>
                        </div>
                        <div className="h-8 w-px bg-muted" />
                        <div className="flex-1 text-center">
                          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                            Learning
                          </p>
                          <p className="font-semibold text-lg text-teal">
                            {formData.skill_wanted || "..."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                          Description
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/80">
                          {formData.description || "No description provided."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/20 p-3 rounded-lg border border-muted/50">
                          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                            Category
                          </p>
                          <p className="text-sm font-semibold">
                            {formData.category || "Not selected"}
                          </p>
                        </div>
                        <div className="bg-muted/20 p-3 rounded-lg border border-muted/50">
                          <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                            Typical Session
                          </p>
                          <p className="text-sm font-semibold">
                            {formData.duration || "Not set"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-muted bg-soft-sand/20">
                    <CardHeader className="pb-3 border-b border-muted/50">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-muted-foreground font-sans">
                        <MapPin className="h-4 w-4 text-primary" />
                        Format & Availability
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">
                          Learning Channel
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold">
                          {formData.format === "online" && (
                            <Monitor className="h-4 w-4 text-teal" />
                          )}
                          {formData.format === "in-person" && (
                            <MapPin className="h-4 w-4 text-terracotta" />
                          )}
                          {formData.format === "both" && (
                            <Globe className="h-4 w-4 text-golden" />
                          )}
                          <span className="capitalize">{formData.format}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">
                          When
                        </p>
                        <p className="text-xs font-medium italic">
                          "{formData.availability || "Flexible availability"}"
                        </p>
                      </div>

                      {formData.preferences && (
                        <div className="pt-2 border-t border-muted/50">
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">
                            Preferences
                          </p>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {formData.preferences}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="p-4 bg-terracotta/5 rounded-xl border border-terracotta/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-terracotta tracking-tight">
                          Ready to launch?
                        </p>
                        <p className="text-xs text-terracotta/70 mt-1">
                          Your swap will be visible to everyone in the Discover
                          section immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-between gap-4 border-t pt-8">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => navigate("/swaps") : prevStep}
              className="h-12 px-6 font-bold gap-2 text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              {currentStep === 1 ? (
                "Cancel"
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" /> Back
                </>
              )}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                className="h-12 px-8 font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="h-12 px-10 font-bold gap-2 bg-gradient-to-r from-terracotta via-primary to-teal hover:opacity-90 text-white shadow-xl shadow-primary/30 transition-all active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Finish & Publish <Zap className="h-4 w-4 fill-white" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateSwap;
