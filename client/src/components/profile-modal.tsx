import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    status: "🟢 Online",
    customStatus: "",
    theme: "light",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        bio: user.bio || "",
        status: user.status || "🟢 Online",
        customStatus: user.customStatus || "",
        theme: user.theme || "light",
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const response = await apiRequest("PATCH", "/api/user", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };

  const displayName = `${formData.firstName} ${formData.lastName}`.trim() || "User";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="relative inline-block mb-4">
              <img 
                src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=150&background=6366f1&color=ffffff`}
                alt="Profile picture" 
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-2xl font-bold">Edit Profile</h2>
            <p className="text-gray-600 text-sm font-normal">Customize your community presence</p>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell people about yourself..."
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="resize-none"
            />
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="🟢 Online">🟢 Online</SelectItem>
                <SelectItem value="🟡 Away">🟡 Away</SelectItem>
                <SelectItem value="🔴 Do Not Disturb">🔴 Do Not Disturb</SelectItem>
                <SelectItem value="⚫ Invisible">⚫ Invisible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="customStatus">Custom Status</Label>
            <Input
              id="customStatus"
              placeholder="What's happening?"
              value={formData.customStatus}
              onChange={(e) => setFormData({ ...formData, customStatus: e.target.value })}
            />
          </div>
          
          <div>
            <Label>Theme Preferences</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: "light" })}
                className={`p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors ${
                  formData.theme === "light" ? "border-primary" : "border-gray-300"
                }`}
              >
                <div className="w-full h-12 bg-white border border-gray-300 rounded mb-2"></div>
                <p className="text-sm font-medium">Light</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: "dark" })}
                className={`p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors ${
                  formData.theme === "dark" ? "border-primary" : "border-gray-300"
                }`}
              >
                <div className="w-full h-12 bg-gray-800 rounded mb-2"></div>
                <p className="text-sm font-medium">Dark</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: "gradient" })}
                className={`p-4 border-2 rounded-lg bg-white hover:bg-gray-50 transition-colors ${
                  formData.theme === "gradient" ? "border-primary" : "border-gray-300"
                }`}
              >
                <div className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded mb-2"></div>
                <p className="text-sm font-medium">Gradient</p>
              </button>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
              className="flex-1"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
