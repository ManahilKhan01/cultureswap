import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { swapService } from "@/lib/swapService";
import { supabase } from "@/lib/supabase";
import { skillCategories } from "@/data/mockData";
import { ArrowLeft, Loader2, Zap, BookOpen, Sparkles, Users } from "lucide-react";

const CreateSwap = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_offered: "",
    skill_wanted: "",
    category: "",
    duration: "",
    format: "online"
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.skill_offered.trim() || !formData.skill_wanted.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a swap",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      // Create swap
      const swap = await swapService.createSwap(user.id, formData);

      if (swap) {
        toast({
          title: "Success!",
          description: "Your skill swap has been created and is now visible in the Discovery section",
        });
        navigate("/swaps");
      }
    } catch (error: any) {
      console.error("Error creating swap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create swap",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = skillCategories.map(cat => cat.name);

  const durations = [
    "1 hour",
    "2 hours",
    "3 hours",
    "5 hours",
    "10 hours",
    "20+ hours"
  ];

  const formats = [
    { value: "online", label: "Online" },
    { value: "in-person", label: "In-Person" },
    { value: "both", label: "Both" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/swaps")}
          className="flex items-center gap-2 text-terracotta hover:text-terracotta/80 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Swaps
        </button>

        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl mb-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--terracotta))] via-[hsl(var(--golden))] to-[hsl(var(--teal))] opacity-95"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>

          <div className="relative px-8 py-10 text-white">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-display tracking-tight">Create a Skill Swap</h1>
                <p className="text-white/90 text-sm font-medium mt-1">Start exchanging skills and connect with the global community</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Swap Details</CardTitle>
                <CardDescription>
                  Tell others about the skill you want to share and what you'd like to learn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Section 1: Core Skills */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-terracotta" />
                      <h3 className="text-lg font-bold">Your Exchange</h3>
                    </div>

                    <div className="bg-gradient-to-br from-warm-cream/40 to-warm-cream/20 rounded-xl p-6 border border-warm-cream/60 space-y-6 shadow-sm">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="font-semibold text-charcoal text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-golden" />
                          Swap Title *
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="e.g., English Language Exchange"
                          value={formData.title}
                          onChange={handleChange}
                          disabled={loading}
                          className="h-11 text-base border-2 border-warm-cream hover:border-golden/50 focus:border-terracotta focus:ring-terracotta/20 bg-white/50"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="skill_offered" className="font-semibold text-charcoal text-sm flex items-center gap-2">
                            <span className="inline-block w-5 h-5 rounded-full bg-gradient-to-br from-terracotta to-golden flex items-center justify-center text-white text-xs">✓</span>
                            I Offer *
                          </Label>
                          <Input
                            id="skill_offered"
                            name="skill_offered"
                            placeholder="e.g., English Teaching"
                            value={formData.skill_offered}
                            onChange={handleChange}
                            disabled={loading}
                            className="h-11 text-base border-2 border-terracotta/20 hover:border-terracotta/40 focus:border-terracotta focus:ring-terracotta/20 bg-white/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="skill_wanted" className="font-semibold text-charcoal text-sm flex items-center gap-2">
                            <span className="inline-block w-5 h-5 rounded-full bg-gradient-to-br from-teal to-teal/80 flex items-center justify-center text-white text-xs">?</span>
                            I Learn *
                          </Label>
                          <Input
                            id="skill_wanted"
                            name="skill_wanted"
                            placeholder="e.g., Spanish Language"
                            value={formData.skill_wanted}
                            onChange={handleChange}
                            disabled={loading}
                            className="h-11 text-base border-2 border-teal/20 hover:border-teal/40 focus:border-teal focus:ring-teal/20 bg-white/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-golden" />
                      <h3 className="text-lg font-bold">Details</h3>
                    </div>

                    <div className="bg-gradient-to-br from-soft-sand/30 to-soft-sand/10 rounded-xl p-6 border border-soft-sand/50 space-y-6 shadow-sm">
                      <div className="space-y-2">
                        <Label htmlFor="description" className="font-semibold text-charcoal text-sm">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Add more details about your swap... (optional)"
                          value={formData.description}
                          onChange={handleChange}
                          disabled={loading}
                          rows={4}
                          className="text-base border-2 border-soft-sand/50 hover:border-golden/40 focus:border-golden focus:ring-golden/20 resize-none bg-white/50"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="font-semibold text-charcoal text-sm">Category</Label>
                          <Select value={formData.category} onValueChange={(v) => handleSelectChange("category", v)}>
                            <SelectTrigger disabled={loading} className="h-11 border-2 border-golden/20 hover:border-golden/40 focus:border-golden focus:ring-golden/20 bg-white/50">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration" className="font-semibold text-charcoal text-sm">Duration</Label>
                          <Select value={formData.duration} onValueChange={(v) => handleSelectChange("duration", v)}>
                            <SelectTrigger disabled={loading} className="h-11 border-2 border-teal/20 hover:border-teal/40 focus:border-teal focus:ring-teal/20 bg-white/50">
                              <SelectValue placeholder="Duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {durations.map(dur => (
                                <SelectItem key={dur} value={dur}>{dur}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="format" className="font-semibold text-charcoal text-sm">Format</Label>
                          <Select value={formData.format} onValueChange={(v) => handleSelectChange("format", v)}>
                            <SelectTrigger disabled={loading} className="h-11 border-2 border-terracotta/20 hover:border-terracotta/40 focus:border-terracotta focus:ring-terracotta/20 bg-white/50">
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                              {formats.map(fmt => (
                                <SelectItem key={fmt.value} value={fmt.value}>{fmt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="terracotta"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Swap"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/swaps")}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Tips for Success</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Be Clear & Specific</h4>
                  <p className="text-muted-foreground">
                    Help others understand exactly what you offer and what you're looking for
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Set Realistic Goals</h4>
                  <p className="text-muted-foreground">
                    Choose a duration you're comfortable with committing to
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Be Professional</h4>
                  <p className="text-muted-foreground">
                    Use a professional title and description to attract serious partners
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Mention Your Experience</h4>
                  <p className="text-muted-foreground">
                    Let others know your level (beginner, intermediate, advanced)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateSwap;
