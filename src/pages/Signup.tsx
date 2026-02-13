import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import {
  validateName,
  validateEmail,
  validatePassword,
} from "@/lib/validation";

import { CameraModal } from "@/components/CameraModal";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] =
    useState<string>("/profile.svg");
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast({
      title: "Photo captured",
      description: "Your profile photo has been updated.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validation
      const nameError = validateName(formData.fullName);
      if (nameError) throw new Error(nameError);

      const emailError = validateEmail(formData.email);
      if (emailError) throw new Error(emailError);

      const passwordError = validatePassword(formData.password);
      if (passwordError) throw new Error(passwordError);

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Sign up in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      console.log("Auth user created:", authData.user);

      // Create in user_profiles table (new)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              full_name: formData.fullName,
              profile_image_url: "/profile.svg", // Default placeholder image
              languages: [],
              skills_offered: [],
              skills_wanted: [],
            },
          ]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        console.log("User profile created in user_profiles table");

        // Upload profile image if provided
        if (profileImage) {
          try {
            await profileService.uploadAndUpdateProfileImage(
              authData.user.id,
              profileImage,
            );
            console.log("Profile image uploaded successfully");
          } catch (imageError) {
            console.error("Error uploading profile image:", imageError);
            // Continue with signup even if image upload fails
          }
        }
      }

      toast({
        title: "Success!",
        description: "Account created! Redirecting to login...",
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Signup failed");
      toast({
        title: "Error",
        description: err.message || "Signup failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url(/bg.jpg)",
        backgroundColor: "#FBF5EA",
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <Card className="w-full max-w-md shadow-lg relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join CultureSwap today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Profile Image Upload */}
            <div className="space-y-3">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100 aspect-square">
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-10 border-dashed"
                    onClick={() => setShowCamera(true)}
                    disabled={isLoading}
                  >
                    <Camera className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Take Picture</span>
                  </Button>

                  <div className="relative">
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <Label
                      htmlFor="profileImage"
                      className="flex items-center justify-center gap-2 w-full h-10 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors text-xs sm:text-sm font-medium shadow-sm"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Your full name"
                  className="pl-10"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="text-xs space-y-1 mt-2 p-2 bg-muted/50 rounded-md">
                <p className="font-medium mb-1">Password must contain:</p>
                <div
                  className={`flex items-center gap-2 ${formData.password.length >= 8 ? "text-green-600" : "text-muted-foreground"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? "bg-green-600" : "bg-gray-300"}`}
                  />
                  At least 8 characters
                </div>
                <div
                  className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? "bg-green-600" : "bg-gray-300"}`}
                  />
                  One uppercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.password) ? "bg-green-600" : "bg-gray-300"}`}
                  />
                  One lowercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${/[^a-zA-Z0-9]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${/[^a-zA-Z0-9]/.test(formData.password) ? "bg-green-600" : "bg-gray-300"}`}
                  />
                  One special character
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign In
              </a>
            </p>
          </form>
        </CardContent>
      </Card>

      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default Signup;
