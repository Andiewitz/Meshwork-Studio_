import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
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
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
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
    return <Redirect to="/auth/login" />;
  }

  return <Component />;
}

const PageTransition = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.99, filter: "blur(4px)" }}
    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 1.01, filter: "blur(4px)" }}
    transition={{
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1], // Architectural premium easing
      opacity: { duration: 0.25 }
    }}
    className={cn("flex-1", className)}
  >
    {children}
  </motion.div>
);

function Router() {
  const [location] = useLocation();

  // Auth routes without layout
  if (location.startsWith("/auth/") || location === "/auth") {
    return (
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/auth/login">
            <PageTransition>
              <Login />
            </PageTransition>
          </Route>
          <Route path="/auth/register">
            <PageTransition>
              <Register />
            </PageTransition>
          </Route>
          <Route path="/auth">
            <Redirect to="/auth/login" />
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
            <ProtectedRoute component={() => (
              <PageTransition className="h-full w-full">
                <Workspace />
              </PageTransition>
            )} />
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
            <ProtectedRoute component={() => (
              <PageTransition>
                <Home />
              </PageTransition>
            )} />
          </Route>
          <Route path="/workspaces">
            <ProtectedRoute component={() => (
              <PageTransition>
                <Home />
              </PageTransition>
            )} />
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
      <WouterRouter>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
