import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Settings, 
  Search, 
  Bell, 
  Menu,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Home", href: "/" },
    { icon: FolderOpen, label: "Workspaces", href: "/workspaces" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
      <div className="p-6">
        <h1 className="text-2xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          Nexus
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }
            `}>
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl p-4 border border-primary/10">
          <p className="text-sm font-medium text-foreground">Pro Plan</p>
          <p className="text-xs text-muted-foreground mt-1">4/10 workspaces used</p>
          <div className="h-1.5 w-full bg-background rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary w-[40%] rounded-full" />
          </div>
          <Button variant="link" className="text-primary text-xs px-0 h-auto mt-2">
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-border/50 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 px-4 md:px-8 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-serif font-bold text-primary">Nexus</h1>
          </div>

          <div className="hidden md:flex items-center w-full max-w-md bg-secondary/50 rounded-full px-4 py-2 border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <Input 
              placeholder="Search workspaces..." 
              className="border-none bg-transparent h-auto p-0 placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="rounded-full relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full pl-2 pr-4 gap-3 h-10 border border-border/50 hover:bg-secondary/80">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline-block">
                    {user?.firstName || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
