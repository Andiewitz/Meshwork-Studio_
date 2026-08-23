import React from "react";
import { motion } from "framer-motion";
import { MeshworkLogo } from "@/components/MeshworkLogo";
import { AnimatedSpinner } from "@/components/ui/animated-spinner";

export interface RedirectLoadingProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

/**
 * RedirectLoading (formerly default redirect loading screen)
 * Full-screen centered brand spinner with Meshwork logo and animated status.
 */
export function RedirectLoading({
  message = "Redirecting...",
  subMessage,
  className = "",
}: RedirectLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-background fixed inset-0 z-[100] ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative flex items-center justify-center">
          <AnimatedSpinner size="5.5rem" />
          <div className="absolute w-8 h-8 flex items-center justify-center pointer-events-none">
            <MeshworkLogo />
          </div>
        </div>
        {message && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-medium text-white/70 tracking-wider uppercase">
              {message}
            </p>
            {subMessage && (
              <p className="text-[11px] text-white/30">{subMessage}</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default RedirectLoading;
