import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { 
  Mic, 
  MicOff, 
  Headphones, 
  VolumeX, 
  Volume2, 
  PhoneOff, 
  Settings, 
  Minimize2, 
  Maximize2,
  Activity,
  Move
} from "lucide-react";

interface VoiceControlPanelProps {
  isConnected: boolean;
  channelName: string;
  userCount: number;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  onClose: () => void;
  stream: MediaStream | null;
}

export function VoiceControlPanel({
  isConnected,
  channelName,
  userCount,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  onClose,
  stream
}: VoiceControlPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [micSensitivity, setMicSensitivity] = useState([50]);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 350 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight - 500 : 0 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const panelRef = useRef<HTMLDivElement>(null);

  // Voice activity detection
  useEffect(() => {
    if (!stream || isMuted) {
      setVoiceLevel(0);
      setIsVoiceActive(false);
      return;
    }

    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const analyzeAudio = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        
        setVoiceLevel(normalizedLevel);
        setIsVoiceActive(normalizedLevel > micSensitivity[0]);
        
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };
      
      analyzeAudio();
    } catch (error) {
      console.error('Error setting up voice detection:', error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, isMuted, micSensitivity]);

  // Drag functionality
  const handleDragStart = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on buttons or input elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('slider')) {
      console.log('Blocked drag on button/input');
      return;
    }
    
    console.log('Starting drag', { x: e.clientX, y: e.clientY, position });
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    console.log('Moving', { newX, newY, clientX: e.clientX, clientY: e.clientY });
    
    // Keep panel within screen bounds
    const panelWidth = panelRef.current?.offsetWidth || 320;
    const panelHeight = panelRef.current?.offsetHeight || 450;
    const maxX = window.innerWidth - panelWidth;
    const maxY = window.innerHeight - panelHeight;
    
    const finalPos = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };
    
    console.log('Setting position', finalPos);
    setPosition(finalPos);
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    console.log('Drag ended');
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle close with disconnect
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDisconnect(); // Disconnect from voice channel
    onClose(); // Close panel
  };

  // Handle minimize
  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  if (!isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isMinimized ? 'auto' : '320px',
          minWidth: isMinimized ? '200px' : '320px'
        }}
      >
        <Card className="bg-gray-900/95 backdrop-blur-lg border-gray-700 text-white shadow-2xl overflow-hidden select-none">
          <motion.div
            animate={{ 
              height: isMinimized ? "70px" : "auto",
              opacity: 1 
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Header - Drag Area */}
            <div 
              className="flex items-center justify-between p-4 border-b border-gray-700 select-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleDragStart}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-sm">#{channelName}</h3>
                  <p className="text-xs text-gray-400">{userCount} usuário{userCount !== 1 ? 's' : ''}</p>
                </div>
                <Move className={`h-4 w-4 ml-2 ${isDragging ? 'text-blue-400' : 'text-gray-500'}`} />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={handleMinimize}
                  className="text-gray-400 hover:text-white w-8 h-8 p-0 shrink-0 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  type="button"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-red-400 w-8 h-8 p-0 shrink-0 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  type="button"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            </div>

            {/* Controls */}
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 space-y-4"
              >
                {/* Voice Activity Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Atividade de Voz</span>
                    <div className="flex items-center space-x-2">
                      <Activity className={`h-3 w-3 ${isVoiceActive ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className="text-xs text-gray-400">{Math.round(voiceLevel)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${isVoiceActive ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${voiceLevel}%` }}
                      animate={{ scale: isVoiceActive ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.3, repeat: isVoiceActive ? Infinity : 0 }}
                    />
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="sm"
                    onClick={onToggleMute}
                    className="w-12 h-12 rounded-full relative"
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    {isVoiceActive && !isMuted && (
                      <motion.div
                        className="absolute inset-0 border-2 border-green-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </Button>
                  
                  <Button
                    variant={isDeafened ? "destructive" : "secondary"}
                    size="sm"
                    onClick={onToggleDeafen}
                    className="w-12 h-12 rounded-full"
                  >
                    {isDeafened ? <VolumeX className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDisconnect}
                    className="w-12 h-12 rounded-full"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>

                {/* Volume Controls */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 flex items-center">
                        <Volume2 className="h-3 w-3 mr-1" />
                        Volume
                      </span>
                      <span className="text-xs text-gray-400">{volume[0]}%</span>
                    </div>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 flex items-center">
                        <Mic className="h-3 w-3 mr-1" />
                        Sensibilidade
                      </span>
                      <span className="text-xs text-gray-400">{micSensitivity[0]}%</span>
                    </div>
                    <Slider
                      value={micSensitivity}
                      onValueChange={setMicSensitivity}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="text-center pt-2 border-t border-gray-700">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Conectado</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isDragging ? 'Movendo painel...' : 'Arraste o header para mover • Audio WebRTC ativo'}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}