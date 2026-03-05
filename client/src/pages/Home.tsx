import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useAuth } from "@/hooks/use-auth";
import { FeaturedCard } from "@/components/workspace/FeaturedCard";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Search, Box, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Home() {
  const [location, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: workspaces, isLoading: isWorkspacesLoading } = useWorkspaces();
  const deleteWorkspace = useDeleteWorkspace();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const isWorkspacesPage = location === "/workspaces";

  const handleDelete = (id: number) => {
    deleteWorkspace.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: "Workspace has been removed.",
        });
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  const handleToggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (filteredWorkspaces.length === selectedIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWorkspaces.map(w => w.id)));
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    let completed = 0;
    ids.forEach(id => {
      deleteWorkspace.mutate(id, {
        onSuccess: () => {
          completed++;
          if (completed === ids.length) {
            toast({
              title: "Deleted",
              description: `${completed} workspaces removed.`,
            });
            setSelectedIds(new Set());
            setIsMultiSelectMode(false);
          }
        },
      });
    });
  };

  const filteredWorkspaces = useMemo(() => {
    if (!workspaces) return [];

    let result = workspaces.filter(ws =>
      ws.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result = [...result].sort((a, b) => b.id - a.id);
    }

    if (!isWorkspacesPage) {
      return result.slice(0, 5);
    }
    return result;
  }, [workspaces, searchTerm, sortBy, isWorkspacesPage]);

  // Must be ABOVE early returns — hooks cannot be called conditionally
  const mostRecent = useMemo(() => {
    if (!workspaces) return null;
    return [...workspaces].sort((a, b) => b.id - a.id)[0];
  }, [workspaces]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const greeting = getGreeting();
  const userName = user?.firstName || user?.email?.split('@')[0] || "Architect";

  if (isAuthLoading || isWorkspacesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 reveal-on-scroll">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
            {isWorkspacesPage ? (
              <>All Projects</>
            ) : (
              <>{greeting}, {userName}.</>
            )}
          </h1>
          <p className="text-base font-sans text-muted-foreground max-w-md leading-relaxed">
            {isWorkspacesPage ? "A complete blueprint of your infrastructure." : "Let's architect something extraordinary today."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        {!isWorkspacesPage && (
          <div className="space-y-8 reveal-on-scroll delay-200">
            {mostRecent ? (
              <FeaturedCard
                workspace={mostRecent}
                onContinue={() => setLocation(`/workspace/${mostRecent.id}`)}
                onDelete={handleDelete}
              />
            ) : (
              <div className="brutal-card bg-foreground text-background p-8 md:p-10 flex flex-col gap-5 relative overflow-hidden group min-h-[240px] justify-center">
                <div className="flex flex-col items-center text-center gap-3 relative z-10">
                  <div className="w-12 h-12 border-2 border-background flex items-center justify-center">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-semibold tracking-tight">
                      Start Your First Project
                    </h3>
                    <p className="text-background/60 font-sans text-sm mt-1">
                      Create a workspace to begin architecting
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsCreateOpen(true)} 
                    className="accent-btn h-12 px-8 text-sm mt-2"
                  >
                    Create Workspace
                  </Button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary mix-blend-multiply rounded-full blur-3xl opacity-20 pointer-events-none" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="accent-btn h-12 px-6 text-sm font-medium flex-1 sm:flex-none"
              >
                New workspace
              </Button>

              <Button
                className="brutal-card h-12 px-6 text-foreground font-medium text-sm hover:bg-foreground hover:text-white transition-colors flex-1 sm:flex-none"
              >
                Import
              </Button>

              <Link href="/workspaces">
                <Button variant="ghost" className="text-foreground font-medium text-sm gap-2 hover:bg-transparent group">
                  View all
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className={cn("space-y-5 reveal-on-scroll delay-300", isWorkspacesPage ? "lg:col-span-2 mt-0" : "lg:-mt-24")}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-6">
              <h2 className="text-lg font-display font-semibold tracking-tight">
                {isWorkspacesPage ? "My projects" : "Recent"}
              </h2>
              {!isWorkspacesPage && <span className="text-lg font-display font-medium text-muted-foreground">Team</span>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isWorkspacesPage && (
                <>
                  {!isMultiSelectMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMultiSelectMode(true)}
                      className="font-label font-medium text-xs"
                    >
                      Select multiple
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="font-label font-medium text-xs"
                      >
                        {selectedIds.size === filteredWorkspaces.length ? "Deselect all" : "Select all"}
                      </Button>
                      {selectedIds.size > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          className="font-label font-medium text-xs gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete ({selectedIds.size})
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsMultiSelectMode(false);
                          setSelectedIds(new Set());
                        }}
                        className="font-label font-medium text-xs"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="relative w-full max-w-[200px] reveal-on-scroll delay-100">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-sans text-sm"
              />
            </div>

            {isWorkspacesPage && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-label font-medium text-muted-foreground uppercase tracking-wide">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-sans font-medium text-sm focus:outline-none cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors"
                >
                  <option value="recent">Recent</option>
                  <option value="name">Name</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onDelete={handleDelete}
                isSelected={selectedIds.has(workspace.id)}
                onToggleSelect={handleToggleSelection}
                isMultiSelectMode={isMultiSelectMode}
              />
            ))}
            {!filteredWorkspaces.length && (
              <div className="brutal-card border-dashed border-2 border-foreground/30 flex flex-col items-center justify-center gap-4 py-16 px-8 bg-card/50">
                <div className="w-16 h-16 border-2 border-foreground/20 flex items-center justify-center">
                  <Search className="w-8 h-8 text-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="font-black text-lg uppercase tracking-widest text-foreground">
                    {searchTerm ? "No Matches Found" : "Start Your First Project"}
                  </p>
                  <p className="text-muted-foreground/60 font-bold text-xs uppercase tracking-widest mt-2">
                    {searchTerm ? "Try a different search term" : "Create a workspace to get started"}
                  </p>
                </div>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsCreateOpen(true)} 
                    className="accent-btn h-12 px-8 text-sm mt-2"
                  >
                    CREATE WORKSPACE
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
