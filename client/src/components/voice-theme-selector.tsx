import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Check, 
  Sparkles, 
  Briefcase, 
  Zap, 
  Eye,
  Minus
} from 'lucide-react';

interface VoiceTheme {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface VoiceThemeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
}

const themes: VoiceTheme[] = [
  {
    id: 'default',
    name: 'Padrão',
    description: 'Design clássico e limpo',
    icon: <Palette className="h-4 w-4" />,
    preview: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-100',
      accent: 'bg-blue-100'
    }
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Visual simples e direto',
    icon: <Minus className="h-4 w-4" />,
    preview: {
      primary: 'bg-blue-500',
      secondary: 'bg-white',
      accent: 'bg-gray-50'
    }
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Elegante e corporativo',
    icon: <Briefcase className="h-4 w-4" />,
    preview: {
      primary: 'bg-slate-800',
      secondary: 'bg-slate-600',
      accent: 'bg-blue-600'
    }
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Cores vibrantes e futurísticas',
    icon: <Zap className="h-4 w-4" />,
    preview: {
      primary: 'bg-purple-600',
      secondary: 'bg-cyan-500',
      accent: 'bg-black'
    }
  },
  {
    id: 'glass',
    name: 'Vidro',
    description: 'Efeito glassmorphism moderno',
    icon: <Eye className="h-4 w-4" />,
    preview: {
      primary: 'bg-gradient-to-r from-blue-400/80 to-purple-500/80',
      secondary: 'bg-white/20',
      accent: 'bg-white/40'
    }
  }
];

export function VoiceThemeSelector({ 
  open, 
  onOpenChange, 
  selectedTheme, 
  onThemeChange 
}: VoiceThemeSelectorProps) {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white shadow-2xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Temas de Voz</h3>
                <p className="text-sm text-gray-500">Personalize a aparência das mensagens de áudio</p>
              </div>
            </div>

            {/* Theme grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {themes.map((theme) => (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: themes.indexOf(theme) * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                    selectedTheme === theme.id 
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                      : hoveredTheme === theme.id
                        ? 'border-gray-300 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onThemeChange(theme.id)}
                  onMouseEnter={() => setHoveredTheme(theme.id)}
                  onMouseLeave={() => setHoveredTheme(null)}
                >
                  {/* Selected indicator */}
                  <AnimatePresence>
                    {selectedTheme === theme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2 z-10"
                      >
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-4">
                    {/* Theme preview */}
                    <div className="relative h-24 mb-3 rounded-lg overflow-hidden">
                      {/* Background pattern */}
                      <div className={`absolute inset-0 ${theme.preview.accent}`} />
                      
                      {/* Sample audio message */}
                      <div className="absolute bottom-2 right-2">
                        <div className={`${theme.preview.primary} rounded-lg p-2 shadow-sm`}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-0.5 bg-white/60 rounded-full"
                                  style={{ height: `${4 + Math.sin(i * 0.8) * 3}px` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sample received message */}
                      <div className="absolute bottom-2 left-2">
                        <div className={`${theme.preview.secondary} rounded-lg p-2 shadow-sm`}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-400/20 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-600 rounded-full" />
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-0.5 bg-gray-600/60 rounded-full"
                                  style={{ height: `${3 + Math.sin(i * 1.2) * 2}px` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Theme info */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {theme.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{theme.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{theme.description}</p>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <AnimatePresence>
                      {hoveredTheme === theme.id && selectedTheme !== theme.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-blue-500/5 rounded-xl flex items-center justify-center"
                        >
                          <Badge variant="secondary" className="bg-blue-500 text-white">
                            Clique para selecionar
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="h-4 w-4" />
                <span>Tema será aplicado imediatamente</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                >
                  Pronto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}