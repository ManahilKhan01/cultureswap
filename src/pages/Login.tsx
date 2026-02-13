import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
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
import { clearAuthStorage, getStorageUsage } from "@/lib/storage";
import { validateEmail } from "@/lib/validation";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear any corrupted localStorage on mount to prevent quota exceeded errors
  useEffect(() => {
    const { used, total } = getStorageUsage();
    const usagePercent = (used / total) * 100;

    // If storage is more than 80% full, proactively clear auth data
    if (usagePercent > 80) {
      console.warn(
        `[Login] Storage usage high (${usagePercent.toFixed(1)}%), clearing auth storage`,
      );
      clearAuthStorage();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const emailError = validateEmail(email);
      if (emailError) throw new Error(emailError);

      if (!password) {
        throw new Error("Please enter your password");
      }

      // Sign in with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      if (authData.user) {
        // Get user profile
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        // Note: Supabase automatically stores the session in localStorage
        // so we don't need to manually store the token

        toast({
          title: "Success!",
          description: `Welcome back, ${userProfile?.full_name || "User"}!`,
        });

        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      toast({
        title: "Error",
        description: err.message || "Login failed",
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
          <CardTitle className="text-2xl">Sign in</CardTitle>
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

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
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

              {isPasswordFocused && (
                <div className="text-xs space-y-1 mt-2 p-2 bg-muted/50 rounded-md animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="font-medium mb-1">Password must contain:</p>
                  <div
                    className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? "bg-green-600" : "bg-gray-300"}`}
                    />
                    At least 8 characters
                  </div>
                  <div
                    className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`}
                    />
                    One uppercase letter
                  </div>
                  <div
                    className={`flex items-center gap-2 ${/[a-z]/.test(password) ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`}
                    />
                    One lowercase letter
                  </div>
                  <div
                    className={`flex items-center gap-2 ${/[^a-zA-Z0-9]/.test(password) ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/[^a-zA-Z0-9]/.test(password) ? "bg-green-600" : "bg-gray-300"}`}
                    />
                    One special character
                  </div>
                </div>
              )}

              <div className="text-right mt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-terracotta hover:bg-terracotta/90 text-white shadow-md transition-all active:scale-95"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-terracotta hover:underline font-medium"
              >
                Sign Up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
