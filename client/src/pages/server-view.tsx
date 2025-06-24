import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Hash,
  Settings,
  UserPlus,
  Volume2,
  Mic,
  MicOff,
  Headphones,
  Users,
  Crown,
  Shield,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ServerWithOwner, User } from "@shared/schema";

interface ServerViewProps {
  serverId: number;
  onBack: () => void;
}

export default function ServerView({ serverId, onBack }: ServerViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const { data: server, isLoading: serverLoading } = useQuery<ServerWithOwner>({
    queryKey: ["/api/servers", serverId],
    enabled: !!serverId,
  });

  const { data: members = [] } = useQuery<User[]>({
    queryKey: ["/api/servers", serverId, "members"],
    enabled: !!serverId,
  });

  if (serverLoading || !server) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const displayName = `${user?.firstName} ${user?.lastName}`.trim() || "User";
  const onlineMembers = members.filter(() => Math.random() > 0.6); // Simulate online status

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Server Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        {/* Server Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h2 className="text-white font-bold text-lg truncate">{server.name}</h2>
          <p className="text-gray-400 text-sm">{members.length} membros</p>
        </div>

        {/* Channels */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Canais de Texto
            </h3>
            <div className="space-y-1">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center px-2 py-2 text-gray-300 hover:bg-gray-700 rounded cursor-pointer"
              >
                <Hash className="h-4 w-4 mr-2" />
                <span>geral</span>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center px-2 py-2 text-gray-300 hover:bg-gray-700 rounded cursor-pointer"
              >
                <Hash className="h-4 w-4 mr-2" />
                <span>anúncios</span>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center px-2 py-2 text-gray-300 hover:bg-gray-700 rounded cursor-pointer"
              >
                <Hash className="h-4 w-4 mr-2" />
                <span>dúvidas</span>
              </motion.div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Canais de Voz
            </h3>
            <div className="space-y-1">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center px-2 py-2 text-gray-300 hover:bg-gray-700 rounded cursor-pointer"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                <span>Sala Geral</span>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center px-2 py-2 text-gray-300 hover:bg-gray-700 rounded cursor-pointer"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                <span>Jogos</span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* User Panel */}
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=32&background=6366f1&color=ffffff`} 
                  alt={displayName} 
                />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{displayName}</p>
                <p className="text-gray-400 text-xs">{user?.status || "Online"}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={`h-8 w-8 p-0 ${isMuted ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeafened(!isDeafened)}
                className={`h-8 w-8 p-0 ${isDeafened ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
              >
                <Headphones className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <Hash className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">geral</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 bg-white p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Hash className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo ao #{server.name}!</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Este é o início da sua conversa no canal #geral. Seja respeitoso e divirta-se!
              </p>
              
              {/* Sample Messages */}
              {server.owner && (
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={server.owner.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(server.owner.firstName || 'Owner')}&size=40&background=6366f1&color=ffffff`} />
                      <AvatarFallback>{(server.owner.firstName || 'O').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900 flex items-center">
                          {server.owner.firstName || 'Owner'}
                          <Crown className="h-4 w-4 ml-1 text-yellow-500" />
                        </span>
                        <span className="text-xs text-gray-500">hoje às 10:30</span>
                      </div>
                      <p className="text-gray-700">Sejam bem-vindos ao servidor! 🎉</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <input
                type="text"
                placeholder="Enviar mensagem para #geral"
                className="w-full bg-transparent border-0 focus:outline-none text-gray-900 placeholder-gray-500"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-64 bg-gray-50 border-l border-gray-200">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Membros — {members.length}</h3>
          
          {/* Online Members */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Online — {onlineMembers.length}
            </h4>
            <div className="space-y-2">
              {onlineMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName || 'User')}&size=32&background=6366f1&color=ffffff`} 
                        alt={member.firstName || 'User'} 
                      />
                      <AvatarFallback>{(member.firstName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 flex items-center">
                      {member.firstName || 'User'}
                      {member.id === server.ownerId && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
                    </p>
                    <p className="text-xs text-gray-500">{member.customStatus || 'Online'}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Offline Members */}
          {members.length > onlineMembers.length && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Offline — {members.length - onlineMembers.length}
              </h4>
              <div className="space-y-2">
                {members.filter(m => !onlineMembers.includes(m)).slice(0, 5).map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (onlineMembers.length + index) * 0.1 }}
                    className="flex items-center space-x-3 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer opacity-60"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={member.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName || 'User')}&size=32&background=6366f1&color=ffffff`} 
                        alt={member.firstName || 'User'} 
                      />
                      <AvatarFallback>{(member.firstName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 flex items-center">
                        {member.firstName || 'User'}
                        {member.id === server.ownerId && <Crown className="h-3 w-3 ml-1 text-yellow-500" />}
                      </p>
                      <p className="text-xs text-gray-500">Offline</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}