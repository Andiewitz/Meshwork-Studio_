import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Chrome, Box, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Validation
  const isEmailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user.email}`,
        });
        setLocation("/");
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orange Wavy Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10"
                fill="none"
                stroke="#FF9B47"
                strokeWidth="0.3"
                opacity="0.4"
              />
              <path
                d="M0 15 Q 12.5 5, 25 15 T 50 15 T 75 15 T 100 15"
                fill="none"
                stroke="#FF9B47"
                strokeWidth="0.2"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#waves)" transform="rotate(-15 50 50)" />
        </svg>
        
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <line x1="-200" y1="1000" x2="400" y2="-100" stroke="#FF9B47" strokeWidth="1" opacity="0.15" />
          <line x1="0" y1="1100" x2="600" y2="-100" stroke="#FF9B47" strokeWidth="1" opacity="0.1" />
          <line x1="200" y1="1200" x2="800" y2="-100" stroke="#FF9B47" strokeWidth="1" opacity="0.12" />
          <line x1="400" y1="1300" x2="1000" y2="-100" stroke="#FF9B47" strokeWidth="1" opacity="0.08" />
          <line x1="600" y1="1400" x2="1200" y2="-100" stroke="#FF9B47" strokeWidth="1" opacity="0.1" />
          <line x1="800" y1="1500" x2="1400" y2="-100" stroke="#FF9B47" strokeWidth="1" opacity="0.15" />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center bg-card">
            <Box className="w-6 h-6" />
          </div>
          <span className="ml-3 text-2xl font-black uppercase tracking-tighter">
            Meshwork Studio
          </span>
        </div>

        <div className="brutal-card bg-card p-6 border-2 border-foreground">
          <h1 className="text-xl font-black uppercase tracking-tighter mb-6 text-center">
            Sign In
          </h1>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold uppercase text-xs tracking-widest">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  required
                  className={`border-2 transition-all duration-200 ${
                    touched.email && isEmailValid
                      ? "border-green-500 bg-green-50/30" 
                      : touched.email && email.length > 0 && !isEmailValid
                      ? "border-red-400 bg-red-50/30"
                      : "border-foreground focus:border-primary"
                  }`}
                />
                {touched.email && isEmailValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold uppercase text-xs tracking-widest">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  required
                  className={`border-2 pr-10 transition-all duration-200 ${
                    touched.password && isPasswordValid
                      ? "border-green-500 bg-green-50/30" 
                      : touched.password && password.length > 0 && !isPasswordValid
                      ? "border-red-400 bg-red-50/30"
                      : "border-foreground focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full accent-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Google Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full mt-4 border-2 border-foreground font-bold"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href="/auth/register" className="font-bold text-foreground hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
