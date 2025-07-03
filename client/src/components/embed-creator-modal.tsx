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
  AlertTriangle,
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
  Rocket,
  Square,
  BarChart3,
  MessageSquare,
  Settings,
  Trash,
  Copy,
  Check
} from "lucide-react";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedButton {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
  url?: string;
  emoji?: string;
  disabled?: boolean;
  position: 'bottom' | 'top-above' | 'top-below';
}

interface EmbedProgressBar {
  id: string;
  label: string;
  value: number;
  max: number;
  style: 'default' | 'striped' | 'animated' | 'gradient';
  color: string;
}

interface EmbedData {
  title: string;
  description: string;
  color: string;
  colorPulsing: boolean;
  url: string;
  thumbnail: string;
  image: string;
  imagePosition: 'current' | 'above-title' | 'below-title';
  imageSpoiler: boolean;
  imageExplicit: boolean;
  authorName: string;
  authorIcon: string;
  authorUrl: string;
  footerText: string;
  footerIcon: string;
  timestamp: boolean;
  fields: EmbedField[];
  buttons: EmbedButton[];
  progressBars: EmbedProgressBar[];
  selectedIcon?: string;
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
  const [embedData, setEmbedData] = useState<EmbedData>({
    title: '',
    description: '',
    color: '#3b82f6',
    colorPulsing: false,
    url: '',
    thumbnail: '',
    image: '',
    imagePosition: 'current',
    imageSpoiler: false,
    imageExplicit: false,
    authorName: '',
    authorIcon: '',
    authorUrl: '',
    footerText: '',
    footerIcon: '',
    timestamp: false,
    fields: [],
    buttons: [],
    progressBars: [],
    selectedIcon: undefined
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
    try {
      setEmbedData({ ...embedData, ...template.template });
    } catch (error) {
      console.error("Template load error:", error);
    }
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
    try {
      onSave(embedData);
      onOpenChange(false);
      // Reset form
      setEmbedData({
        title: '',
        description: '',
        color: '#3b82f6',
        colorPulsing: false,
        url: '',
        thumbnail: '',
        image: '',
        authorName: '',
        authorIcon: '',
        authorUrl: '',
        footerText: '',
        footerIcon: '',
        timestamp: false,
        fields: [],
        buttons: [],
        progressBars: [],
        selectedIcon: undefined,
        imagePosition: 'current',
        imageSpoiler: false,
        imageExplicit: false
      });
    } catch (error) {
      console.error("Embed save error:", error);
    }
  };

  // Error boundary protection
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold">Criador de Embeds</DialogTitle>
              <DialogDescription className="hidden sm:block">
                Crie embeds profissionais com recursos avançados
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 overflow-y-auto max-h-[50vh] lg:max-h-[60vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="flex items-center space-x-1 text-xs sm:text-sm">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Básico</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center space-x-1 text-xs sm:text-sm">
                  <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Mídia</span>
                </TabsTrigger>
                <TabsTrigger value="fields" className="flex items-center space-x-1 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Campos</span>
                </TabsTrigger>
                <TabsTrigger value="buttons" className="flex items-center space-x-1 text-xs sm:text-sm">
                  <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Botões</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center space-x-1 text-xs sm:text-sm">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Progresso</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center space-x-1 text-xs sm:text-sm">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Templates</span>
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

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="image">Imagem Principal</Label>
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

                      {embedData.image && (
                        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                          <h4 className="font-medium text-sm">Configurações da Imagem</h4>
                          
                          <div className="space-y-2">
                            <Label>Posição da Imagem</Label>
                            <Select 
                              value={embedData.imagePosition} 
                              onValueChange={(value: 'current' | 'above-title' | 'below-title') => {
                                setEmbedData(prev => ({ ...prev, imagePosition: value }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="current">Posição Atual (após descrição)</SelectItem>
                                <SelectItem value="above-title">Acima do Título</SelectItem>
                                <SelectItem value="below-title">Abaixo do Título</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col space-y-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={embedData.imageSpoiler}
                                onCheckedChange={(checked) => setEmbedData(prev => ({ ...prev, imageSpoiler: checked }))}
                              />
                              <Label className="text-sm">Marcar como Spoiler (ocultar inicialmente)</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={embedData.imageExplicit}
                                onCheckedChange={(checked) => setEmbedData(prev => ({ ...prev, imageExplicit: checked }))}
                              />
                              <Label className="text-sm">Conteúdo Explícito (aviso de idade)</Label>
                            </div>
                          </div>

                          {(embedData.imageSpoiler || embedData.imageExplicit) && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center space-x-2 text-yellow-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {embedData.imageSpoiler && embedData.imageExplicit 
                                    ? 'Imagem marcada como spoiler e conteúdo explícito'
                                    : embedData.imageSpoiler 
                                    ? 'Imagem marcada como spoiler'
                                    : 'Imagem marcada como conteúdo explícito'
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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

              <TabsContent value="buttons" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Square className="h-5 w-5" />
                      <span>Botões Interativos</span>
                    </CardTitle>
                    <CardDescription>
                      Adicione botões clicáveis ao embed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEmbedData(prev => ({
                            ...prev,
                            buttons: [...prev.buttons, { 
                              id: crypto.randomUUID(), 
                              label: 'Novo Botão', 
                              style: 'primary', 
                              url: '', 
                              emoji: '', 
                              disabled: false,
                              position: 'bottom'
                            }]
                          }));
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Botão
                      </Button>

                      <AnimatePresence>
                        {embedData.buttons.map((button, index) => (
                          <motion.div
                            key={button.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-4 border rounded-lg space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">Botão {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEmbedData(prev => ({
                                    ...prev,
                                    buttons: prev.buttons.filter((_, i) => i !== index)
                                  }));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Texto do Botão</Label>
                                <Input
                                  value={button.label}
                                  onChange={(e) => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      buttons: prev.buttons.map((b, i) => 
                                        i === index ? { ...b, label: e.target.value } : b
                                      )
                                    }));
                                  }}
                                  placeholder="Clique aqui"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>URL (opcional)</Label>
                                <Input
                                  value={button.url}
                                  onChange={(e) => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      buttons: prev.buttons.map((b, i) => 
                                        i === index ? { ...b, url: e.target.value } : b
                                      )
                                    }));
                                  }}
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Estilo do Botão</Label>
                                <Select 
                                  value={button.style} 
                                  onValueChange={(value: 'primary' | 'secondary' | 'success' | 'danger' | 'link') => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      buttons: prev.buttons.map((b, i) => 
                                        i === index ? { ...b, style: value } : b
                                      )
                                    }));
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="primary">Primário (Azul)</SelectItem>
                                    <SelectItem value="secondary">Secundário (Cinza)</SelectItem>
                                    <SelectItem value="success">Sucesso (Verde)</SelectItem>
                                    <SelectItem value="danger">Perigo (Vermelho)</SelectItem>
                                    <SelectItem value="link">Link (Transparente)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Posição do Botão</Label>
                                <Select 
                                  value={button.position} 
                                  onValueChange={(value: 'bottom' | 'top-above' | 'top-below') => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      buttons: prev.buttons.map((b, i) => 
                                        i === index ? { ...b, position: value } : b
                                      )
                                    }));
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bottom">Parte inferior (padrão)</SelectItem>
                                    <SelectItem value="top-above">Acima do título</SelectItem>
                                    <SelectItem value="top-below">Abaixo do título</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {embedData.buttons.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Square className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum botão adicionado ainda</p>
                          <p className="text-sm">Clique em "Adicionar Botão" para começar</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Barras de Progresso</span>
                    </CardTitle>
                    <CardDescription>
                      Adicione barras de progresso animadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEmbedData(prev => ({
                            ...prev,
                            progressBars: [...prev.progressBars, { 
                              id: crypto.randomUUID(), 
                              label: 'Progresso', 
                              value: 50, 
                              max: 100, 
                              style: 'default', 
                              color: '#3b82f6' 
                            }]
                          }));
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Barra de Progresso
                      </Button>

                      <AnimatePresence>
                        {embedData.progressBars.map((progressBar, index) => (
                          <motion.div
                            key={progressBar.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-4 border rounded-lg space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">Barra {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEmbedData(prev => ({
                                    ...prev,
                                    progressBars: prev.progressBars.filter((_, i) => i !== index)
                                  }));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Rótulo</Label>
                                <Input
                                  value={progressBar.label}
                                  onChange={(e) => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      progressBars: prev.progressBars.map((p, i) => 
                                        i === index ? { ...p, label: e.target.value } : p
                                      )
                                    }));
                                  }}
                                  placeholder="Nome da barra"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Cor</Label>
                                <Input
                                  type="color"
                                  value={progressBar.color}
                                  onChange={(e) => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      progressBars: prev.progressBars.map((p, i) => 
                                        i === index ? { ...p, color: e.target.value } : p
                                      )
                                    }));
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Valor Atual</Label>
                                <Input
                                  type="number"
                                  value={progressBar.value}
                                  onChange={(e) => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      progressBars: prev.progressBars.map((p, i) => 
                                        i === index ? { ...p, value: parseInt(e.target.value) || 0 } : p
                                      )
                                    }));
                                  }}
                                  min="0"
                                  max={progressBar.max}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Valor Máximo</Label>
                                <Input
                                  type="number"
                                  value={progressBar.max}
                                  onChange={(e) => {
                                    setEmbedData(prev => ({
                                      ...prev,
                                      progressBars: prev.progressBars.map((p, i) => 
                                        i === index ? { ...p, max: parseInt(e.target.value) || 100 } : p
                                      )
                                    }));
                                  }}
                                  min="1"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Estilo</Label>
                              <Select 
                                value={progressBar.style} 
                                onValueChange={(value: 'default' | 'striped' | 'animated' | 'gradient') => {
                                  setEmbedData(prev => ({
                                    ...prev,
                                    progressBars: prev.progressBars.map((p, i) => 
                                      i === index ? { ...p, style: value } : p
                                    )
                                  }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Padrão</SelectItem>
                                  <SelectItem value="striped">Listrado</SelectItem>
                                  <SelectItem value="animated">Animado</SelectItem>
                                  <SelectItem value="gradient">Gradiente</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Preview da barra */}
                            <div className="space-y-2">
                              <Label>Preview</Label>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{progressBar.label}</span>
                                  <span>{progressBar.value}/{progressBar.max}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ 
                                      width: `${(progressBar.value / progressBar.max) * 100}%`
                                    }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`
                                      h-3 rounded-full relative overflow-hidden
                                      ${progressBar.style === 'animated' ? 'animate-pulse' : ''}
                                      ${progressBar.style === 'striped' ? 'bg-striped' : ''}
                                    `}
                                    style={{ 
                                      backgroundColor: progressBar.color,
                                      backgroundImage: progressBar.style === 'striped' 
                                        ? `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.2) 5px, rgba(255,255,255,0.2) 10px)`
                                        : progressBar.style === 'gradient'
                                        ? `linear-gradient(90deg, ${progressBar.color}, ${progressBar.color}dd, ${progressBar.color})`
                                        : undefined,
                                      animation: progressBar.style === 'animated' 
                                        ? 'progress-fill 2s ease-in-out infinite alternate' 
                                        : undefined
                                    }}
                                  >
                                    {progressBar.style === 'animated' && (
                                      <div 
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-ping"
                                        style={{ animationDuration: '1.5s' }}
                                      />
                                    )}
                                  </motion.div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>0</span>
                                  <span className="font-medium">
                                    {((progressBar.value / progressBar.max) * 100).toFixed(1)}%
                                  </span>
                                  <span>{progressBar.max}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {embedData.progressBars.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma barra de progresso adicionada ainda</p>
                          <p className="text-sm">Clique em "Adicionar Barra de Progresso" para começar</p>
                        </div>
                      )}
                    </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {embedTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="p-3 sm:p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
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
          <div className="w-full lg:w-80 lg:border-l lg:pl-4 border-t lg:border-t-0 pt-4 lg:pt-0">
            <div className="sticky top-0 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="h-4 w-4" />
                <h3 className="font-semibold">Pré-visualização</h3>
              </div>
              
              <motion.div
                layout
                className="bg-gray-50 p-4 rounded-lg"
              >
                {/* Buttons Preview - Top Above (outside embed) */}
                {embedData.buttons.filter(b => b.position === 'top-above').length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {embedData.buttons.filter(b => b.position === 'top-above').map((button, index) => {
                        const getButtonStyle = (style: string) => {
                          switch (style) {
                            case 'primary':
                              return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
                            case 'secondary':
                              return 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600';
                            case 'success':
                              return 'bg-green-600 text-white border-green-600 hover:bg-green-700';
                            case 'danger':
                              return 'bg-red-600 text-white border-red-600 hover:bg-red-700';
                            case 'link':
                              return 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50';
                            default:
                              return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
                          }
                        };

                        return (
                          <button
                            key={button.id}
                            className={`
                              px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer
                              ${getButtonStyle(button.style)}
                              ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            disabled={button.disabled}
                          >
                            {button.emoji && <span className="mr-1">{button.emoji}</span>}
                            {button.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Embed Preview */}
                <div 
                  className={`bg-white rounded-lg p-4 border-l-4 shadow-sm relative ${embedData.colorPulsing ? 'animate-pulse' : ''}`}
                  style={{ borderLeftColor: embedData.color }}
                >
                  {/* Image above title */}
                  {embedData.image && embedData.imagePosition === 'above-title' && (
                    <div className="mb-3">
                      {embedData.imageSpoiler ? (
                        <div className="bg-gray-800 text-white p-4 rounded cursor-pointer hover:bg-gray-700 transition-colors">
                          <div className="text-center">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">SPOILER</p>
                            <p className="text-xs opacity-75">Clique para revelar</p>
                          </div>
                        </div>
                      ) : embedData.imageExplicit ? (
                        <div className="bg-red-100 border border-red-300 p-4 rounded">
                          <div className="text-center text-red-800">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">CONTEÚDO EXPLÍCITO</p>
                            <p className="text-xs">Conteúdo sensível - visualize com cuidado</p>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={embedData.image} 
                          alt="" 
                          className="max-w-full h-auto rounded"
                        />
                      )}
                    </div>
                  )}

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

                  {/* Image below title */}
                  {embedData.image && embedData.imagePosition === 'below-title' && (
                    <div className="mb-3">
                      {embedData.imageSpoiler ? (
                        <div className="bg-gray-800 text-white p-4 rounded cursor-pointer hover:bg-gray-700 transition-colors">
                          <div className="text-center">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">SPOILER</p>
                            <p className="text-xs opacity-75">Clique para revelar</p>
                          </div>
                        </div>
                      ) : embedData.imageExplicit ? (
                        <div className="bg-red-100 border border-red-300 p-4 rounded">
                          <div className="text-center text-red-800">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">CONTEÚDO EXPLÍCITO</p>
                            <p className="text-xs">Conteúdo sensível - visualize com cuidado</p>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={embedData.image} 
                          alt="" 
                          className="max-w-full h-auto rounded"
                        />
                      )}
                    </div>
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

                  {/* Image current position (after description) */}
                  {embedData.image && embedData.imagePosition === 'current' && (
                    <div className="mb-3">
                      {embedData.imageSpoiler ? (
                        <div className="bg-gray-800 text-white p-4 rounded cursor-pointer hover:bg-gray-700 transition-colors">
                          <div className="text-center">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">SPOILER</p>
                            <p className="text-xs opacity-75">Clique para revelar</p>
                          </div>
                        </div>
                      ) : embedData.imageExplicit ? (
                        <div className="bg-red-100 border border-red-300 p-4 rounded">
                          <div className="text-center text-red-800">
                            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">CONTEÚDO EXPLÍCITO</p>
                            <p className="text-xs">Conteúdo sensível - visualize com cuidado</p>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={embedData.image} 
                          alt="" 
                          className="max-w-full h-auto rounded"
                        />
                      )}
                    </div>
                  )}

                  {/* Buttons Preview - Top Below (inside embed, after title) */}
                  {embedData.buttons.filter(b => b.position === 'top-below').length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {embedData.buttons.filter(b => b.position === 'top-below').map((button, index) => {
                          const getButtonStyle = (style: string) => {
                            switch (style) {
                              case 'primary':
                                return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
                              case 'secondary':
                                return 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600';
                              case 'success':
                                return 'bg-green-600 text-white border-green-600 hover:bg-green-700';
                              case 'danger':
                                return 'bg-red-600 text-white border-red-600 hover:bg-red-700';
                              case 'link':
                                return 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50';
                              default:
                                return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
                            }
                          };

                          return (
                            <button
                              key={button.id}
                              className={`
                                px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer
                                ${getButtonStyle(button.style)}
                                ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                              disabled={button.disabled}
                            >
                              {button.emoji && <span className="mr-1">{button.emoji}</span>}
                              {button.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Progress Bars Preview */}
                  {embedData.progressBars.length > 0 && (
                    <div className="mb-3 space-y-3">
                      {embedData.progressBars.map((progressBar, index) => {
                        const percentage = Math.min(100, Math.max(0, (progressBar.value / progressBar.max) * 100));
                        
                        const getProgressBarClass = (style: string) => {
                          let baseClass = "h-2 rounded-full transition-all duration-500";
                          switch (style) {
                            case 'striped':
                              return `${baseClass} bg-gradient-to-r from-transparent via-white to-transparent bg-size-200 animate-shimmer`;
                            case 'animated':
                              return `${baseClass} animate-pulse`;
                            case 'gradient':
                              return `${baseClass} bg-gradient-to-r`;
                            default:
                              return baseClass;
                          }
                        };

                        return (
                          <div key={progressBar.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-800">
                                {progressBar.label}
                              </span>
                              <span className="text-sm text-gray-600 font-mono">
                                {progressBar.value}/{progressBar.max}
                              </span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={getProgressBarClass(progressBar.style)}
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: progressBar.style === 'gradient' 
                                    ? undefined 
                                    : progressBar.color,
                                  backgroundImage: progressBar.style === 'gradient' 
                                    ? `linear-gradient(45deg, ${progressBar.color}, ${progressBar.color}CC, ${progressBar.color})`
                                    : undefined
                                }}
                              />
                            </div>
                            
                            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                              <span>0%</span>
                              <span className="font-medium px-2 py-1 bg-gray-100 rounded text-gray-700">
                                {percentage.toFixed(1)}%
                              </span>
                              <span>100%</span>
                            </div>
                          </div>
                        );
                      })}
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

                {/* Buttons Preview - Bottom (outside embed) */}
                {embedData.buttons.filter(b => b.position === 'bottom').length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {embedData.buttons.filter(b => b.position === 'bottom').map((button, index) => {
                        const getButtonStyle = (style: string) => {
                          switch (style) {
                            case 'primary':
                              return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
                            case 'secondary':
                              return 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600';
                            case 'success':
                              return 'bg-green-600 text-white border-green-600 hover:bg-green-700';
                            case 'danger':
                              return 'bg-red-600 text-white border-red-600 hover:bg-red-700';
                            case 'link':
                              return 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50';
                            default:
                              return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
                          }
                        };

                        return (
                          <button
                            key={button.id}
                            className={`
                              px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer
                              ${getButtonStyle(button.style)}
                              ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            disabled={button.disabled}
                          >
                            {button.emoji && <span className="mr-1">{button.emoji}</span>}
                            {button.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Sparkles className="h-4 w-4 mr-2" />
            Enviar Embed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}