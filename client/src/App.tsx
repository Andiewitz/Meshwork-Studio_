import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Workspace from "@/pages/Workspace";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

const PageTransition = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={cn("flex-1", className)}
  >
    {children}
  </motion.div>
);

function Router() {
  const [location] = useLocation();

  if (location === "/auth") {
    return (
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/auth">
            <PageTransition>
              <AuthPage />
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    );
  }

  if (location.startsWith("/workspace/")) {
    return (
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/workspace/:id">
            <ProtectedRoute component={Workspace} />
          </Route>
        </Switch>
      </AnimatePresence>
    );
  }

  // Dashboard routes with static layout
  return (
    <DashboardLayout>
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/">
            <ProtectedRoute component={Home} />
          </Route>
          <Route path="/workspaces">
            <ProtectedRoute component={Home} />
          </Route>
          <Route>
            <PageTransition>
              <NotFound />
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    </DashboardLayout>
  );
}



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
