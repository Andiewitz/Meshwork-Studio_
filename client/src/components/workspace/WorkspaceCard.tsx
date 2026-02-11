import { Workspace } from "@shared/schema";
import { format } from "date-fns";
import { Box, MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface WorkspaceCardProps {
  workspace: Workspace;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export function WorkspaceCard({ workspace, onDelete, onEdit }: WorkspaceCardProps) {
  // Determine icon color based on type
  const getIconColor = (type: string) => {
    switch (type) {
      case 'architecture': return 'text-orange-500 bg-orange-50';
      case 'app': return 'text-blue-500 bg-blue-50';
      case 'presentation': return 'text-pink-500 bg-pink-50';
      default: return 'text-primary bg-purple-50';
    }
  };

  const iconStyle = getIconColor(workspace.type);

  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconStyle} transition-transform group-hover:scale-110 duration-300`}>
          <Box className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {workspace.title}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {workspace.type} • Last edited {format(new Date(workspace.createdAt || new Date()), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          className="hidden md:flex text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium hover:bg-primary/5 hover:text-primary"
        >
          Open Project
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(workspace.id)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete?.(workspace.id)}
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
