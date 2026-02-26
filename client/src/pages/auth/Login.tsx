import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Chrome, Box } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 border-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold uppercase text-xs tracking-widest">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 border-foreground"
              />
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
