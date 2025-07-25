import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Camera, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SafeSelect, SafeSelectItem } from "@/components/ui/safe-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertServer } from "@shared/schema";

interface CreateServerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateServerModal({ open, onOpenChange }: CreateServerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    isPublic: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createServerMutation = useMutation({
    mutationFn: async (data: Omit<InsertServer, "ownerId">) => {
      try {
        const response = await apiRequest("/api/servers", {
          method: "POST",
          body: JSON.stringify(data),
        });
        return response;
      } catch (error: any) {
        console.error("API request failed:", error);
        throw new Error(error.message || "Falha na requisição");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/servers/discover"] });
      toast({
        title: "Sucesso",
        description: "Servidor criado com sucesso!",
      });
      onOpenChange(false);
      setFormData({ name: "", description: "", category: "", isPublic: true });
      setImagePreview(null);
    },
    onError: (error: any) => {
      console.error("Create server error:", error);
      toast({
        title: "Erro",
        description: error?.message || "Falha ao criar servidor",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Dados do formulário:", formData);
    
    // Validação dos campos obrigatórios
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do servidor é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.category) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const serverData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        isPublic: formData.isPublic,
      };
      
      console.log("Criando servidor:", serverData);
      createServerMutation.mutate(serverData);
    } catch (error) {
      console.error("Erro no submit:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar formulário",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Plus className="text-white w-10 h-10" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar Seu Servidor</h2>
                <p className="text-gray-600 text-base">Construa uma comunidade em torno dos seus interesses</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Server Icon Upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="relative inline-block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-3 border-dashed border-gray-300 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl overflow-hidden"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="text-gray-400 w-10 h-10" />
                )}
              </motion.div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">Ícone do servidor (opcional)</p>
          </motion.div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Servidor *</Label>
              <Input
                id="name"
                placeholder="Digite o nome do servidor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva seu servidor..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => {
                  console.log("Categoria selecionada:", e.target.value);
                  setFormData(prev => ({ ...prev, category: e.target.value }));
                }}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>Selecione uma categoria</option>
                <option value="Gaming">Gaming</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Arte">Arte</option>
                <option value="Música">Música</option>
                <option value="Educação">Educação</option>
                <option value="Esportes">Esportes</option>
                <option value="Entretenimento">Entretenimento</option>
                <option value="Outros">Outros</option>
              </select>
              {formData.category && (
                <p className="text-sm text-green-600 mt-1">Categoria selecionada: {formData.category}</p>
              )}
            </div>
            
            <div>
              <Label>Privacidade</Label>
              <RadioGroup 
                value={formData.isPublic ? "public" : "private"} 
                onValueChange={(value) => setFormData({ ...formData, isPublic: value === "public" })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex-1">
                    <span className="font-medium">Público</span>
                    <span className="block text-sm text-gray-500">Qualquer pessoa pode encontrar e entrar</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1">
                    <span className="font-medium">Privado</span>
                    <span className="block text-sm text-gray-500">Apenas membros convidados podem entrar</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createServerMutation.isPending}
              className="flex-1"
            >
              {createServerMutation.isPending ? "Criando..." : "Criar Servidor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
