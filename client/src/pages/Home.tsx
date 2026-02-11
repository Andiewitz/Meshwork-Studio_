import { useState } from "react";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeaturedCard } from "@/components/workspace/FeaturedCard";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: workspaces, isLoading: isWorkspacesLoading } = useWorkspaces();
  const deleteWorkspace = useDeleteWorkspace();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Loading state
  if (isAuthLoading || isWorkspacesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleDelete = (id: number) => {
    deleteWorkspace.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: "Workspace has been removed.",
        });
      },
    });
  };

  const handleEdit = (id: number) => {
    toast({
      title: "Coming Soon",
      description: "Edit functionality will be available in the next update.",
    });
  };

  const mostRecent = workspaces?.[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Welcome back, <br/>
              <span className="text-primary">{user?.firstName || "Creator"}</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              You have {workspaces?.length || 0} active workspaces today.
            </p>
          </motion.div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>Pro Tip: Press <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-xs">Cmd+K</kbd> to search</span>
          </div>
        </div>

        {/* Featured Card */}
        {mostRecent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <FeaturedCard 
              title={mostRecent.title} 
              type={mostRecent.type}
              onContinue={() => console.log("Continue", mostRecent.id)}
            />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="p-10 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center gap-4 bg-muted/30"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">No workspaces yet</h3>
            <p className="text-muted-foreground max-w-sm">Create your first workspace to get started with your next big project.</p>
            <Button onClick={() => setIsCreateOpen(true)}>Create Workspace</Button>
          </motion.div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center py-4 border-b border-border/40">
          <Button 
            onClick={() => setIsCreateOpen(true)}
            size="lg"
            className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-white font-medium px-6"
          >
            <Plus className="mr-2 w-5 h-5" />
            New Workspace
          </Button>

          <Button 
            variant="outline"
            size="lg"
            className="rounded-full border-primary/20 text-primary hover:bg-primary/5 hover:text-primary font-medium px-6"
          >
            <Upload className="mr-2 w-5 h-5" />
            Import Project
          </Button>

          <div className="sm:ml-auto">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2 group">
              Search Library
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Workspace List */}
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif">Recent Projects</h2>
            <Button variant="link" className="text-muted-foreground hover:text-primary">View All</Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {workspaces?.map((workspace, index) => (
              <motion.div
                key={workspace.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (index * 0.1), duration: 0.4 }}
              >
                <WorkspaceCard 
                  workspace={workspace} 
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />
    </DashboardLayout>
  );
}
