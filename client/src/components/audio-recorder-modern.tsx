import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Square, 
  Send, 
  X, 
  Volume2,
  Activity,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
  onSend: (audioData: string, duration: number) => void;
  onCancel: () => void;
  theme?: 'default' | 'minimal' | 'professional' | 'neon' | 'glass';
}

export function AudioRecorderModern({ 
  onSend, 
  onCancel,
  theme = 'default' 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Definir estilos do tema
  const getThemeStyles = () => {
    const baseStyles = "relative overflow-hidden transition-all duration-300";
    
    switch (theme) {
      case 'minimal':
        return {
          card: `${baseStyles} bg-white border-gray-100 shadow-sm`,
          primary: 'bg-blue-500 hover:bg-blue-600 text-white',
          secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          accent: 'text-blue-500',
          surface: 'bg-gray-50'
        };
      case 'professional':
        return {
          card: `${baseStyles} bg-slate-800 border-slate-700 shadow-xl`,
          primary: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondary: 'bg-slate-600 hover:bg-slate-500 text-slate-100',
          accent: 'text-blue-400',
          surface: 'bg-slate-700'
        };
      case 'neon':
        return {
          card: `${baseStyles} bg-black border-purple-500 shadow-purple-500/25 shadow-xl`,
          primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30',
          secondary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/30',
          accent: 'text-purple-400',
          surface: 'bg-gray-900'
        };
      case 'glass':
        return {
          card: `${baseStyles} bg-white/20 border-white/20 backdrop-blur-xl shadow-2xl`,
          primary: 'bg-blue-500/80 hover:bg-blue-600/80 text-white backdrop-blur-sm',
          secondary: 'bg-black/20 hover:bg-black/30 text-white backdrop-blur-sm',
          accent: 'text-blue-300',
          surface: 'bg-white/10'
        };
      default:
        return {
          card: `${baseStyles} bg-white border-gray-200 shadow-lg`,
          primary: 'bg-blue-500 hover:bg-blue-600 text-white',
          secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          accent: 'text-blue-500',
          surface: 'bg-blue-50'
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Animar níveis de áudio
  const animateAudioLevel = () => {
    if (!analyserRef.current || !isRecording || isPaused) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);
    
    animationRef.current = requestAnimationFrame(animateAudioLevel);
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Iniciar gravação
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Configurar análise de áudio
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setHasRecorded(true);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Animação de níveis
      animateAudioLevel();
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
    }
  };

  // Pausar/retomar gravação
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      animateAudioLevel();
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  // Reproduzir/pausar gravação
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Enviar áudio
  const handleSend = async () => {
    if (!recordedBlob) return;
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSend(base64, recordingTime);
      };
      reader.readAsDataURL(recordedBlob);
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
    }
  };

  // Cancelar
  const handleCancel = () => {
    stopRecording();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    onCancel();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, []);

  // Audio playback event handlers
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        setPlaybackTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
        audio.currentTime = 0;
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [recordedUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className={`w-full max-w-md ${themeStyles.card}`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className={`p-2 rounded-full ${themeStyles.surface}`}
                animate={isRecording && !isPaused ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Mic className={`h-5 w-5 ${themeStyles.accent}`} />
              </motion.div>
              <div>
                <h3 className={`font-semibold ${theme === 'professional' || theme === 'neon' ? 'text-white' : 'text-gray-900'}`}>
                  Gravação de Voz
                </h3>
                <p className={`text-sm ${theme === 'professional' || theme === 'neon' ? 'text-gray-300' : 'text-gray-500'}`}>
                  {hasRecorded ? 'Gravação concluída' : isRecording ? 'Gravando...' : 'Pressione para gravar'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleCancel}
              size="sm"
              variant="ghost"
              className={`h-8 w-8 p-0 ${theme === 'professional' || theme === 'neon' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Audio visualizer */}
          <div className={`relative h-20 ${themeStyles.surface} rounded-lg mb-6 flex items-center justify-center overflow-hidden`}>
            {isRecording && !isPaused ? (
              <div className="flex items-center gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-1 rounded-full ${themeStyles.accent.replace('text-', 'bg-')}`}
                    animate={{
                      height: [4, 8 + audioLevel * 30, 4],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.05
                    }}
                  />
                ))}
              </div>
            ) : hasRecorded ? (
              <div className="flex items-center gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full bg-gray-300`}
                    style={{
                      height: `${8 + Math.sin(i * 0.5) * 8}px`
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className={`flex items-center gap-2 ${theme === 'professional' || theme === 'neon' ? 'text-gray-400' : 'text-gray-500'}`}>
                <Activity className="h-6 w-6" />
                <span className="text-sm">Pronto para gravar</span>
              </div>
            )}
          </div>

          {/* Time display */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Clock className={`h-4 w-4 ${themeStyles.accent}`} />
            <Badge variant="secondary" className={`${themeStyles.accent} px-3 py-1`}>
              {formatTime(hasRecorded && isPlaying ? playbackTime : recordingTime)}
            </Badge>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {!hasRecorded ? (
              <>
                {!isRecording ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className={`h-16 w-16 rounded-full ${themeStyles.primary}`}
                    >
                      <Mic className="h-6 w-6" />
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={togglePause}
                        size="lg"
                        variant="outline"
                        className={`h-12 w-12 rounded-full ${themeStyles.secondary}`}
                      >
                        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        className={`h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white`}
                      >
                        <Square className="h-6 w-6" />
                      </Button>
                    </motion.div>
                  </>
                )}
              </>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={togglePlayback}
                    size="lg"
                    variant="outline"
                    className={`h-12 w-12 rounded-full ${themeStyles.secondary}`}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSend}
                    size="lg"
                    className={`h-16 w-16 rounded-full ${themeStyles.primary}`}
                  >
                    <Send className="h-6 w-6" />
                  </Button>
                </motion.div>
              </>
            )}
          </div>

          {/* Progress bar for playback */}
          {hasRecorded && (
            <div className="space-y-2">
              <Progress 
                value={recordingTime > 0 ? (playbackTime / recordingTime) * 100 : 0} 
                className="h-2"
              />
              <div className={`flex justify-between text-xs ${theme === 'professional' || theme === 'neon' ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(recordingTime)}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className={`text-center text-xs ${theme === 'professional' || theme === 'neon' ? 'text-gray-400' : 'text-gray-500'} mt-4`}>
            {!hasRecorded ? (
              isRecording ? 
                'Pressione o quadrado para parar a gravação' : 
                'Pressione o microfone para começar a gravar'
            ) : (
              'Pressione o botão de envio para enviar a mensagem'
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden audio element for playback */}
      {recordedUrl && (
        <audio
          ref={audioRef}
          src={recordedUrl}
          style={{ display: 'none' }}
        />
      )}
    </motion.div>
  );
}