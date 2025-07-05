import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, Download } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
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
        setIsLoading(true);
      };
      
      const handleCanPlay = () => {
        setIsLoading(false);
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      
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
            {/* Play/Pause Button */}
            <Button
              onClick={togglePlayPause}
              size="sm"
              variant={isOwn ? "secondary" : "outline"}
              className={`h-10 w-10 rounded-full p-0 ${
                isOwn 
                  ? 'bg-blue-400 hover:bg-blue-300 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            {/* Waveform/Progress */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className={`h-4 w-4 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`} />
                <span className={`text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                  Mensagem de áudio
                </span>
              </div>
              
              <div 
                className="cursor-pointer"
                onClick={handleProgressClick}
              >
                <Progress 
                  value={duration > 0 ? (currentTime / duration) * 100 : 0}
                  className={`h-2 ${
                    isOwn ? 'bg-blue-400' : 'bg-gray-200'
                  }`}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <Button
                  onClick={downloadAudio}
                  size="sm"
                  variant="ghost"
                  className={`h-6 w-6 p-0 ${
                    isOwn 
                      ? 'text-blue-200 hover:bg-blue-400' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Download className="h-3 w-3" />
                </Button>
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