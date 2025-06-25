import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  X, 
  Plus, 
  Palette, 
  Image, 
  Link2, 
  Eye, 
  Sparkles,
  Clock,
  User,
  Hash,
  Calendar,
  Star,
  Heart,
  Zap,
  Crown,
  Gift,
  Music,
  GamepadIcon,
  Trophy,
  Target,
  Rocket
} from "lucide-react";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedData {
  title: string;
  description: string;
  color: string;
  url: string;
  thumbnail: string;
  image: string;
  authorName: string;
  authorIcon: string;
  authorUrl: string;
  footerText: string;
  footerIcon: string;
  timestamp: boolean;
  fields: EmbedField[];
}

interface EmbedCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (embedData: EmbedData) => void;
}

const embedTemplates = [
  {
    id: 'announcement',
    name: 'Anúncio',
    icon: '📢',
    color: '#3b82f6',
    template: {
      title: 'Anúncio Importante',
      description: 'Descrição do seu anúncio aqui...',
      color: '#3b82f6',
      authorName: 'Equipe do Servidor',
      timestamp: true,
      fields: []
    }
  },
  {
    id: 'event',
    name: 'Evento',
    icon: '🎉',
    color: '#10b981',
    template: {
      title: 'Novo Evento',
      description: 'Junte-se a nós para um evento incrível!',
      color: '#10b981',
      authorName: 'Organizador',
      timestamp: true,
      fields: [
        { name: '📅 Data', value: 'A definir', inline: true },
        { name: '🕐 Horário', value: 'A definir', inline: true },
        { name: '📍 Local', value: 'Canal de Voz', inline: true }
      ]
    }
  },
  {
    id: 'poll',
    name: 'Enquete',
    icon: '📊',
    color: '#8b5cf6',
    template: {
      title: 'Nova Enquete',
      description: 'Vote na sua opção favorita!',
      color: '#8b5cf6',
      footerText: 'Reaja com os emojis abaixo',
      timestamp: true,
      fields: [
        { name: '🔵 Opção A', value: 'Primeira opção', inline: true },
        { name: '🔴 Opção B', value: 'Segunda opção', inline: true }
      ]
    }
  },
  {
    id: 'welcome',
    name: 'Boas-vindas',
    icon: '👋',
    color: '#f59e0b',
    template: {
      title: 'Bem-vindo ao servidor!',
      description: 'Esperamos que você se divirta conosco!',
      color: '#f59e0b',
      thumbnail: 'https://ui-avatars.com/api/?name=Welcome&size=128&background=f59e0b&color=ffffff',
      timestamp: true,
      fields: [
        { name: '📝 Regras', value: 'Leia nosso canal de regras', inline: false },
        { name: '🎮 Canais', value: 'Explore nossos canais', inline: false }
      ]
    }
  },
  {
    id: 'update',
    name: 'Atualização',
    icon: '🔄',
    color: '#06b6d4',
    template: {
      title: 'Atualização v2.0',
      description: 'Novidades e melhorias implementadas!',
      color: '#06b6d4',
      authorName: 'Desenvolvedor',
      authorIcon: 'https://ui-avatars.com/api/?name=Dev&size=32&background=06b6d4&color=ffffff',
      timestamp: true,
      fields: [
        { name: '✨ Novidades', value: 'Lista de novas funcionalidades', inline: false },
        { name: '🐛 Correções', value: 'Bugs corrigidos nesta versão', inline: false }
      ]
    }
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    color: '#ef4444',
    template: {
      title: 'Sessão de Gaming',
      description: 'Vamos jogar juntos!',
      color: '#ef4444',
      thumbnail: 'https://ui-avatars.com/api/?name=Game&size=128&background=ef4444&color=ffffff',
      timestamp: true,
      fields: [
        { name: '🎯 Jogo', value: 'Nome do jogo', inline: true },
        { name: '👥 Jogadores', value: '0/8', inline: true },
        { name: '🏆 Rank', value: 'Qualquer', inline: true }
      ]
    }
  }
];

