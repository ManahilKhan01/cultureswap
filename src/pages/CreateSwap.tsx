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
import { ArrowLeft, Loader2 } from "lucide-react";

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

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Create a Skill Swap</h1>
          <p className="text-muted-foreground">
            Post your skills and find someone to exchange with
          </p>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base">
                      Swap Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., English Language Exchange"
                      value={formData.title}
                      onChange={handleChange}
                      disabled={loading}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Give your swap a clear, descriptive title
                    </p>
                  </div>

                  {/* Skill Offered */}
                  <div className="space-y-2">
                    <Label htmlFor="skill_offered" className="text-base">
                      Skill You Offer *
                    </Label>
                    <Input
                      id="skill_offered"
                      name="skill_offered"
                      placeholder="e.g., English Teaching"
                      value={formData.skill_offered}
                      onChange={handleChange}
                      disabled={loading}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      What skill or knowledge can you share?
                    </p>
                  </div>

                  {/* Skill Wanted */}
                  <div className="space-y-2">
                    <Label htmlFor="skill_wanted" className="text-base">
                      Skill You Want to Learn *
                    </Label>
                    <Input
                      id="skill_wanted"
                      name="skill_wanted"
                      placeholder="e.g., Spanish Language"
                      value={formData.skill_wanted}
                      onChange={handleChange}
                      disabled={loading}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      What would you like to learn in return?
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Add more details about your swap... (optional)"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                      rows={4}
                      className="text-base resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include your experience level, teaching style, or any special notes
                    </p>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base">
                      Category
                    </Label>
                    <Select value={formData.category} onValueChange={(v) => handleSelectChange("category", v)}>
                      <SelectTrigger disabled={loading}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-base">
                      Total Duration Commitment
                    </Label>
                    <Select value={formData.duration} onValueChange={(v) => handleSelectChange("duration", v)}>
                      <SelectTrigger disabled={loading}>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map(dur => (
                          <SelectItem key={dur} value={dur}>{dur}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Format */}
                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-base">
                      Format
                    </Label>
                    <Select value={formData.format} onValueChange={(v) => handleSelectChange("format", v)}>
                      <SelectTrigger disabled={loading}>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map(fmt => (
                          <SelectItem key={fmt.value} value={fmt.value}>{fmt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
