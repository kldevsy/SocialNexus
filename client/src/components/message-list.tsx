import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import type { MessageWithAuthor } from "@shared/schema";

interface MessageListProps {
  channelId: number;
  typingUsers: string[];
}

export function MessageList({ channelId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const [editingMessage, setEditingMessage] = useState<MessageWithAuthor | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageWithAuthor | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: [`/api/channels/${channelId}/messages`],
    refetchOnWindowFocus: false,
  });

  // WebSocket connection for real-time messages
  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      // Join channel for real-time updates
      ws.send(JSON.stringify({
        type: 'join-channel',
        channelId
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new-message' && data.channelId === channelId) {
        // Refresh messages immediately when new message arrives
        queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}/messages`] });
      } else if (data.type === 'user-typing' && data.channelId === channelId) {
        // Add user to typing list
        setTypingUsers(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });
      } else if (data.type === 'user-stop-typing' && data.channelId === channelId) {
        // Remove user from typing list using userId since userName might not be available
        setTypingUsers(prev => prev.filter(user => user !== data.userName));
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [channelId, queryClient]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: ptBR });
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE HH:mm', { locale: ptBR });
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-500">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>Seja o primeiro a enviar uma mensagem neste canal!</p>
        </div>
      ) : (
        <>
          {[...messages].reverse().map((message: MessageWithAuthor, index: number) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage 
                  src={message.author.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.author.firstName || 'User')}&size=40&background=random`}
                  alt={message.author.firstName || 'User'}
                />
                <AvatarFallback>
                  {(message.author.firstName || message.author.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {message.author.firstName || message.author.email?.split('@')[0] || 'Usuário'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Message content */}
                  {message.content && (
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  
                  {/* Message image */}
                  {message.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={message.imageUrl} 
                        alt="Imagem enviada" 
                        className="max-w-sm max-h-96 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow block"
                        onClick={() => window.open(message.imageUrl!, '_blank')}
                        onError={(e) => {
                          console.error('Error loading image:', message.imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </>
      )}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 text-sm text-gray-500 pl-13"
        >
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>
            {typingUsers.length === 1 
              ? `${typingUsers[0]} está digitando...`
              : `${typingUsers.slice(0, -1).join(', ')} e ${typingUsers[typingUsers.length - 1]} estão digitando...`
            }
          </span>
        </motion.div>
      )}

      {/* Connection status */}
      {!wsConnected && (
        <div className="text-center text-yellow-600 text-sm py-2">
          Reconectando...
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}