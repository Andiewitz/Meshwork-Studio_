import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Box } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// hCaptcha site key (free tier available at hcaptcha.com)
const HCAPTCHA_SITE_KEY = "10000000-ffff-ffff-ffff-000000000001"; // Test key - replace with yours in production

declare global {
  interface Window {
    hcaptcha: any;
    onloadHCaptchaCallback: () => void;
  }
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  // Load hCaptcha script
  useEffect(() => {
    if (window.hcaptcha) {
      renderCaptcha();
    } else {
      const script = document.createElement("script");
      script.src = "https://js.hcaptcha.com/1/api.js?onload=onloadHCaptchaCallback&render=explicit";
      script.async = true;
      script.defer = true;
      window.onloadHCaptchaCallback = renderCaptcha;
      document.head.appendChild(script);
    }
  }, []);

  const renderCaptcha = () => {
    if (captchaRef.current && window.hcaptcha) {
      window.hcaptcha.render(captchaRef.current, {
        sitekey: HCAPTCHA_SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
      });
    }
  };

  const resetCaptcha = () => {
    if (window.hcaptcha && captchaRef.current) {
      window.hcaptcha.reset(captchaRef.current);
      setCaptchaToken("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: "CAPTCHA required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        captchaToken,
      });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Registration successful!",
          description: "You can now sign in.",
        });
        setLocation("/auth/login");
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
        resetCaptcha();
      }
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center bg-card">
            <Box className="w-6 h-6" />
          </div>
          <span className="ml-3 text-2xl font-black uppercase tracking-tighter">
            EMNESH
          </span>
        </div>

        <div className="brutal-card bg-card p-6 border-2 border-foreground">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-6 text-center">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-bold uppercase text-xs tracking-widest">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="border-2 border-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-bold uppercase text-xs tracking-widest">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="border-2 border-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold uppercase text-xs tracking-widest">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-2 border-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold uppercase text-xs tracking-widest">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="border-2 border-foreground"
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-bold uppercase text-xs tracking-widest">
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="border-2 border-foreground"
              />
            </div>

            {/* CAPTCHA */}
            <div className="flex justify-center py-2">
              <div ref={captchaRef} />
            </div>

            <Button
              type="submit"
              className="w-full accent-btn"
              disabled={isLoading || !captchaToken}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/auth/login" className="font-bold text-foreground hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
