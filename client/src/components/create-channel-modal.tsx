import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Hash, Volume2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertChannel } from "@shared/schema";

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: number;
}

export function CreateChannelModal({ open, onOpenChange, serverId }: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createChannelMutation = useMutation({
    mutationFn: async (channelData: InsertChannel) => {
      return await apiRequest(`/api/servers/${serverId}/channels`, {
        method: "POST",
        body: JSON.stringify(channelData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Canal criado com sucesso!",
        description: "Seu novo canal está pronto para uso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/channels`] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setType("text");
    },
    onError: (error: any) => {
      console.error("Channel creation error:", error);
      toast({
        title: "Erro ao criar canal",
        description: error?.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o canal.",
        variant: "destructive",
      });
      return;
    }

    createChannelMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      serverId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="channel-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Hash className="h-4 w-4 text-white" />
            </div>
            <span>Criar Canal</span>
          </DialogTitle>
          <p id="channel-modal-description" className="text-sm text-gray-600">
            Crie um novo canal para organizar conversas no seu servidor.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Channel Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Canal</Label>
            <RadioGroup value={type} onValueChange={(value: "text" | "voice") => setType(value)}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="text" id="text" />
                <div className="flex items-center space-x-2 flex-1">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label htmlFor="text" className="text-sm font-medium cursor-pointer">
                      Canal de Texto
                    </Label>
                    <p className="text-xs text-gray-500">Envie mensagens, imagens e links</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="voice" id="voice" />
                <div className="flex items-center space-x-2 flex-1">
                  <Volume2 className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label htmlFor="voice" className="text-sm font-medium cursor-pointer">
                      Canal de Voz
                    </Label>
                    <p className="text-xs text-gray-500">Converse por voz com outros membros</p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome do Canal *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do canal"
              className="w-full"
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              {name.length}/50 caracteres
            </p>
          </div>

          {/* Channel Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste canal"
              className="resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {description.length}/200 caracteres
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createChannelMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createChannelMutation.isPending || !name.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {createChannelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Canal"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}