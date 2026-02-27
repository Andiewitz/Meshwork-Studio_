import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export function LoadingScreen({ message = "Loading", subMessage }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-medium text-foreground">
            {message}
            <span className="inline-flex">
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              >
                .
              </motion.span>
            </span>
          </p>
          {subMessage && (
            <p className="text-sm text-muted-foreground">{subMessage}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function RedirectingScreen() {
  return <LoadingScreen message="Redirecting" subMessage="Please wait..." />;
}
