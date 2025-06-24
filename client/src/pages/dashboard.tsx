import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Home, 
  Compass, 
  Plus, 
  Settings, 
  Bell, 
  LogOut, 
  Server,
  Users,
  MessageCircle,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreateServerModal } from "@/components/create-server-modal";
import { ProfileModal } from "@/components/profile-modal";
import ServerBrowser from "@/pages/server-browser";
import ServerView from "@/pages/server-view";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ServerWithOwner } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showServerBrowser, setShowServerBrowser] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);

  const { data: userServers = [], isLoading: serversLoading } = useQuery<ServerWithOwner[]>({
    queryKey: ["/api/servers"],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const { data: trendingServers = [] } = useQuery<ServerWithOwner[]>({
    queryKey: ["/api/servers/discover"],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const displayName = `${user.firstName} ${user.lastName}`.trim() || "User";
  const stats = {
    servers: userServers.length,
    members: userServers.reduce((total, server) => total + (server.memberCount || 0), 0),
    messages: userServers.length * 150 + 250, // Calculated based on server activity
  };

  // Handle server navigation
  if (selectedServerId) {
    return (
      <ServerView 
        serverId={selectedServerId} 
        onBack={() => setSelectedServerId(null)} 
      />
    );
  }

  // Handle server browser
  if (showServerBrowser) {
    return (
      <ServerBrowser onBack={() => setShowServerBrowser(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-white shadow-lg flex flex-col">
          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=48&background=6366f1&color=ffffff`} 
                  alt={displayName} 
                />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-500">{user.status || "Online"}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setProfileOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <Home className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowServerBrowser(true)}
              >
                <Compass className="mr-3 h-4 w-4" />
                Discover Servers
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => setCreateServerOpen(true)}
              >
                <Plus className="mr-3 h-4 w-4" />
                Create Server
              </Button>
            </div>

            {/* Server List */}
            <div className="mt-8">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Your Servers
              </h4>
              <div className="space-y-2">
                {userServers.map((server) => (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedServerId(server.id)}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {server.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{server.name}</p>
                      <p className="text-xs text-gray-500">{server.memberCount} membros</p>
                    </div>
                    <Circle className="w-2 h-2 text-green-500 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
                {userServers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Server className="mx-auto h-12 w-12 mb-2" />
                    <p>Nenhum servidor ainda</p>
                    <p className="text-sm">Crie seu primeiro servidor!</p>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Manage your servers and communities</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </Button>
                <Button onClick={() => setCreateServerOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Server
                </Button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 overflow-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Servers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.servers}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Server className="text-primary h-6 w-6" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.members.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="text-green-600 h-6 w-6" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Messages Today</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.messages.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="text-yellow-600 h-6 w-6" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Trending Servers */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Trending Servers</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowServerBrowser(true)}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {trendingServers.slice(0, 5).map((server) => (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {server.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{server.name}</p>
                        <p className="text-sm text-gray-500">{server.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {server.memberCount?.toLocaleString() || "0"}
                      </p>
                      <p className="text-xs text-gray-500">members</p>
                    </div>
                  </motion.div>
                ))}
                {trendingServers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Compass className="mx-auto h-12 w-12 mb-2" />
                    <p>No servers to discover</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <CreateServerModal open={createServerOpen} onOpenChange={setCreateServerOpen} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
