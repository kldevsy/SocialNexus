import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createServerMutation = useMutation({
    mutationFn: async (data: Omit<InsertServer, "ownerId">) => {
      const response = await apiRequest("POST", "/api/servers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      toast({
        title: "Success",
        description: "Server created successfully!",
      });
      onOpenChange(false);
      setFormData({ name: "", description: "", category: "", isPublic: true });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create server",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createServerMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
                className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-3 border-dashed border-gray-300 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
              >
                <Camera className="text-gray-400 w-10 h-10" />
              </motion.div>
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">Ícone do servidor (opcional)</p>
          </motion.div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Server Name *</Label>
              <Input
                id="name"
                placeholder="Enter server name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your server..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gaming">Gaming</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Art & Design">Art & Design</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Privacy</Label>
              <RadioGroup 
                value={formData.isPublic ? "public" : "private"} 
                onValueChange={(value) => setFormData({ ...formData, isPublic: value === "public" })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex-1">
                    <span className="font-medium">Public</span>
                    <span className="block text-sm text-gray-500">Anyone can find and join this server</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1">
                    <span className="font-medium">Private</span>
                    <span className="block text-sm text-gray-500">Only invited members can join</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createServerMutation.isPending}
              className="flex-1"
            >
              {createServerMutation.isPending ? "Creating..." : "Create Server"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
