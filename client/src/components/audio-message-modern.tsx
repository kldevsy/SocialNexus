import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Play, Pause, Download, Loader2, Heart, Reply, MessageSquare, MoreHorizontal, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioMessageProps {
  audioUrl: string;
  duration: number;
  timestamp: string;
  isOwn?: boolean;
  theme?: 'default' | 'minimal' | 'professional' | 'neon' | 'glass';
  onReact?: (reaction: string) => void;
  onReply?: () => void;
  onTranscribe?: () => void;
  reactions?: { emoji: string; count: number; hasReacted: boolean }[];
  transcription?: string;
}

export function AudioMessageModern({ 
  audioUrl, 
  duration, 
  timestamp, 
  isOwn = false,
  theme = 'default',
  onReact,
  onReply,
  onTranscribe,
  reactions = [],
  transcription 
}: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [actualDuration, setActualDuration] = useState(duration);
  const [showReactions, setShowReactions] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Definir estilos do tema
  const getThemeStyles = () => {
    const baseStyles = "relative overflow-hidden transition-all duration-300";
    
    switch (theme) {
      case 'minimal':
        return {
          card: `${baseStyles} ${isOwn ? 'bg-blue-500/90 border-blue-600' : 'bg-white border-gray-100'} shadow-sm`,
          text: isOwn ? 'text-white' : 'text-gray-700',
          accent: isOwn ? 'text-blue-100' : 'text-blue-500'
        };
      case 'professional':
        return {
          card: `${baseStyles} ${isOwn ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} shadow-lg`,
          text: isOwn ? 'text-slate-100' : 'text-slate-800',
          accent: isOwn ? 'text-blue-300' : 'text-blue-600'
        };
      case 'neon':
        return {
          card: `${baseStyles} ${isOwn ? 'bg-purple-600 border-purple-500 shadow-purple-500/25' : 'bg-cyan-50 border-cyan-200 shadow-cyan-500/10'} shadow-xl`,
          text: isOwn ? 'text-purple-100' : 'text-cyan-800',
          accent: isOwn ? 'text-purple-200' : 'text-cyan-600'
        };
      case 'glass':
        return {
          card: `${baseStyles} ${isOwn ? 'bg-black/20 border-white/20 backdrop-blur-md' : 'bg-white/40 border-gray-200/30 backdrop-blur-md'} shadow-2xl`,
          text: isOwn ? 'text-white' : 'text-gray-800',
          accent: isOwn ? 'text-blue-200' : 'text-blue-600'
        };
      default:
        return {
          card: `${baseStyles} ${isOwn ? 'bg-blue-500/80 border-blue-600' : 'bg-white border-gray-200'} shadow-sm`,
          text: isOwn ? 'text-white' : 'text-gray-700',
          accent: isOwn ? 'text-blue-100' : 'text-blue-500'
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Função de transcrição simulada
  const handleTranscribe = async () => {
    if (onTranscribe && !isTranscribing) {
      setIsTranscribing(true);
      setTimeout(() => {
        setIsTranscribing(false);
        onTranscribe();
      }, 2000);
    }
  };

  // Reações rápidas
  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  const handleQuickReaction = (emoji: string) => {
    if (onReact) {
      onReact(emoji);
    }
    setShowReactions(false);
  };

  useEffect(() => {
    // Força o componente a não ficar em loading
    setIsLoading(false);
    setActualDuration(duration || 1);
    
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      
      const handleLoadStart = () => {
        setHasError(false);
      };
      
      const handleCanPlay = () => {
        setIsBuffering(false);
      };
      
      const handleLoadedMetadata = () => {
        setActualDuration(audio.duration || duration || 1);
      };
      
      const handleWaiting = () => {
        setIsBuffering(true);
      };
      
      const handlePlaying = () => {
        setIsBuffering(false);
      };
      
      const handleError = () => {
        setIsBuffering(false);
        setHasError(true);
        setIsPlaying(false);
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('playing', handlePlaying);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [audioUrl, duration]);

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || hasError) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsBuffering(true);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setHasError(true);
        setIsBuffering(false);
      }
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && !isLoading && !hasError) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * actualDuration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const downloadAudio = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `audio_${timestamp}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <Card className={themeStyles.card}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isOwn ? 'bg-red-400/20' : 'bg-red-50'}`}>
                <Mic className={`h-5 w-5 ${isOwn ? 'text-red-200' : 'text-red-500'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${themeStyles.text}`}>Erro ao carregar áudio</p>
                <p className={`text-xs ${themeStyles.accent}`}>Tente novamente mais tarde</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className="flex flex-col gap-2 max-w-sm">
        <Card className={themeStyles.card}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <motion.div 
                className={`p-3 rounded-full ${isOwn ? 'bg-white/20' : 'bg-blue-50'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mic className={`h-5 w-5 ${themeStyles.accent}`} />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={`text-xs ${themeStyles.accent}`}>
                    Mensagem de voz
                  </Badge>
                  <span className={`text-xs ${themeStyles.accent}`}>
                    {formatTime(actualDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Audio controls */}
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={togglePlayPause}
                  size="sm"
                  variant="ghost"
                  className={`h-12 w-12 rounded-full p-0 ${themeStyles.accent} hover:bg-white/10`}
                  disabled={isLoading || hasError}
                >
                  <AnimatePresence mode="wait">
                    {isBuffering ? (
                      <motion.div
                        key="buffering"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </motion.div>
                    ) : isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Pause className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Play className="h-5 w-5 ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* Waveform and Progress */}
              <div className="flex-1">
                <div 
                  className="relative h-12 flex items-center cursor-pointer"
                  onClick={handleProgressClick}
                >
                  {/* Animated Waveform */}
                  <div className="flex items-center justify-center h-8 gap-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-1 rounded-full ${
                          (currentTime / actualDuration) * 20 > i 
                            ? themeStyles.accent
                            : isOwn ? 'bg-white/30' : 'bg-gray-300'
                        }`}
                        style={{
                          height: `${8 + (Math.sin(i * 0.5) * 4 + Math.random() * 8)}px`
                        }}
                        animate={isPlaying && (currentTime / actualDuration) * 20 > i ? {
                          scaleY: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        } : {}}
                        transition={{
                          duration: 0.5,
                          repeat: isPlaying ? Infinity : 0,
                          delay: i * 0.05
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Progress overlay */}
                  <Progress 
                    value={actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0}
                    className={`h-1 absolute bottom-0 left-0 right-0 ${
                      isOwn ? 'bg-white/20' : 'bg-gray-200'
                    }`}
                  />
                </div>
                
                {/* Time display */}
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${themeStyles.accent}`}>
                    {formatTime(currentTime)} / {formatTime(actualDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {/* Reaction button */}
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      onClick={() => setShowReactions(!showReactions)}
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 ${themeStyles.accent} hover:bg-white/10`}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <AnimatePresence>
                    {showReactions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-2 p-2 ${
                          isOwn ? 'bg-white/90' : 'bg-gray-800/90'
                        } rounded-lg shadow-lg backdrop-blur-sm z-10`}
                      >
                        <div className="flex gap-1">
                          {quickReactions.map((emoji) => (
                            <motion.button
                              key={emoji}
                              onClick={() => handleQuickReaction(emoji)}
                              className="p-2 hover:bg-white/20 rounded transition-colors"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reply button */}
                {onReply && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      onClick={onReply}
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 ${themeStyles.accent} hover:bg-white/10`}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Transcription button */}
                {onTranscribe && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      onClick={handleTranscribe}
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 ${themeStyles.accent} hover:bg-white/10`}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Download button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={downloadAudio}
                    size="sm"
                    variant="ghost"
                    className={`h-8 w-8 p-0 ${themeStyles.accent} hover:bg-white/10`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </motion.div>

                {/* More options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-8 w-8 p-0 ${themeStyles.accent} hover:bg-white/10`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "end" : "start"}>
                    <DropdownMenuItem onClick={() => console.log('Copiar link')}>
                      Copiar link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log('Salvar áudio')}>
                      Salvar áudio
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log('Compartilhar')}>
                      Compartilhar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reactions display */}
        {reactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            {reactions.map((reaction, index) => (
              <motion.div
                key={`${reaction.emoji}-${index}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  reaction.hasReacted 
                    ? isOwn ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                    : isOwn ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-600'
                }`}
                onClick={() => onReact && onReact(reaction.emoji)}
                style={{ cursor: 'pointer' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Transcription display */}
        {transcription && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`${isOwn ? 'text-right' : 'text-left'}`}
          >
            <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
              isOwn 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs font-medium">Transcrição:</span>
              </div>
              <p>{transcription}</p>
            </div>
          </motion.div>
        )}

        {/* Timestamp */}
        <div className={`text-xs ${themeStyles.accent} ${isOwn ? 'text-right' : 'text-left'}`}>
          {new Date(timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </motion.div>
  );
}