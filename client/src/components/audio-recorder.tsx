import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Play, Pause, Square, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
  onSend: (audioData: string, duration: number) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsPermissionGranted(true);
      streamRef.current = stream;
      stream.getTracks().forEach(track => track.stop()); // Stop immediate stream
    } catch (error) {
      console.error('Microfone permission denied:', error);
      setPermissionError('Permissão de microfone negada. Por favor, permita o acesso ao microfone.');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (!isPermissionGranted) {
        await checkMicrophonePermission();
        if (!isPermissionGranted) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        setRecordedAudio(audioUrl);
        
        // Convert to base64 for sending
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          setRecordedAudio(base64String);
        };
        reader.readAsDataURL(blob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setPermissionError('Erro ao iniciar gravação. Verifique as permissões do microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (recordedAudio && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      
      // Update current time while playing
      const updateTime = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      audioRef.current.addEventListener('timeupdate', updateTime);
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        audioRef.current?.removeEventListener('timeupdate', updateTime);
      });
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setRecordedAudio(null);
    setDuration(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const sendAudio = () => {
    if (recordedAudio) {
      onSend(recordedAudio, duration);
    }
  };

  if (permissionError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4"
      >
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <MicOff className="mx-auto h-12 w-12 text-red-500 mb-2" />
              <p className="text-red-700 font-medium">Permissão de Microfone Necessária</p>
              <p className="text-red-600 text-sm mt-1">{permissionError}</p>
              <div className="flex gap-2 mt-4 justify-center">
                <Button onClick={checkMicrophonePermission} size="sm">
                  Tentar Novamente
                </Button>
                <Button onClick={onCancel} variant="outline" size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4"
    >
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <motion.div
                animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
                className={`p-4 rounded-full ${
                  isRecording 
                    ? 'bg-red-100 border-2 border-red-300' 
                    : 'bg-blue-100 border-2 border-blue-300'
                }`}
              >
                {isRecording ? (
                  <Mic className="h-8 w-8 text-red-600" />
                ) : (
                  <Mic className="h-8 w-8 text-blue-600" />
                )}
              </motion.div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-gray-700">
                {isRecording ? 'Gravando...' : recordedAudio ? 'Áudio Gravado' : 'Gravar Áudio'}
              </p>
              <p className="text-2xl font-mono text-gray-800">
                {formatTime(isRecording ? duration : recordedAudio ? duration : 0)}
              </p>
            </div>

            {/* Recording Controls */}
            {!recordedAudio && (
              <div className="flex gap-3 justify-center">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    size="lg"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Gravar
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                    size="lg"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Parar
                  </Button>
                )}
                <Button onClick={onCancel} variant="outline" size="lg">
                  Cancelar
                </Button>
              </div>
            )}

            {/* Playback Controls */}
            {recordedAudio && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">0:00</span>
                  <Progress 
                    value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">{formatTime(duration)}</span>
                </div>
                
                <div className="flex gap-2 justify-center">
                  {!isPlaying ? (
                    <Button
                      onClick={playAudio}
                      variant="outline"
                      size="lg"
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Reproduzir
                    </Button>
                  ) : (
                    <Button
                      onClick={pauseAudio}
                      variant="outline"
                      size="lg"
                      className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                  
                  <Button
                    onClick={deleteRecording}
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  
                  <Button
                    onClick={sendAudio}
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden audio element for playback */}
      {recordedAudio && (
        <audio
          ref={audioRef}
          src={recordedAudio}
          style={{ display: 'none' }}
        />
      )}
    </motion.div>
  );
}