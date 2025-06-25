import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Send } from "lucide-react";
import { QuickActionsMenu } from "./quick-actions-menu";
import { EmbedCreatorModal } from "./embed-creator-modal";
import { TestEmbedModal } from "./test-embed-modal";
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
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, imageUrl }: { content?: string; imageUrl?: string }) => {
      let finalImageUrl = null;
      
      if (selectedImage) {
        // Compress and convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        finalImageUrl = await new Promise<string>((resolve) => {
          img.onload = () => {
            // Calculate new dimensions (max 800px width)
            const maxWidth = 800;
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            // Draw and compress
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality
          };
          img.src = URL.createObjectURL(selectedImage);
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
    onError: (error: any) => {
      console.error('Error sending message:', error);
      let errorMessage = "Não foi possível enviar a mensagem. Tente novamente.";
      
      if (error?.message?.includes('PayloadTooLargeError') || error?.message?.includes('entity too large')) {
        errorMessage = "Imagem muito grande. Tente uma imagem menor.";
      }
      
      toast({
        title: "Erro ao enviar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!message.trim() && !selectedImage) return;
    
    sendMessageMutation.mutate({
      content: message.trim() || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
      if (file.size > 2 * 1024 * 1024) { // 2MB limit to avoid base64 bloat
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 2MB.",
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
      
      // Create optimized preview
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Small preview (max 200px)
        const maxPreviewSize = 200;
        const ratio = Math.min(maxPreviewSize / img.width, maxPreviewSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImagePreview(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick action handlers
  const handleMicrophoneSelect = () => {
    toast({
      title: "Gravação de áudio",
      description: "Funcionalidade em desenvolvimento.",
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleMentionSelect = () => {
    setMessage(prev => prev + '@');
    textareaRef.current?.focus();
  };

  const handleEmbedSelect = () => {
    console.log("Opening embed modal...");
    setTestModalOpen(true); // Primeiro vamos testar com modal simples
    // setEmbedModalOpen(true);
  };

  const handleEmbedSave = (embedData: any) => {
    // Enviar mensagem com embed
    sendMessageMutation.mutate({
      content: message.trim() || undefined,
      embedData: embedData
    });
    
    setMessage("");
    toast({
      title: "Embed enviado!",
      description: "Seu embed foi criado e enviado com sucesso.",
    });
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,*/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* Quick Actions Menu */}
        <QuickActionsMenu
          onMicrophoneSelect={handleMicrophoneSelect}
          onFileSelect={handleFileSelect}
          onMentionSelect={handleMentionSelect}
          onEmbedSelect={handleEmbedSelect}
        />
        
        {/* Image button */}
        <Button
          variant="outline"
          size="sm"
          className="h-11 px-3"
          onClick={() => fileInputRef.current?.click()}
          title="Enviar imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        {/* Message input */}
        <div className="flex-1 min-w-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="min-h-[44px] max-h-32 resize-none border rounded-lg w-full"
            onKeyDown={handleKeyDown}
          />
        </div>
        
        {/* Send button */}
        <Button
          onClick={handleSubmit}
          disabled={(!message.trim() && !selectedImage) || sendMessageMutation.isPending}
          size="sm"
          className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {sendMessageMutation.isPending ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Test Modal */}
      <TestEmbedModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
      />

      {/* Embed Creator Modal */}
      <EmbedCreatorModal
        open={embedModalOpen}
        onOpenChange={setEmbedModalOpen}
        onSave={handleEmbedSave}
      />
    </div>
  );
}