const colorPresets = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4',
  '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7'
];

export function EmbedCreatorModal({ open, onOpenChange, onSave }: EmbedCreatorModalProps) {
  console.log("EmbedCreatorModal render - open:", open);
  const [embedData, setEmbedData] = useState<EmbedData>({
    title: '',
    description: '',
    color: '#3b82f6',
    url: '',
    thumbnail: '',
    image: '',
    authorName: '',
    authorIcon: '',
    authorUrl: '',
    footerText: '',
    footerIcon: '',
    timestamp: false,
    fields: []
  });

  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addField = () => {
    setEmbedData(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', value: '', inline: false }]
    }));
  };

  const updateField = (index: number, field: Partial<EmbedField>) => {
    setEmbedData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }));
  };

  const removeField = (index: number) => {
    setEmbedData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const loadTemplate = (template: any) => {
    setEmbedData({ ...embedData, ...template.template });
  };

  const handleImageUpload = (field: keyof EmbedData) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setEmbedData(prev => ({
            ...prev,
            [field]: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSave = () => {
    onSave(embedData);
    onOpenChange(false);
    // Reset form
    setEmbedData({
      title: '',
      description: '',
      color: '#3b82f6',
      url: '',
      thumbnail: '',
      image: '',
      authorName: '',
      authorIcon: '',
      authorUrl: '',
      footerText: '',
      footerIcon: '',
      timestamp: false,
      fields: []
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Criador de Embeds Avançado</DialogTitle>
              <DialogDescription>
                Crie embeds profissionais com recursos avançados e pré-visualização em tempo real
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Básico</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center space-x-2">
                  <Image className="h-4 w-4" />
                  <span>Mídia</span>
                </TabsTrigger>
                <TabsTrigger value="fields" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Campos</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Templates</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={embedData.title}
                        onChange={(e) => setEmbedData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Título do embed..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={embedData.description}
                        onChange={(e) => setEmbedData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição detalhada..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cor do Embed</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={embedData.color}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-12 h-8 rounded border border-gray-300"
                        />
                        <Input
                          value={embedData.color}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, color: e.target.value }))}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {colorPresets.map(color => (
                          <button
                            key={color}
                            onClick={() => setEmbedData(prev => ({ ...prev, color }))}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">URL (Título clicável)</Label>
                      <Input
                        id="url"
                        value={embedData.url}
                        onChange={(e) => setEmbedData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Autor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="authorName">Nome do Autor</Label>
                        <Input
                          id="authorName"
                          value={embedData.authorName}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, authorName: e.target.value }))}
                          placeholder="Nome..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="authorUrl">URL do Autor</Label>
                        <Input
                          id="authorUrl"
                          value={embedData.authorUrl}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, authorUrl: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorIcon">Ícone do Autor</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="authorIcon"
                          value={embedData.authorIcon}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, authorIcon: e.target.value }))}
                          placeholder="URL da imagem..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleImageUpload('authorIcon')}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rodapé</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={embedData.timestamp}
                        onCheckedChange={(checked) => setEmbedData(prev => ({ ...prev, timestamp: checked }))}
                      />
                      <Label>Mostrar timestamp</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="footerText">Texto do Rodapé</Label>
                        <Input
                          id="footerText"
                          value={embedData.footerText}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, footerText: e.target.value }))}
                          placeholder="Texto..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footerIcon">Ícone do Rodapé</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="footerIcon"
                            value={embedData.footerIcon}
                            onChange={(e) => setEmbedData(prev => ({ ...prev, footerIcon: e.target.value }))}
                            placeholder="URL da imagem..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleImageUpload('footerIcon')}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Imagens</CardTitle>
                    <CardDescription>
                      Adicione imagens para tornar seu embed mais atrativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail">Thumbnail (pequena, no canto)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="thumbnail"
                          value={embedData.thumbnail}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, thumbnail: e.target.value }))}
                          placeholder="URL da imagem..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleImageUpload('thumbnail')}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Imagem Principal (grande, embaixo)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="image"
                          value={embedData.image}
                          onChange={(e) => setEmbedData(prev => ({ ...prev, image: e.target.value }))}
                          placeholder="URL da imagem..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleImageUpload('image')}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Campos Personalizados</CardTitle>
                      <CardDescription>
                        Adicione campos para organizar informações
                      </CardDescription>
                    </div>
                    <Button onClick={addField} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Campo
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence>
                      {embedData.fields.map((field, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-4 border rounded-lg space-y-3 mb-4"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Campo {index + 1}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nome do Campo</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                placeholder="Nome..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Valor do Campo</Label>
                              <Input
                                value={field.value}
                                onChange={(e) => updateField(index, { value: e.target.value })}
                                placeholder="Valor..."
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.inline}
                              onCheckedChange={(checked) => updateField(index, { inline: checked })}
                            />
                            <Label>Campo inline (lado a lado)</Label>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {embedData.fields.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum campo adicionado ainda</p>
                        <p className="text-sm">Clique em "Adicionar Campo" para começar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Templates Prontos</CardTitle>
                    <CardDescription>
                      Escolha um template para começar rapidamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {embedTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                          onClick={() => loadTemplate(template)}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: template.color }}
                            >
                              {template.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{template.name}</h3>
                              <p className="text-sm text-gray-500">{template.template.description}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {template.template.fields.length} campos incluídos
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l pl-4">
            <div className="sticky top-0 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="h-4 w-4" />
                <h3 className="font-semibold">Pré-visualização</h3>
              </div>
              
              <motion.div
                layout
                className="bg-gray-50 p-4 rounded-lg"
              >
                {/* Embed Preview */}
                <div 
                  className="bg-white rounded-lg p-4 border-l-4 shadow-sm"
                  style={{ borderLeftColor: embedData.color }}
                >
                  {/* Author */}
                  {embedData.authorName && (
                    <div className="flex items-center space-x-2 mb-2">
                      {embedData.authorIcon && (
                        <img 
                          src={embedData.authorIcon} 
                          alt="" 
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium">
                        {embedData.authorUrl ? (
                          <a href={embedData.authorUrl} className="text-blue-600 hover:underline">
                            {embedData.authorName}
                          </a>
                        ) : (
                          embedData.authorName
                        )}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  {embedData.title && (
                    <h3 className="font-semibold text-lg mb-2" style={{ color: embedData.color }}>
                      {embedData.url ? (
                        <a href={embedData.url} className="hover:underline">
                          {embedData.title}
                        </a>
                      ) : (
                        embedData.title
                      )}
                    </h3>
                  )}

                  {/* Description */}
                  {embedData.description && (
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {embedData.description}
                    </p>
                  )}

                  {/* Fields */}
                  {embedData.fields.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <div className="grid grid-cols-1 gap-2">
                        {embedData.fields.map((field, index) => (
                          <div 
                            key={index} 
                            className={`${field.inline ? 'inline-block w-1/2 pr-2' : 'block'}`}
                          >
                            <div className="font-medium text-sm">{field.name}</div>
                            <div className="text-sm text-gray-600">{field.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {embedData.image && (
                    <div className="mb-3">
                      <img 
                        src={embedData.image} 
                        alt="" 
                        className="max-w-full h-auto rounded"
                      />
                    </div>
                  )}

                  {/* Footer */}
                  {(embedData.footerText || embedData.timestamp) && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        {embedData.footerIcon && (
                          <img 
                            src={embedData.footerIcon} 
                            alt="" 
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        {embedData.footerText && (
                          <span className="text-xs text-gray-500">{embedData.footerText}</span>
                        )}
                      </div>
                      {embedData.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Thumbnail */}
                  {embedData.thumbnail && (
                    <div className="absolute top-4 right-4">
                      <img 
                        src={embedData.thumbnail} 
                        alt="" 
                        className="w-16 h-16 rounded object-cover"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Enviar Embed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}