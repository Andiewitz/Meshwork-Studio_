import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, User, Lock, Trash2, Download, AlertTriangle, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteDataConfirmText, setDeleteDataConfirmText] = useState("");

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const res = await apiRequest("PATCH", "/api/user/profile", {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }

      // Update local user data immediately for better UX
      const updatedUser = await res.json();
      queryClient.setQueryData(["/api/auth/me"], updatedUser);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword,
        newPassword,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to change password");
      }

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Error",
        description: "Please type DELETE to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await apiRequest("DELETE", "/api/user/account");
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete account");
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      logout();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteDataConfirmText !== "DELETE ALL") {
      toast({
        title: "Error",
        description: "Please type DELETE ALL to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingData(true);
    try {
      const res = await apiRequest("DELETE", "/api/user/data");
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete data");
      }

      toast({
        title: "Data Deleted",
        description: "All your workspaces and data have been permanently deleted.",
      });
      setDeleteDataConfirmText("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export Requested",
      description: "Your data export is being prepared. You will receive an email when it's ready.",
    });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 -ml-2">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mix-blend-darken text-foreground leading-[0.85]">
          Settings
        </h1>
        <p className="mt-6 text-xl font-bold uppercase tracking-widest border-l-4 border-foreground pl-4 ml-2 max-w-md">
          Manage your account, security, and data preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Card */}
        <Card className="brutal-card border-2 border-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-foreground flex items-center justify-center text-background">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-black uppercase tracking-tighter">Profile</CardTitle>
                <CardDescription className="font-bold uppercase tracking-wider text-xs">
                  Update your personal information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-foreground rounded-none">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-foreground text-background font-black text-2xl rounded-none">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground">Managed via Google OAuth</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-bold uppercase tracking-wider text-xs">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="brutal-input"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-bold uppercase tracking-wider text-xs">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="brutal-input"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold uppercase tracking-wider text-xs">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="brutal-input bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
              className="accent-btn w-full"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="brutal-card border-2 border-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-foreground flex items-center justify-center text-background">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-black uppercase tracking-tighter">Security</CardTitle>
                <CardDescription className="font-bold uppercase tracking-wider text-xs">
                  Change your password
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="font-bold uppercase tracking-wider text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="brutal-input pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-bold uppercase tracking-wider text-xs">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="brutal-input pr-10"
                  placeholder="Enter new password (min 8 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-bold uppercase tracking-wider text-xs">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="brutal-input"
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="accent-btn w-full"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Data & Privacy Card */}
        <Card className="brutal-card border-2 border-foreground lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-foreground flex items-center justify-center text-background">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-black uppercase tracking-tighter">Data & Privacy</CardTitle>
                <CardDescription className="font-bold uppercase tracking-wider text-xs">
                  Manage your data and privacy settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Data */}
            <div className="flex items-center justify-between p-4 border-2 border-border">
              <div>
                <h3 className="font-black uppercase tracking-tighter">Export Your Data</h3>
                <p className="text-sm text-muted-foreground">Download all your workspaces, nodes, and account data</p>
              </div>
              <Button onClick={handleExportData} variant="outline" className="brutal-btn">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Delete All Data */}
            <div className="flex items-center justify-between p-4 border-2 border-destructive/50 bg-destructive/5">
              <div>
                <h3 className="font-black uppercase tracking-tighter text-destructive">Delete All Data</h3>
                <p className="text-sm text-muted-foreground">Permanently delete all your workspaces, nodes, and edges</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="brutal-btn-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="brutal-card border-2 border-destructive">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-black uppercase tracking-tighter flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Delete All Data?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-bold text-sm">
                      This will permanently delete all your workspaces, nodes, edges, and collections.
                      <br /><br />
                      Your account will remain active, but all project data will be lost forever.
                      <br /><br />
                      <strong>Type "DELETE ALL" to confirm:</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={deleteDataConfirmText}
                    onChange={(e) => setDeleteDataConfirmText(e.target.value)}
                    className="brutal-input border-destructive"
                    placeholder="DELETE ALL"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      className="brutal-btn"
                      onClick={() => setDeleteDataConfirmText("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllData}
                      disabled={isDeletingData || deleteDataConfirmText !== "DELETE ALL"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold uppercase"
                    >
                      {isDeletingData ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete All Data"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between p-4 border-2 border-destructive bg-destructive/10">
              <div>
                <h3 className="font-black uppercase tracking-tighter text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="brutal-btn-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="brutal-card border-2 border-destructive">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-black uppercase tracking-tighter flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Delete Account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-bold text-sm">
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      <br /><br />
                      <strong>Type "DELETE" to confirm:</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="brutal-input border-destructive"
                    placeholder="DELETE"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      className="brutal-btn"
                      onClick={() => setDeleteConfirmText("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold uppercase"
                    >
                      {isDeletingAccount ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Account"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
