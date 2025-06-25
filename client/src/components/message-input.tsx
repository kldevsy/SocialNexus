import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Send, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  channelId: number;
  userId: string;
  onTyping: () => void;
  onStopTyping: () => void;
  editingMessage?: MessageWithAuthor | null;
  onCancelEdit?: () => void;
  replyingTo?: MessageWithAuthor | null;
  onCancelReply?: () => void;
}

export function MessageInput({ 
  channelId, 
  userId, 
  onTyping, 
  onStopTyping, 
  editingMessage, 
  onCancelEdit, 
  replyingTo, 
  onCancelReply 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, imageUrl }: { content?: string; imageUrl?: string }) => {
      let finalImageUrl = null;
      
      if (selectedImage) {
        // Convert image to base64 for simple storage
        const reader = new FileReader();
        finalImageUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedImage);
        });
      }

      return apiRequest(`/api/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content || null,
          imageUrl: finalImageUrl,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${channelId}/messages`] });
      setMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      onStopTyping();
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() && !selectedImage) return;
    
    sendMessageMutation.mutate({
      content: message.trim() || undefined,
    });
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Start typing indicator
    if (value.trim()) {
      onTyping();
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 3000);
    } else {
      onStopTyping();
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione apenas imagens.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t bg-white">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-w-32 max-h-32 rounded-lg border"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={removeImage}
          >
            ×
          </Button>
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        {/* Add attachments button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* Image button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        {/* Message input */}
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            disabled={sendMessageMutation.isPending}
            className="resize-none"
          />
        </div>
        
        {/* Send button */}
        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && !selectedImage) || sendMessageMutation.isPending}
          size="sm"
        >
          {sendMessageMutation.isPending ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}