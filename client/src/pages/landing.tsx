import { motion } from "framer-motion";
import { MessageCircle, Server, Palette, Zap, Play, Rocket, Shield, Users, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/auth/github";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700">
        <div className="absolute inset-0 opacity-20">
          {/* Floating Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-white rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white rounded-full opacity-15 animate-pulse"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-white rounded-full opacity-25 animate-ping"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 30h30v30H30zM0 0h30v30H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10">
        <GlassCard variant="light" className="mx-4 mt-4 sm:mx-6 lg:mx-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <MessageCircle className="text-primary text-xl" />
                </div>
                <span className="text-white font-bold text-xl">CommunityHub</span>
              </div>
              <div className="hidden md:flex space-x-8">
                <a href="#features" className="text-white hover:text-gray-200 transition-colors">Features</a>
                <a href="#pricing" className="text-white hover:text-gray-200 transition-colors">Pricing</a>
                <a href="#about" className="text-white hover:text-gray-200 transition-colors">About</a>
              </div>
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={handleLogin}
                  className="text-white hover:text-gray-200 hover:bg-white/10"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleLogin}
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6"
            >
              <Star className="mr-2 h-4 w-4 text-yellow-300" />
              Construa comunidades extraordinárias
            </motion.div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
            Conecte. Crie. <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Colabore.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed">
            A plataforma de comunidades de próxima geração que une pessoas com ferramentas poderosas, 
            design moderno e comunicação fluida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-white to-gray-100 text-primary hover:from-gray-100 hover:to-gray-200 px-10 py-6 text-lg font-semibold rounded-xl shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <Rocket className="mr-3 h-6 w-6" />
                Entrar com GitHub
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-10 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm transform hover:-translate-y-2 transition-all duration-300"
              >
                <Play className="mr-3 h-6 w-6" />
                Ver Demonstração
              </Button>
            </motion.div>
          </div>
          
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">10M+</div>
              <div className="text-gray-300 font-medium">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">500K+</div>
              <div className="text-gray-300 font-medium">Servidores Criados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">99.9%</div>
              <div className="text-gray-300 font-medium">Tempo de Atividade</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Recursos Extraordinários
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Descubra as funcionalidades que tornam nossa plataforma única
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <GlassCard variant="light" className="p-8 transform hover:-translate-y-4 transition-all duration-300 hover:shadow-2xl group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Server className="text-white h-8 w-8" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Servidores Personalizados</h3>
              <p className="text-gray-200 leading-relaxed">Crie servidores ilimitados com opções avançadas de personalização e permissões.</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <GlassCard variant="light" className="p-8 transform hover:-translate-y-4 transition-all duration-300 hover:shadow-2xl group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Palette className="text-white h-8 w-8" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Perfis Ricos</h3>
              <p className="text-gray-200 leading-relaxed">Personalize seu perfil com temas customizados, badges e conteúdo multimídia.</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <GlassCard variant="light" className="p-8 transform hover:-translate-y-4 transition-all duration-300 hover:shadow-2xl group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="text-white h-8 w-8" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Segurança Avançada</h3>
              <p className="text-gray-200 leading-relaxed">Proteção robusta com criptografia de ponta e moderação inteligente.</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <GlassCard variant="light" className="p-8 transform hover:-translate-y-4 transition-all duration-300 hover:shadow-2xl group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="text-white h-8 w-8" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Ultra Rápido</h3>
              <p className="text-gray-200 leading-relaxed">Mensagens em tempo real com zero lag e notificações instantâneas.</p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
