import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ServerCard } from "@/components/server-card";
import type { ServerWithOwner } from "@shared/schema";

interface ServerBrowserProps {
  onBack: () => void;
}

export default function ServerBrowser({ onBack }: ServerBrowserProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery<ServerWithOwner[]>({
    queryKey: ["/api/servers/discover", { category, search, sortBy }],
    refetchOnWindowFocus: false,
  });

  const joinServerMutation = useMutation({
    mutationFn: async (serverId: number) => {
      const response = await apiRequest("POST", `/api/servers/${serverId}/join`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/servers/discover"] });
      toast({
        title: "Success",
        description: "Successfully joined the server!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join server",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Gaming",
    "Technology", 
    "Art & Design",
    "Music",
    "Education",
    "Sports",
    "Business",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discover Servers</h1>
              <p className="text-gray-600">Find communities that match your interests</p>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search servers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Recently Created</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Server Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onJoin={joinServerMutation.mutate}
                isJoining={joinServerMutation.isPending}
              />
            ))}
          </div>
        )}

        {!isLoading && servers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No servers found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or create a new server.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
