import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ServerWithOwner, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Hash, Volume2, VolumeX, Headphones, Mic, MicOff, Settings, Crown, Users, UserPlus, Menu, X } from "lucide-react";

interface ServerViewProps {
  serverId: number;
  onBack: () => void;
}

export default function ServerView({ serverId, onBack }: ServerViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isChannelSidebarOpen, setIsChannelSidebarOpen] = useState(false);
  const [isMemberSidebarOpen, setIsMemberSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sistema de drag para sidebars com touch e mouse
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      
      const deltaX = clientX - dragStartX;
      const deltaY = Math.abs(clientY - dragStartY);
      
      // Verificar se é um movimento horizontal (não vertical)
      if (deltaY > 50) {
        setIsDragging(false);
        return;
      }
      
      // Arrastar da esquerda para direita abre sidebar de canais
      if (deltaX > 50 && !isChannelSidebarOpen) {
        setIsChannelSidebarOpen(true);
        setIsMemberSidebarOpen(false); // Fecha o outro menu
        setIsDragging(false);
      }
      // Arrastar da direita para esquerda abre sidebar de membros  
      else if (deltaX < -50 && !isMemberSidebarOpen) {
        setIsMemberSidebarOpen(true);
        setIsChannelSidebarOpen(false); // Fecha o outro menu
        setIsDragging(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStartX, dragStartY, isChannelSidebarOpen, isMemberSidebarOpen]);

  const handleStart = (clientX: number, clientY: number, target: EventTarget | null) => {
    // Apenas inicia drag se não estiver clicando em botões ou elementos interativos
    if ((target as HTMLElement)?.closest('button, input, textarea, select, a')) {
      return;
    }
    
    setIsDragging(true);
    setDragStartX(clientX);
    setDragStartY(clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY, e.target);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  };

  const { data: server, isLoading: serverLoading } = useQuery<ServerWithOwner>({
    queryKey: ["/api/servers", serverId],
    enabled: !!serverId,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/servers", serverId, "members"],
    enabled: !!serverId,
  });

  const queryClient = useQueryClient();

  const joinServerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/servers/${serverId}/join`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to join server");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "members"] });
      toast({
        title: "Sucesso",
        description: "Você entrou no servidor!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao entrar no servidor",
        variant: "destructive",
      });
    },
  });

  if (serverLoading || !server) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || "User" : "User";
  const onlineMembers = members.filter(() => Math.random() > 0.6); // Simulate online status

  return (
    <div 
      ref={containerRef}
      className="h-screen flex bg-gray-100 relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Drag zone esquerda sempre visível */}
      <div 
        className="absolute left-0 top-0 w-6 h-full bg-transparent z-50 flex items-center justify-center cursor-pointer"
        onMouseDown={(e) => {
          if (!isChannelSidebarOpen) {
            e.stopPropagation();
            handleStart(e.clientX, e.clientY, e.target);
          }
        }}
        onTouchStart={(e) => {
          if (!isChannelSidebarOpen && e.touches.length === 1) {
            e.stopPropagation();
            handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
          }
        }}
      >
        {!isChannelSidebarOpen && (
          <div className="w-1 h-12 bg-gray-400 rounded-full opacity-40 hover:opacity-70 transition-opacity" />
        )}
      </div>

      {/* Drag zone direita sempre visível */}
      <div 
        className="absolute right-0 top-0 w-6 h-full bg-transparent z-50 flex items-center justify-center cursor-pointer"
        onMouseDown={(e) => {
          if (!isMemberSidebarOpen) {
            e.stopPropagation();
            handleStart(e.clientX, e.clientY, e.target);
          }
        }}
        onTouchStart={(e) => {
          if (!isMemberSidebarOpen && e.touches.length === 1) {
            e.stopPropagation();
            handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
          }
        }}
      >
        {!isMemberSidebarOpen && (
          <div className="w-1 h-12 bg-gray-400 rounded-full opacity-40 hover:opacity-70 transition-opacity" />
        )}
      </div>

      {/* Channel Sidebar */}
      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ 
          width: isChannelSidebarOpen ? 240 : 0,
          opacity: isChannelSidebarOpen ? 1 : 0
        }}
        transition={{ 
          width: { duration: 0.3, ease: "easeInOut" },
          opacity: { duration: 0.2, delay: isChannelSidebarOpen ? 0.1 : 0 }
        }}
        className="bg-gray-800 flex flex-col overflow-hidden relative shadow-lg"
        style={{ minWidth: isChannelSidebarOpen ? 240 : 0 }}
      >
        {isChannelSidebarOpen && (
          <>
            {/* Server Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsChannelSidebarOpen(false)} 
                  className="text-gray-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-white font-bold text-lg truncate">{server.name}</h2>
              <p className="text-gray-400 text-sm">{members.length} membros</p>
            </div>

            {/* Channels */}
            <div className="flex-1 p-4 space-y-4">
              <div>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                  Canais de Texto
                </h3>
                <div className="space-y-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white bg-gray-700"
                  >
                    <Hash className="h-4 w-4" />
                    <span className="text-sm">geral</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white"
                  >
                    <Hash className="h-4 w-4" />
                    <span className="text-sm">anúncios</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white"
                  >
                    <Hash className="h-4 w-4" />
                    <span className="text-sm">random</span>
                  </motion.div>
                </div>
              </div>

              <div>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                  Canais de Voz
                </h3>
                <div className="space-y-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Sala Geral</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Gaming</span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* User Panel */}
            <div className="p-4 bg-gray-900 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={(user?.profileImageUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=32&background=6366f1&color=ffffff`}
                      alt={displayName}
                    />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{displayName}</p>
                    <p className="text-gray-400 text-xs">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`text-gray-400 hover:text-white ${isMuted ? 'text-red-400' : ''}`}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeafened(!isDeafened)}
                    className={`text-gray-400 hover:text-white ${isDeafened ? 'text-red-400' : ''}`}
                  >
                    {isDeafened ? <VolumeX className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Overlay para fechar menu de membros */}
      {isMemberSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMemberSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div 
        className="flex-1 flex flex-col"
        onClick={() => {
          // Fechar sidebars ao clicar na área principal
          if (isChannelSidebarOpen) {
            setIsChannelSidebarOpen(false);
          }
        }}
      >
        {/* Chat Header */}
        <div className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            {!isChannelSidebarOpen && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsChannelSidebarOpen(true);
                  setIsMemberSidebarOpen(false);
                }}
                className="mr-3"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Hash className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">geral</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setIsMemberSidebarOpen(!isMemberSidebarOpen);
                if (!isMemberSidebarOpen) {
                  setIsChannelSidebarOpen(false);
                }
              }}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl mx-auto flex items-center justify-center">
                  <Hash className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Bem-vindo ao #{server.name}!
                  </h2>
                  <p className="text-gray-600">
                    Este é o início do canal #{server.name}. 
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Sample Messages */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start space-x-4"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={(server.owner?.profileImageUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(server.owner?.firstName || 'Owner')}&size=40&background=6366f1&color=ffffff`}
                    alt={server.owner?.firstName || 'Owner'}
                  />
                  <AvatarFallback>{(server.owner?.firstName || 'O').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-gray-900 flex items-center">
                      {server.owner?.firstName || 'Owner'}
                      <Crown className="h-3 w-3 ml-1 text-yellow-500" />
                    </span>
                    <span className="text-xs text-gray-500">Hoje às 12:00</span>
                  </div>
                  <p className="text-gray-700">
                    Bem-vindos ao nosso servidor! 🎉 Sintam-se à vontade para conversar e se divertir!
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder={`Enviar mensagem para #geral`}
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
              />
              <Button size="sm">Enviar</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ 
          x: isMemberSidebarOpen ? 0 : 300,
          opacity: isMemberSidebarOpen ? 1 : 0
        }}
        transition={{ 
          x: { duration: 0.3, ease: "easeInOut" },
          opacity: { duration: 0.2, delay: isMemberSidebarOpen ? 0.1 : 0 }
        }}
        className="fixed right-0 top-0 h-full w-80 bg-gray-50 border-l border-gray-200 shadow-xl z-40"
      >
        {isMemberSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="h-full flex flex-col w-full"
          >
            {/* Members Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900 font-semibold text-lg">Membros do Servidor</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsMemberSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">{members.length} total • {onlineMembers.length} online</p>
            </div>

            {/* Online Members */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Online — {onlineMembers.length}
                </h4>
                <div className="space-y-2">
                  {onlineMembers.map((member, index) => (
                    <motion.div
                      key={`online-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName || 'User')}&size=32&background=random`}
                            alt={member.firstName || 'User'}
                          />
                          <AvatarFallback>{(member.firstName || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Online</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Offline Members */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Offline — {members.length - onlineMembers.length}
                </h4>
                <div className="space-y-2">
                  {members.filter((_, i) => !onlineMembers.includes(members[i])).map((member, index) => (
                    <motion.div
                      key={`offline-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (onlineMembers.length + index) * 0.05 }}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer opacity-60 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName || 'User')}&size=32&background=random`}
                            alt={member.firstName || 'User'}
                          />
                          <AvatarFallback>{(member.firstName || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Offline</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}