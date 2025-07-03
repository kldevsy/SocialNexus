import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Target,
  MousePointer,
  MessageSquare,
  Plus,
  Settings,
  Users,
  Hash,
  Volume2,
  Mic,
  Smile,
  Image,
  Crown,
  CheckCircle
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  highlight?: boolean;
  pulse?: boolean;
}

interface OnboardingTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao CommunityHub!",
    description: "Vamos fazer um tour rápido pela plataforma. Este tutorial levará apenas 2 minutos!",
    icon: <Sparkles className="h-6 w-6" />,
    highlight: true,
  },
  {
    id: "servers",
    title: "Seus Servidores",
    description: "Aqui você vê todos os servidores que criou ou participa. Clique no nome para entrar!",
    icon: <Crown className="h-6 w-6" />,
    target: "[data-tutorial='servers-list']",
    position: "right",
    pulse: true,
  },
  {
    id: "create-server",
    title: "Criar Servidor",
    description: "Clique aqui para criar seu próprio servidor e convidar amigos!",
    icon: <Plus className="h-6 w-6" />,
    target: "[data-tutorial='create-server']",
    position: "bottom",
    action: "click",
  },
  {
    id: "discover",
    title: "Descobrir Comunidades",
    description: "Explore servidores públicos por categoria. Encontre comunidades incríveis para participar!",
    icon: <Target className="h-6 w-6" />,
    target: "[data-tutorial='discover-servers']",
    position: "left",
  },
  {
    id: "channels",
    title: "Canais",
    description: "Os canais organizam as conversas. # são para texto e 🔊 são para voz.",
    icon: <Hash className="h-6 w-6" />,
    target: "[data-tutorial='channels-list']",
    position: "right",
  },
  {
    id: "chat",
    title: "Chat Avançado",
    description: "Digite mensagens, envie imagens, crie embeds incríveis e muito mais!",
    icon: <MessageSquare className="h-6 w-6" />,
    target: "[data-tutorial='message-input']",
    position: "top",
    pulse: true,
  },
  {
    id: "embeds",
    title: "Sistema de Embeds",
    description: "Clique no + para acessar embeds, arquivos, menções e gravação de áudio!",
    icon: <Smile className="h-6 w-6" />,
    target: "[data-tutorial='quick-actions']",
    position: "top",
    action: "hover",
  },
  {
    id: "voice",
    title: "Chat de Voz",
    description: "Conecte-se aos canais de voz para conversar com qualidade profissional!",
    icon: <Mic className="h-6 w-6" />,
    target: "[data-tutorial='voice-channel']",
    position: "right",
  },
  {
    id: "members",
    title: "Lista de Membros",
    description: "Veja quem está online, seus status e interaja com outros usuários!",
    icon: <Users className="h-6 w-6" />,
    target: "[data-tutorial='members-list']",
    position: "left",
  },
  {
    id: "profile",
    title: "Seu Perfil",
    description: "Personalize seu perfil, status e configurações da conta aqui!",
    icon: <Settings className="h-6 w-6" />,
    target: "[data-tutorial='profile-button']",
    position: "bottom",
  },
  {
    id: "complete",
    title: "Tutorial Completo! 🎉",
    description: "Agora você está pronto para explorar o CommunityHub. Divirta-se criando e participando de comunidades incríveis!",
    icon: <CheckCircle className="h-6 w-6" />,
    highlight: true,
  },
];

export function OnboardingTutorial({ isVisible, onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  useEffect(() => {
    if (isVisible) {
      setIsPlaying(true);
      setCurrentStep(0);
    }
  }, [isVisible]);

  useEffect(() => {
    if (step?.target && isPlaying) {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        // Add highlight to target element
        targetElement.classList.add('tutorial-highlight');
        
        // Clean up highlight when moving to next step
        return () => {
          targetElement.classList.remove('tutorial-highlight');
        };
      }
    }
  }, [currentStep, step, isPlaying]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsPlaying(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsPlaying(false);
    onSkip();
  };

  const getTooltipPosition = () => {
    if (!step?.target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = targetElement.getBoundingClientRect();
    const position = step.position || 'bottom';

    switch (position) {
      case 'top':
        return {
          top: rect.top - 10,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0%)',
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - 10,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + 10,
          transform: 'translate(0%, -50%)',
        };
      default:
        return {
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0%)',
        };
    }
  };

  if (!isVisible || !isPlaying) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Tutorial Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed z-50 w-80"
          style={step?.target ? getTooltipPosition() : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <Card className={`shadow-xl border-2 ${step?.highlight ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50' : 'border-gray-200'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${step?.highlight ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {step?.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step?.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {currentStep + 1} de {tutorialSteps.length}
                      </Badge>
                      {step?.action && (
                        <Badge variant="secondary" className="text-xs">
                          {step.action === 'click' ? '👆 Clique' : '🖱️ Passe o mouse'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {step?.description}
              </p>

              <Progress value={progress} className="h-2" />

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>

                <Button
                  onClick={nextStep}
                  size="sm"
                  className={`flex items-center space-x-1 ${step?.highlight ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <span>{currentStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Próximo'}</span>
                  {currentStep === tutorialSteps.length - 1 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {step?.pulse && (
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-flex items-center space-x-1 text-xs text-blue-600"
                  >
                    <MousePointer className="h-3 w-3" />
                    <span>Interaja com o elemento destacado</span>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Arrow pointer */}
          {step?.target && step?.position && (
            <div 
              className={`absolute w-0 h-0 ${
                step.position === 'top' ? 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-l-8 border-r-8 border-t-8 border-transparent border-t-white' :
                step.position === 'bottom' ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-l-8 border-r-8 border-b-8 border-transparent border-b-white' :
                step.position === 'left' ? 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-white' :
                'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-white'
              }`}
            />
          )}
        </motion.div>
      </AnimatePresence>


    </>
  );
}