import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "newsletter-subscribe",
        { body: { email } },
      );

      if (error) throw error;

      toast({
        title: data.message.includes("already")
          ? "Already Subscribed"
          : "Success! 🎉",
        description: data.message,
      });
      setEmail("");
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };
  const footerLinks = {
    platform: [
      { name: "How It Works", href: "/how-it-works" },
      { name: "Discover Skills", href: "/discover" },
      { name: "Community", href: "/community" },
      { name: "Success Stories", href: "/stories" },
    ],
    support: [
      { name: "Help Center", href: "/support" },
      { name: "Safety Tips", href: "/safety" },
      { name: "Contact Us", href: "/contact" },
      { name: "FAQ", href: "/faq" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Community Guidelines", href: "/guidelines" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Blog", href: "/blog" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-navy text-white w-full">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-display text-2xl font-semibold mb-2">
                Stay Connected
              </h3>
              <p className="text-white/70">
                Get weekly tips on skill exchange and cultural learning
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 sm:gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full sm:min-w-[240px] md:w-72"
              />
              <Button
                variant="terracotta"
                onClick={handleSubscribe}
                disabled={isSubscribing || !email}
                className="w-full sm:w-auto mt-1 sm:mt-0"
              >
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
            <p>
              © {new Date().getFullYear()} CultureSwap. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span>Made for cultural exchange</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
