import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Bell, Shield, Globe, Palette, Save, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string>("");
  const [timezones, setTimezones] = useState<any[]>([]);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    city: "",
    country: "",
    timezone: "",
    availability: "",
    languages: "",
    skillsOffered: "",
    skillsWanted: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    matchAlerts: true,
    messageAlerts: true,
    reviewAlerts: true,
    weeklyDigest: false,
  });

  // Load profile data and timezones
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Load user profile
          const userProfile = await profileService.getProfile(user.id);
          if (userProfile) {
            const profileData = {
              name: userProfile.full_name || "",
              bio: userProfile.bio || "",
              city: userProfile.city || "",
              country: userProfile.country || "",
              timezone: userProfile.timezone || "",
              availability: userProfile.availability || "",
              languages: userProfile.languages?.join(", ") || "",
              skillsOffered: userProfile.skills_offered?.join(", ") || "",
              skillsWanted: userProfile.skills_wanted?.join(", "),
            };
            setProfile(profileData);
            setProfileImage(userProfile.profile_image_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop");

            // Cache profile for faster next load
            localStorage.setItem('settings_profile_cache', JSON.stringify({
              profile: profileData,
              image: userProfile.profile_image_url
            }));
          }
        }

        // Load timezones with caching
        const cachedTimezones = localStorage.getItem('timezones_cache');
        if (cachedTimezones) {
          setTimezones(JSON.parse(cachedTimezones));
        } else {
          const zones = await profileService.getTimezones();
          setTimezones(zones);
          localStorage.setItem('timezones_cache', JSON.stringify(zones));
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setDataLoading(false);
      }
    };

    // Load from cache first for instant display
    const cached = localStorage.getItem('settings_profile_cache');
    if (cached) {
      try {
        const { profile: cachedProfile, image } = JSON.parse(cached);
        setProfile(cachedProfile);
        setProfileImage(image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop");
      } catch {
        // Ignore cache errors
      }
    }

    loadData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create a simple data URL (preview)
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        // Just update state, don't save yet
        setProfileImage(imageUrl);
        toast({
          title: "Photo Selected",
          description: "Click 'Save Changes' to confirm the new photo.",
        });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Error loading image:", err);
      toast({
        title: "Error",
        description: "Failed to load image",
        variant: "destructive",
      });
    }
  };

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates = {
        full_name: profile.name,
        bio: profile.bio,
        city: profile.city,
        country: profile.country,
        timezone: profile.timezone,
        availability: profile.availability,
        profile_image_url: profileImage,
        languages: profile.languages.split(",").map(l => l.trim()).filter(l => l),
        skills_offered: profile.skillsOffered.split(",").map(s => s.trim()).filter(s => s),
        skills_wanted: profile.skillsWanted.split(",").map(s => s.trim()).filter(s => s),
      };

      // Check if profile exists
      const existing = await profileService.getProfile(user.id);

      if (existing) {
        // Update existing profile
        await profileService.updateProfile(user.id, updates);
      } else {
        // Create new profile
        await profileService.createProfile(user.id, user.email || "", profile.name, updates);
      }

      // Update user metadata in Supabase Auth
      await supabase.auth.updateUser({
        data: {
          full_name: profile.name,
          avatar_url: profileImage
        }
      });

      // User metadata is already updated via supabase.auth.updateUser above
      // Supabase automatically syncs this to its session storage

      // Trigger navbar refresh by dispatching event
      window.dispatchEvent(new Event('profileUpdated'));

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationsSave = () => {
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/profile"><ArrowLeft className="h-4 w-4 mr-2" />Back to Profile</Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2"><Shield className="h-4 w-4" />Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information and skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <img
                    src={profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                    alt={profile.name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  />
                  <div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      variant="outline"
                      asChild
                      className="cursor-pointer"
                    >
                      <label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Change Photo
                      </label>
                    </Button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                      <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.id} value={tz.name}>{tz.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={4} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">Languages (comma separated)</Label>
                  <Input id="languages" value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="English, Urdu, Spanish" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Input id="availability" value={profile.availability} onChange={(e) => setProfile({ ...profile, availability: e.target.value })} placeholder="Weekends 9AM-5PM" />
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label htmlFor="skillsOffered">Skills You Offer (comma separated)</Label>
                  <Textarea id="skillsOffered" rows={2} value={profile.skillsOffered} onChange={(e) => setProfile({ ...profile, skillsOffered: e.target.value })} placeholder="Web Development, JavaScript, Python" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skillsWanted">Skills You Want to Learn (comma separated)</Label>
                  <Textarea id="skillsWanted" rows={2} value={profile.skillsWanted} onChange={(e) => setProfile({ ...profile, skillsWanted: e.target.value })} placeholder="Photography, Cooking, Graphic Design" />
                </div>

                <Button variant="terracotta" onClick={handleProfileSave} disabled={isLoading}><Save className="h-4 w-4 mr-2" />{isLoading ? "Saving..." : "Save Changes"}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div><Label>Email Notifications</Label><p className="text-sm text-muted-foreground">Receive notifications via email</p></div>
                  <Switch checked={notifications.emailNotifications} onCheckedChange={(v) => setNotifications({ ...notifications, emailNotifications: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Push Notifications</Label><p className="text-sm text-muted-foreground">Receive push notifications in browser</p></div>
                  <Switch checked={notifications.pushNotifications} onCheckedChange={(v) => setNotifications({ ...notifications, pushNotifications: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Match Alerts</Label><p className="text-sm text-muted-foreground">Get notified when new matches are found</p></div>
                  <Switch checked={notifications.matchAlerts} onCheckedChange={(v) => setNotifications({ ...notifications, matchAlerts: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Message Alerts</Label><p className="text-sm text-muted-foreground">Get notified for new messages</p></div>
                  <Switch checked={notifications.messageAlerts} onCheckedChange={(v) => setNotifications({ ...notifications, messageAlerts: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Review Alerts</Label><p className="text-sm text-muted-foreground">Get notified when you receive reviews</p></div>
                  <Switch checked={notifications.reviewAlerts} onCheckedChange={(v) => setNotifications({ ...notifications, reviewAlerts: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Weekly Digest</Label><p className="text-sm text-muted-foreground">Receive a weekly summary email</p></div>
                  <Switch checked={notifications.weeklyDigest} onCheckedChange={(v) => setNotifications({ ...notifications, weeklyDigest: v })} />
                </div>
                <Button variant="terracotta" onClick={handleNotificationsSave}><Save className="h-4 w-4 mr-2" />Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your profile visibility and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div><Label>Public Profile</Label><p className="text-sm text-muted-foreground">Allow others to view your profile</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Show Location</Label><p className="text-sm text-muted-foreground">Display your city and country</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Show Activity Status</Label><p className="text-sm text-muted-foreground">Show when you're online</p></div>
                  <Switch defaultChecked />
                </div>
                <Button variant="terracotta"><Save className="h-4 w-4 mr-2" />Save Privacy Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;