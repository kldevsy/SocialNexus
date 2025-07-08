import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Pause, Volume2, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioMessageProps {
  audioUrl: string;
  duration: number;
  timestamp: string;
  isOwn?: boolean;
}

export function AudioMessage({ audioUrl, duration, timestamp, isOwn = false }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [actualDuration, setActualDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Força o componente a não ficar em loading, já que temos os dados
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
        console.log('Audio loadstart event');
        // Não vamos mais colocar em loading state
        setHasError(false);
      };
      
      const handleCanPlay = () => {
        console.log('Audio canplay event');
        setIsBuffering(false);
      };
      
      const handleLoadedMetadata = () => {
        console.log('Audio loadedmetadata event, duration:', audio.duration);
        setActualDuration(audio.duration || duration || 1);
      };
      
      const handleWaiting = () => {
        setIsBuffering(true);
      };
      
      const handlePlaying = () => {
        setIsBuffering(false);
      };
      
      const handleError = (e: Event) => {
        console.error('Audio error event:', e);
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || isLoading || hasError) return;
    
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        setIsBuffering(true);
        await audio.play();
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

  // Debug logs
  console.log('AudioMessage state:', { 
    isLoading, 
    hasError, 
    audioUrlExists: !!audioUrl, 
    actualDuration,
    audioUrlStart: audioUrl?.substring(0, 50)
  });

  // Show loading skeleton if audio is still loading
  if (isLoading && !hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <Card className={`max-w-sm ${
          isOwn 
            ? 'bg-blue-500/80 text-white border-blue-600' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Skeleton className={`h-10 w-10 rounded-full ${isOwn ? 'bg-blue-400/40' : 'bg-gray-200'}`} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className={`h-4 w-4 rounded ${isOwn ? 'bg-blue-400/40' : 'bg-gray-200'}`} />
                  <Skeleton className={`h-3 w-16 rounded ${isOwn ? 'bg-blue-400/40' : 'bg-gray-200'}`} />
                </div>
                <Skeleton className={`h-2 w-full rounded-full ${isOwn ? 'bg-blue-400/40' : 'bg-gray-200'}`} />
                <div className="flex items-center justify-between">
                  <Skeleton className={`h-3 w-8 rounded ${isOwn ? 'bg-blue-400/40' : 'bg-gray-200'}`} />
                  <Skeleton className={`h-4 w-4 rounded ${isOwn ? 'bg-blue-400/40' : 'bg-gray-200'}`} />
                </div>
              </div>
            </div>
            {/* Animated loading indicator */}
            <motion.div
              className={`mt-2 text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'} flex items-center gap-1`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando áudio...
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <Card className={`max-w-sm ${
          isOwn 
            ? 'bg-red-500 text-white border-red-600' 
            : 'bg-red-50 border-red-200'
        }`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                isOwn ? 'bg-red-400' : 'bg-red-100'
              }`}>
                <Volume2 className={`h-4 w-4 ${isOwn ? 'text-white' : 'text-red-500'}`} />
              </div>
              <div className={`flex-1 text-sm ${isOwn ? 'text-white' : 'text-red-700'}`}>
                Erro ao carregar áudio
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
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <Card className={`max-w-sm ${
        isOwn 
          ? 'bg-blue-500 text-white border-blue-600' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button with loading state */}
            <Button
              onClick={togglePlayPause}
              size="sm"
              variant={isOwn ? "secondary" : "outline"}
              className={`h-10 w-10 rounded-full p-0 relative ${
                isOwn 
                  ? 'bg-blue-400 hover:bg-blue-300 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              disabled={isLoading || hasError}
            >
              <AnimatePresence mode="wait">
                {isBuffering ? (
                  <motion.div
                    key="buffering"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </motion.div>
                ) : isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Pause className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Play className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* Waveform/Progress */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
                >
                  <Volume2 className={`h-4 w-4 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`} />
                </motion.div>
                <span className={`text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                  Mensagem de áudio
                </span>
              </div>
              
              {/* Animated waveform visualization */}
              <div 
                className="cursor-pointer relative"
                onClick={handleProgressClick}
              >
                <div className="flex items-center gap-1 h-8">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${
                        isOwn ? 'bg-blue-300' : 'bg-gray-300'
                      } ${
                        (currentTime / actualDuration) * 20 > i 
                          ? (isOwn ? 'bg-blue-100' : 'bg-blue-500') 
                          : ''
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
                  className={`h-1 mt-1 ${
                    isOwn ? 'bg-blue-400/30' : 'bg-gray-200'
                  }`}
                />
                
                {/* Buffering indicator */}
                <AnimatePresence>
                  {isBuffering && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center ${
                        isOwn ? 'bg-blue-500/20' : 'bg-gray-100/80'
                      } rounded backdrop-blur-sm`}
                    >
                      <Loader2 className={`h-4 w-4 animate-spin ${
                        isOwn ? 'text-blue-200' : 'text-gray-600'
                      }`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(currentTime)} / {formatTime(actualDuration)}
                </span>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={downloadAudio}
                    size="sm"
                    variant="ghost"
                    className={`h-6 w-6 p-0 transition-colors ${
                      isOwn 
                        ? 'text-blue-200 hover:bg-blue-400 hover:text-white' 
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
            {new Date(timestamp).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </CardContent>
      </Card>

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