import { motion } from "framer-motion";
import { MessageCircle, Server, Palette, Zap, Play, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-white rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white rounded-full opacity-15 animate-pulse"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-white rounded-full opacity-25 animate-ping"></div>
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
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Connect. Create. <span className="text-yellow-300">Collaborate.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto">
            The next-generation community platform that brings people together with powerful tools, 
            beautiful design, and seamless communication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Start Building Your Community
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button 
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Preview */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <GlassCard variant="light" className="p-6 transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <Server className="text-white h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">Custom Servers</h3>
              <p className="text-gray-200">Create unlimited servers with advanced customization options and permissions.</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <GlassCard variant="light" className="p-6 transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mb-4">
                <Palette className="text-white h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">Rich Profiles</h3>
              <p className="text-gray-200">Personalize your profile with custom themes, badges, and rich media content.</p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <GlassCard variant="light" className="p-6 transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-white h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">Lightning Fast</h3>
              <p className="text-gray-200">Experience real-time messaging with zero lag and instant notifications.</p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
