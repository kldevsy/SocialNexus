import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Edit, Trash2, Reply, Pin, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MessageWithAuthor } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface MessageContextMenuProps {
  message: MessageWithAuthor;
  children: React.ReactNode;
  onEdit?: (message: MessageWithAuthor) => void;
  onReply?: (message: MessageWithAuthor) => void;
}

export function MessageContextMenu({ message, children, onEdit, onReply }: MessageContextMenuProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the message author
  const isOwner = user?.id === message.authorId;

  // Copy message content to clipboard
  const handleCopy = async () => {
    try {
      if (message.content) {
        await navigator.clipboard.writeText(message.content);
        toast({
          title: "Mensagem copiada!",
          description: "O conteúdo foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Mensagem deletada",
        description: "A mensagem foi removida com sucesso.",
      });
      // Invalidate messages query to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: [`/api/channels/${message.channelId}/messages`] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar mensagem",
        description: error?.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja deletar esta mensagem? Esta ação não pode ser desfeita."
    );
    
    if (confirmDelete) {
      setIsDeleting(true);
      deleteMessageMutation.mutate(message.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleReport = () => {
    toast({
      title: "Mensagem reportada",
      description: "Obrigado por nos ajudar a manter a comunidade segura.",
    });
  };

  const handlePin = () => {
    toast({
      title: "Recurso em breve",
      description: "A funcionalidade de fixar mensagens será implementada em breve.",
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Quick Actions */}
        <ContextMenuItem onClick={handleReply} className="cursor-pointer">
          <Reply className="mr-2 h-4 w-4" />
          Responder
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCopy} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Copiar mensagem
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Owner-only actions */}
        {isOwner && (
          <>
            <ContextMenuItem onClick={handleEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Editar mensagem
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={handleDelete} 
              className="cursor-pointer text-red-600 focus:text-red-600"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deletando..." : "Deletar mensagem"}
            </ContextMenuItem>
            
            <ContextMenuSeparator />
          </>
        )}
        
        {/* Moderation actions */}
        <ContextMenuItem onClick={handlePin} className="cursor-pointer">
          <Pin className="mr-2 h-4 w-4" />
          Fixar mensagem
        </ContextMenuItem>
        
        {!isOwner && (
          <ContextMenuItem onClick={handleReport} className="cursor-pointer text-orange-600 focus:text-orange-600">
            <Flag className="mr-2 h-4 w-4" />
            Reportar mensagem
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}