import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { RedirectingScreen } from "@/components/ui/loading-screen";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Settings from "@/pages/Settings";
import Workspace from "@/pages/Workspace";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isRedirecting } = useAuth();

  if (isLoading || isRedirecting) {
    return <RedirectingScreen />;
  }

  if (!user) {
    return <Redirect to="/auth/login" />;
  }

  return <Component />;
}

const PageTransition = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className={cn("flex-1", className)}
  >
    {children}
  </motion.div>
);

function Router() {
  const [location] = useLocation();
  const { user, isLoading, isRedirecting } = useAuth();

  // Auth routes - render immediately without waiting for auth check (fixes blank screen)
  if (location.startsWith("/auth/")) {
    // Still show loading screen during redirect after logout
    if (isRedirecting) {
      return <RedirectingScreen />;
    }
    return (
      <Switch location={location} key={location}>
        <Route path="/auth/login">
          <Login />
        </Route>
        <Route path="/auth/register">
          <Register />
        </Route>
        <Route>
          <Redirect to="/auth/login" />
        </Route>
      </Switch>
    );
  }

  // Show redirecting screen during auth transitions for protected routes
  if (isLoading || isRedirecting) {
    return <RedirectingScreen />;
  }

  // Public landing page (only for non-authenticated users)
  if (location === "/" && !user) {
    return (
      <AnimatePresence mode="sync">
        <PageTransition>
          <Landing />
        </PageTransition>
      </AnimatePresence>
    );
  }

  // Workspace routes
  if (location.startsWith("/workspace/")) {
    return (
      <AnimatePresence mode="sync">
        <Switch location={location} key={location}>
          <Route path="/workspace/:id">
            <ProtectedRoute component={Workspace} />
          </Route>
        </Switch>
      </AnimatePresence>
    );
  }

  // Dashboard routes with layout
  return (
    <DashboardLayout>
      <AnimatePresence mode="sync">
        <Switch location={location} key={location}>
          <Route path="/">
            <ProtectedRoute component={Home} />
          </Route>
          <Route path="/workspaces">
            <ProtectedRoute component={Home} />
          </Route>
          <Route path="/settings">
            <ProtectedRoute component={Settings} />
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
