import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { 
  Hash, 
  Volume2, 
  Users, 
  Clock, 
  MessageSquare, 
  Crown,
  Mic,
  MicOff,
  Headphones,
  HeadphonesIcon
} from "lucide-react";
import type { Channel, MessageWithAuthor, User } from "@shared/schema";

interface ChannelPreviewCardProps {
  channel: Channel;
  children: React.ReactNode;
  delay?: number;
}

export function ChannelPreviewCard({ channel, children, delay = 300 }: ChannelPreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  // Fetch recent messages for text channels
  const { data: recentMessages = [] } = useQuery<MessageWithAuthor[]>({
    queryKey: [`/api/channels/${channel.id}/messages`],
    enabled: isHovered && channel.type === 'text',
    staleTime: 30000,
  });

  // Fetch channel members for voice channels
  const { data: voiceMembers = [] } = useQuery<User[]>({
    queryKey: [`/api/channels/${channel.id}/voice-members`],
    enabled: isHovered && channel.type === 'voice',
    staleTime: 10000,
  });

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      const timer = setTimeout(() => {
        setShowPreview(true);
      }, delay);
      setHoverTimer(timer);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setShowPreview(false);
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      setIsTouched(true);
      setIsHovered(true);
      
      // Timer para long press
      const timer = setTimeout(() => {
        setShowPreview(true);
      }, 500); // Toque longo de 500ms
      
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isMobile) {
      // Limpa o timer se o usuário soltar antes do tempo
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      
      // Se o preview já estava ativo, esconde após 3 segundos
      if (showPreview) {
        setTimeout(() => {
          setIsTouched(false);
          setIsHovered(false);
          setShowPreview(false);
        }, 3000);
      } else {
        // Reset imediato se não ativou o preview
        setIsTouched(false);
        setIsHovered(false);
      }
    }
  };

  // Função para clique duplo rápido no mobile
  const handleDoubleTouch = () => {
    if (isMobile) {
      setIsTouched(true);
      setIsHovered(true);
      setShowPreview(true);
      
      // Auto-esconde após 4 segundos
      setTimeout(() => {
        setIsTouched(false);
        setIsHovered(false);
        setShowPreview(false);
      }, 4000);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [hoverTimer, longPressTimer]);

  const getChannelIcon = () => {
    return channel.type === 'voice' ? (
      <Volume2 className="h-4 w-4" />
    ) : (
      <Hash className="h-4 w-4" />
    );
  };

  const getLastActivity = () => {
    if (channel.type === 'text' && recentMessages.length > 0) {
      const lastMessage = recentMessages[0] as MessageWithAuthor;
      const timeAgo = new Date(lastMessage.createdAt).toLocaleString();
      return `Última mensagem: ${timeAgo}`;
    }
    return channel.type === 'voice' ? 'Canal de voz' : 'Canal de texto';
  };

  const renderTextChannelPreview = () => (
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            {recentMessages.length} mensagens
          </Badge>
          <span className="text-xs text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            {getLastActivity()}
          </span>
        </div>

        {recentMessages.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Mensagens recentes:</div>
            {(recentMessages as MessageWithAuthor[]).slice(0, 3).map((message: MessageWithAuthor) => (
              <div key={message.id} className="flex items-start space-x-2 p-2 rounded bg-muted/50">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={message.author.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {message.author.firstName?.[0] || message.author.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium truncate">
                      {message.author.firstName || message.author.email?.split('@')[0] || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {message.content || (message.embedData ? '📎 Embed' : '📷 Imagem')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(recentMessages as MessageWithAuthor[]).length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-xs">Nenhuma mensagem ainda</div>
            <div className="text-xs">Seja o primeiro a conversar!</div>
          </div>
        )}
      </div>
    </CardContent>
  );

  const renderVoiceChannelPreview = () => (
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {voiceMembers.length} conectados
          </Badge>
          <Badge 
            variant={voiceMembers.length > 0 ? "default" : "outline"} 
            className="text-xs"
          >
            {voiceMembers.length > 0 ? 'Ativo' : 'Vazio'}
          </Badge>
        </div>

        {voiceMembers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Usuários conectados:</div>
            {voiceMembers.slice(0, 5).map((member: User) => (
              <div key={member.id} className="flex items-center space-x-2 p-2 rounded bg-muted/50">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.firstName?.[0] || member.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {member.firstName || member.email?.split('@')[0] || 'Usuário'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Mic className="h-3 w-3 text-green-500" />
                    <Headphones className="h-3 w-3 text-blue-500" />
                  </div>
                </div>
              </div>
            ))}
            {voiceMembers.length > 5 && (
              <div className="text-xs text-muted-foreground text-center">
                +{voiceMembers.length - 5} outros usuários
              </div>
            )}
          </div>
        )}

        {voiceMembers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-xs">Canal vazio</div>
            <div className="text-xs">Clique para entrar!</div>
          </div>
        )}
      </div>
    </CardContent>
  );

  return (
    <div className="relative">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={isMobile ? handleDoubleTouch : undefined}
        className="w-full"
      >
        {children}
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute ${
              isMobile 
                ? "left-1/2 transform -translate-x-1/2 top-full mt-2 w-72 z-[9999]" 
                : "left-full ml-2 top-0 w-80 z-50"
            }`}
            style={{ 
              pointerEvents: 'none',
              zIndex: isMobile ? 9999 : 50
            }}
          >
            <Card className="shadow-lg border bg-background/95 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  {getChannelIcon()}
                  <span className="font-medium">{channel.name}</span>
                </CardTitle>
                {channel.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {channel.description}
                  </p>
                )}
              </CardHeader>

              {channel.type === 'text' ? renderTextChannelPreview() : renderVoiceChannelPreview()}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}