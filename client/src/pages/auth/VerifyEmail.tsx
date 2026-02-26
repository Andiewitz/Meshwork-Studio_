import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Box, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);

  // Get email from query params
  const params = new URLSearchParams(search);
  const email = params.get("email") || "";

  useEffect(() => {
    if (!email) {
      toast({
        title: "Invalid access",
        description: "Please register first.",
        variant: "destructive",
      });
      setLocation("/auth/register");
    }
  }, [email, setLocation, toast]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value].join("");
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (fullCode: string) => {
    if (fullCode.length !== 6) return;

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-email", {
        email,
        code: fullCode,
      });
      const data = await res.json();

      if (res.ok) {
        setIsVerified(true);
        toast({
          title: "Email verified!",
          description: "You can now sign in.",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          setLocation("/auth/login");
        }, 2000);
      } else {
        toast({
          title: "Verification failed",
          description: data.message || "Invalid or expired code",
          variant: "destructive",
        });
        // Clear code on error
        setCode(["", "", "", "", "", ""]);
        document.getElementById("code-0")?.focus();
      }
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await apiRequest("POST", "/api/auth/resend-code", { email });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Code sent!",
          description: "Check your email for the new verification code.",
        });
      } else {
        toast({
          title: "Failed to resend",
          description: data.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to resend",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">
            Email Verified!
          </h1>
          <p className="text-muted-foreground mb-4">
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2 text-center">
            Verify Your Email
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter the 6-digit code sent to{" "}
            <span className="font-bold text-foreground">{email}</span>
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-foreground bg-background focus:border-primary focus:outline-none"
              />
            ))}
          </div>

          <Button
            onClick={() => handleVerify(code.join(""))}
            className="w-full accent-btn mb-4"
            disabled={isLoading || code.join("").length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn&apos;t receive the code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending}
              className="font-bold hover:underline"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
