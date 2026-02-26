import { ArrowRight, MoreHorizontal, Pencil, Copy, Trash, ExternalLink, Box, Server, Globe, Database, Shield, GitBranch, Zap, Cpu, Network, Cloud, Lock, BarChart3, Code2, Wifi, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef, useEffect } from "react";
import { useUpdateWorkspace, useDuplicateWorkspace } from "@/hooks/use-workspaces";
import { useToast } from "@/hooks/use-toast";

interface FeaturedCardProps {
  workspace: {
    id: number;
    title: string;
    type: string;
    icon?: string | null;
  };
  onContinue?: () => void;
  onDelete?: (id: number) => void;
}

// Icon mapping for workspace icons
const ICON_MAP: Record<string, LucideIcon> = {
  server: Server,
  globe: Globe,
  box: Box,
  database: Database,
  shield: Shield,
  git: GitBranch,
  zap: Zap,
  cpu: Cpu,
  network: Network,
  cloud: Cloud,
  lock: Lock,
  chart: BarChart3,
  code: Code2,
  wifi: Wifi,
  grid: LayoutGrid,
};

function getWorkspaceIcon(iconId?: string): LucideIcon {
  return ICON_MAP[iconId || "box"] || Box;
}

export function FeaturedCard({ workspace, onContinue, onDelete }: FeaturedCardProps) {
  const { toast } = useToast();
  const updateWorkspace = useUpdateWorkspace();
  const duplicateWorkspace = useDuplicateWorkspace();

  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(workspace.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = getWorkspaceIcon(workspace.icon || undefined);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const handleRename = async () => {
    if (!title.trim() || title === workspace.title) {
      setIsRenaming(false);
      setTitle(workspace.title);
      return;
    }

    try {
      await updateWorkspace.mutateAsync({
        id: workspace.id,
        title: title.trim(),
      });
      setIsRenaming(false);
      toast({ title: "Updated", description: "Project renamed successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename.", variant: "destructive" });
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateWorkspace.mutateAsync({
        id: workspace.id,
        title: `${workspace.title} (Copy)`,
      });
      toast({ title: "Success", description: "Project duplicated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to duplicate.", variant: "destructive" });
    }
  };

  return (
    <div className="brutal-card bg-foreground text-background p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden group">
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setIsRenaming(false);
                  setTitle(workspace.title);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] outline-none border-b-4 border-primary w-full text-background mb-2"
            />
          ) : (
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] truncate pr-4">
              {workspace.title || "Untitled Project"}
            </h2>
          )}
          <div className="bg-background text-foreground px-3 py-1 font-bold text-xs uppercase tracking-widest border-2 border-foreground w-fit mt-2 flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {workspace.type || "Workspace"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-background border-2 border-transparent hover:border-background hover:bg-background hover:text-foreground transition-all rounded-none"
              >
                <MoreHorizontal className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="brutal-card border-2 border-foreground p-1 bg-card min-w-[160px]">
              <DropdownMenuItem
                onClick={onContinue}
                className="gap-2 font-bold cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> OPEN
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsRenaming(true)}
                className="gap-2 font-bold cursor-pointer"
              >
                <Pencil className="w-4 h-4" /> RENAME
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicate}
                className="gap-2 font-bold cursor-pointer"
              >
                <Copy className="w-4 h-4" /> DUPLICATE
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/10" />
              <DropdownMenuItem
                onClick={() => onDelete?.(workspace.id)}
                className="gap-2 font-bold text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash className="w-4 h-4" /> DELETE
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <Button
          onClick={onContinue}
          className="accent-btn h-14 px-8 text-lg flex items-center gap-3 w-fit"
        >
          CONTINUE EDITING
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-primary mix-blend-multiply rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute -bottom-10 -right-10 text-9xl font-black opacity-10 pointer-events-none transform -rotate-12 select-none">
        01
      </div>
    </div>
  );
}


