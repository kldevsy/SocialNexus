import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ServerWithOwner, User, Channel, ServerWithChannels } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Hash, Volume2, VolumeX, Headphones, Mic, MicOff, Settings, Crown, Users, UserPlus, Menu, X, Plus, Trash2, PhoneCall, PhoneOff } from "lucide-react";
import { CreateChannelModal } from "@/components/create-channel-modal";
import { VoiceControlPanel } from "@/components/voice-control-panel";

interface ServerViewProps {
  serverId: number;
  onBack: () => void;
}

export default function ServerView({ serverId, onBack }: ServerViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isChannelSidebarOpen, setIsChannelSidebarOpen] = useState(false);
  const [isMemberSidebarOpen, setIsMemberSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  
  // Voice chat functionality
  const {
    isConnected: isVoiceConnected,
    currentChannelId: currentVoiceChannelId,
    voiceUsers,
    userCount: voiceUserCount,
    isMuted: isVoiceMuted,
    isDeafened: isVoiceDeafened,
    showControlPanel,
    stream: voiceStream,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute: toggleVoiceMute,
    toggleDeafen: toggleVoiceDeafen,
    setShowControlPanel
  } = useVoiceChat();

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

  const { data: server, isLoading: serverLoading, error: serverError } = useQuery({
    queryKey: ["/api/servers", serverId],
    queryFn: async () => {
      const response = await fetch(`/api/servers/${serverId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch server`);
      }
      return response.json() as Promise<ServerWithChannels & { members: User[] }>;
    },
  });

  // Prepare data - this must be done before any conditional returns
  const members = server?.members || [];
  const channels = server?.channels || [];
  const textChannels = channels.filter(channel => channel.type === "text");
  const voiceChannels = channels.filter(channel => channel.type === "voice");
  const isOwner = user?.id === server?.ownerId;
  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.username || user?.email || 'Usuario';

  // Set default channel if none selected and channels exist
  useEffect(() => {
    if (!selectedChannelId && textChannels.length > 0) {
      setSelectedChannelId(textChannels[0].id);
    }
  }, [selectedChannelId, textChannels]);

  // Get the currently selected channel
  const selectedChannel = selectedChannelId 
    ? channels.find(ch => ch.id === selectedChannelId)
    : textChannels[0] || null;

  // All mutations must be defined before any conditional returns
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: number) => {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Canal deletado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] });
      // Reset selected channel if it was deleted
      const remainingChannels = textChannels.filter(c => c.id !== selectedChannelId);
      setSelectedChannelId(remainingChannels[0]?.id || null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar canal",
        description: error?.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const joinServerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/servers/${serverId}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entrou no servidor com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] });
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao entrar no servidor",
        description: error?.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const handleDeleteChannel = (channelId: number) => {
    if (confirm("Tem certeza que deseja deletar este canal? Esta ação não pode ser desfeita.")) {
      deleteChannelMutation.mutate(channelId);
    }
  };

  const handleJoinVoiceChannel = (channelId: number) => {
    if (currentVoiceChannelId === channelId) {
      leaveVoiceChannel();
    } else {
      joinVoiceChannel(channelId);
    }
  };

  // Handle server loading and error states AFTER all hooks are defined
  if (serverLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando servidor...</p>
        </div>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar servidor</h3>
          <p className="text-gray-600 mb-4">{serverError.message}</p>
          <button 
            onClick={onBack}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Servidor não encontrado</h3>
          <p className="text-gray-600 mb-4">Este servidor pode ter sido removido ou você não tem permissão para acessá-lo.</p>
          <button 
            onClick={onBack}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

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
            <div className="flex-1 p-4 space-y-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
              {/* Text Channels Section */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                    <Hash className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">
                    Canais de Texto
                  </h3>
                </div>
                <div className="space-y-2">
                  {textChannels.map((channel, index) => (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 6 }}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-md ${
                        selectedChannelId === channel.id
                          ? "bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300"
                          : "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200"
                      }`}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                        <Hash className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 flex-1">
                        {channel.name}
                      </span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChannel(channel.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </motion.div>
                  ))}
                  
                  {isOwner && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: textChannels.length * 0.05 }}
                      whileHover={{ scale: 1.02, x: 6 }}
                      onClick={() => setIsCreateChannelModalOpen(true)}
                      className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 group bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 shadow-sm hover:shadow-md border-dashed"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md flex items-center justify-center shadow-sm">
                        <Plus className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-600 group-hover:text-green-700 flex-1">
                        Criar Canal
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Voice Channels Section */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                    <Volume2 className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">
                    Canais de Voz
                  </h3>
                </div>
                <div className="space-y-2">
                  {voiceChannels.map((channel, index) => (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (textChannels.length + index) * 0.05 }}
                      whileHover={{ scale: 1.02, x: 6 }}
                      onClick={() => {
                        if (currentVoiceChannelId === channel.id) {
                          leaveVoiceChannel();
                        } else {
                          joinVoiceChannel(channel.id);
                        }
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-md ${
                        currentVoiceChannelId === channel.id
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300"
                          : "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                        currentVoiceChannelId === channel.id
                          ? "bg-gradient-to-br from-green-500 to-green-600"
                          : "bg-gradient-to-br from-purple-500 to-purple-600"
                      }`}>
                        {currentVoiceChannelId === channel.id ? (
                          <PhoneCall className="h-4 w-4 text-white" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-purple-700">
                          {channel.name}
                        </span>
                        {channel.description && (
                          <p className="text-xs text-gray-500 group-hover:text-purple-500">
                            {channel.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChannel(channel.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                          currentVoiceChannelId === channel.id ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}></div>
                        <span className="text-xs text-gray-500 font-medium">
                          {currentVoiceChannelId === channel.id ? voiceUserCount : "0"}/∞
                        </span>
                        {currentVoiceChannelId === channel.id && (
                          <span className="text-xs text-green-600 font-medium">Conectado</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 w-8 h-8 p-0 rounded-lg"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
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
                    onClick={() => currentVoiceChannelId ? toggleVoiceMute() : setIsMuted(!isMuted)}
                    className={`text-gray-400 hover:text-white ${
                      currentVoiceChannelId ? (isVoiceMuted ? 'text-red-400' : 'text-green-400') : (isMuted ? 'text-red-400' : '')
                    }`}
                    title={currentVoiceChannelId ? "Controle de voz ativo" : "Controle local"}
                  >
                    {currentVoiceChannelId ? (isVoiceMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />) : (isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => currentVoiceChannelId ? toggleVoiceDeafen() : setIsDeafened(!isDeafened)}
                    className={`text-gray-400 hover:text-white ${
                      currentVoiceChannelId ? (isVoiceDeafened ? 'text-red-400' : 'text-green-400') : (isDeafened ? 'text-red-400' : '')
                    }`}
                    title={currentVoiceChannelId ? "Controle de áudio ativo" : "Controle local"}
                  >
                    {currentVoiceChannelId ? (isVoiceDeafened ? <VolumeX className="h-4 w-4" /> : <Headphones className="h-4 w-4" />) : (isDeafened ? <VolumeX className="h-4 w-4" /> : <Headphones className="h-4 w-4" />)}
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
            {selectedChannel?.type === "voice" ? (
              <Volume2 className="h-5 w-5 text-gray-500" />
            ) : (
              <Hash className="h-5 w-5 text-gray-500" />
            )}
            <h3 className="font-semibold text-gray-900">
              {selectedChannel?.name || "Selecione um canal"}
            </h3>
            {selectedChannel?.description && (
              <span className="text-sm text-gray-500 ml-2">
                - {selectedChannel.description}
              </span>
            )}
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
            {selectedChannel ? (
              <>
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                    key={selectedChannel.id}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl mx-auto flex items-center justify-center">
                      {selectedChannel.type === "voice" ? (
                        <Volume2 className="h-8 w-8 text-white" />
                      ) : (
                        <Hash className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Bem-vindo ao #{selectedChannel.name}!
                      </h2>
                      <p className="text-gray-600">
                        {selectedChannel.description || `Este é o início do canal #${selectedChannel.name}.`}
                      </p>
                      {selectedChannel.type === "voice" && (
                        <p className="text-sm text-purple-600 mt-2">
                          🎤 Canal de voz - Clique para entrar na conversa
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-300 rounded-xl mx-auto flex items-center justify-center mb-4">
                  <Hash className="h-8 w-8 text-gray-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-500 mb-2">
                  Nenhum canal selecionado
                </h2>
                <p className="text-gray-400">
                  Abra o menu lateral e selecione um canal para começar
                </p>
              </div>
            )}

            {/* Sample Messages */}
            {selectedChannel && selectedChannel.type === "text" && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start space-x-4"
                  key={`${selectedChannel.id}-welcome`}
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
                      Bem-vindos ao canal #{selectedChannel.name}! 
                      {selectedChannel.name === textChannels[0]?.name 
                        ? " 🎉 Sintam-se à vontade para conversar e se divertir!" 
                        : " Este é um ótimo lugar para conversas!"
                      }
                    </p>
                  </div>
                </motion.div>

                {/* Sample channel-specific message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-start space-x-4"
                  key={`${selectedChannel.id}-sample`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={`https://ui-avatars.com/api/?name=Bot&size=40&background=22c55e&color=ffffff`}
                      alt="Bot"
                    />
                    <AvatarFallback>🤖</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">CommunityBot</span>
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">BOT</span>
                      <span className="text-xs text-gray-500">Hoje às 12:01</span>
                    </div>
                    <p className="text-gray-700">
                      📝 Você está agora no canal <strong>#{selectedChannel.name}</strong>
                      {selectedChannel.description && (
                        <><br />📋 <em>{selectedChannel.description}</em></>
                      )}
                    </p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Voice Channel UI */}
            {selectedChannel && selectedChannel.type === "voice" && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center"
                  key={`${selectedChannel.id}-voice`}
                >
                  <Volume2 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-purple-900 mb-2">
                    Canal de Voz: {selectedChannel.name}
                  </h3>
                  <p className="text-purple-700 mb-4">
                    {selectedChannel.description || "Conecte-se para conversar por voz com outros membros"}
                  </p>
                  {currentVoiceChannelId === selectedChannel.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-4">
                        <Button 
                          variant={isVoiceMuted ? "destructive" : "outline"}
                          onClick={toggleVoiceMute}
                          className="flex items-center space-x-2"
                        >
                          {isVoiceMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          <span>{isVoiceMuted ? "Desmutar" : "Mutar"}</span>
                        </Button>
                        
                        <Button 
                          variant={isVoiceDeafened ? "destructive" : "outline"}
                          onClick={toggleVoiceDeafen}
                          className="flex items-center space-x-2"
                        >
                          {isVoiceDeafened ? <VolumeX className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                          <span>{isVoiceDeafened ? "Ouvir" : "Ensurdecer"}</span>
                        </Button>
                        
                        <Button 
                          variant="destructive"
                          onClick={() => leaveVoiceChannel()}
                          className="flex items-center space-x-2"
                        >
                          <PhoneOff className="h-4 w-4" />
                          <span>Desconectar</span>
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-purple-600">
                          🎤 Conectado ao canal • {voiceUserCount} usuário{voiceUserCount !== 1 ? 's' : ''} online
                        </p>
                        <div className="flex items-center justify-center mt-2 space-x-2">
                          <div className={`w-2 h-2 rounded-full ${isVoiceConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <span className={`text-xs ${isVoiceConnected ? 'text-green-600' : 'text-red-500'}`}>
                            {isVoiceConnected ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                      </div>
                      
                      {voiceUsers.length > 0 && (
                        <div className="bg-purple-100 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-purple-900 mb-2">Usuários no canal:</h4>
                          <div className="space-y-2">
                            {voiceUsers.map(user => (
                              <div key={user.userId} className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-purple-700">{user.userName}</span>
                                {user.isMuted && <MicOff className="h-3 w-3 text-red-500" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                      onClick={() => joinVoiceChannel(selectedChannel.id)}
                      disabled={!isVoiceConnected}
                    >
                      <PhoneCall className="h-4 w-4 mr-2" />
                      {!isVoiceConnected ? "Conectando..." : "Conectar ao Canal"}
                    </Button>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        {selectedChannel && selectedChannel.type === "text" && (
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder={`Enviar mensagem para #${selectedChannel.name}`}
                  className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500"
                />
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        )}
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
      
      {/* Create Channel Modal */}
      <CreateChannelModal
        open={isCreateChannelModalOpen}
        onOpenChange={setIsCreateChannelModalOpen}
        serverId={serverId}
      />

      {/* Voice Control Panel */}
      {showControlPanel && currentVoiceChannelId && (
        <VoiceControlPanel
          isConnected={isVoiceConnected}
          channelName={channels.find(ch => ch.id === currentVoiceChannelId)?.name || "Canal"}
          userCount={voiceUserCount}
          isMuted={isVoiceMuted}
          isDeafened={isVoiceDeafened}
          onToggleMute={toggleVoiceMute}
          onToggleDeafen={toggleVoiceDeafen}
          onDisconnect={leaveVoiceChannel}
          onClose={() => setShowControlPanel(false)}
          stream={voiceStream}
        />
      )}
    </div>
  );
}