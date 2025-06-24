import { motion } from "framer-motion";
import { Users, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServerWithOwner } from "@shared/schema";

interface ServerCardProps {
  server: ServerWithOwner;
  onJoin?: (serverId: number) => void;
  isJoining?: boolean;
}

export function ServerCard({ server, onJoin, isJoining }: ServerCardProps) {
  const getServerIcon = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getGradientClass = (category: string) => {
    const gradients = {
      Gaming: "from-purple-500 to-pink-500",
      Technology: "from-blue-500 to-cyan-500",
      "Art & Design": "from-pink-500 to-red-500",
      Music: "from-green-500 to-emerald-500",
      Education: "from-yellow-500 to-orange-500",
      Sports: "from-indigo-500 to-purple-500",
      Business: "from-gray-500 to-gray-700",
      Other: "from-slate-500 to-slate-600",
    };
    return gradients[category as keyof typeof gradients] || gradients.Other;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-16 h-16 bg-gradient-to-br ${getGradientClass(server.category)} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
          {getServerIcon(server.name)}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">{server.name}</h3>
          <p className="text-sm text-gray-500">{server.category}</p>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {server.description || "No description available"}
      </p>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {server.memberCount?.toLocaleString() || "0"}
          </span>
          <span className="flex items-center">
            <Circle className="w-2 h-2 mr-1 text-green-500 fill-current" />
            {Math.floor((server.memberCount || 0) * 0.2)} online
          </span>
        </div>
      </div>
      
      <Button 
        onClick={() => onJoin?.(server.id)}
        disabled={isJoining}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isJoining ? "Joining..." : "Join Server"}
      </Button>
    </motion.div>
  );
}
