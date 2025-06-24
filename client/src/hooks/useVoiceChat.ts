import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface VoiceUser {
  userId: string;
  userName: string;
  isMuted: boolean;
  isDeafened: boolean;
}

export function useVoiceChat() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState<number | null>(null);
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [userCount, setUserCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Voice chat WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'user-joined':
            setVoiceUsers(prev => [...prev, {
              userId: message.userId,
              userName: message.userName,
              isMuted: false,
              isDeafened: false
            }]);
            break;
            
          case 'user-left':
            setVoiceUsers(prev => prev.filter(u => u.userId !== message.userId));
            break;
            
          case 'channel-users':
            setUserCount(message.userCount);
            break;
            
          case 'voice-signal':
            // Handle WebRTC signaling
            handleVoiceSignal(message);
            break;
        }
      } catch (error) {
        console.error('Voice chat message error:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('Voice chat WebSocket disconnected');
      setIsConnected(false);
      setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
    };
    
    ws.onerror = (error) => {
      console.error('Voice chat WebSocket error:', error);
    };
    
    wsRef.current = ws;
  }, []);
  
  // Handle WebRTC signaling
  const handleVoiceSignal = useCallback(async (message: any) => {
    const { fromUserId, signal } = message;
    
    if (!peerConnectionsRef.current.has(fromUserId)) {
      // Create new peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      // Add local stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, streamRef.current!);
        });
      }
      
      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        // Play remote audio
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play().catch(console.error);
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'voice-signal',
            channelId: currentChannelId,
            toUserId: fromUserId,
            signal: { candidate: event.candidate }
          }));
        }
      };
      
      peerConnectionsRef.current.set(fromUserId, pc);
    }
    
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;
    
    try {
      if (signal.offer) {
        await pc.setRemoteDescription(signal.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'voice-signal',
            channelId: currentChannelId,
            toUserId: fromUserId,
            signal: { answer }
          }));
        }
      } else if (signal.answer) {
        await pc.setRemoteDescription(signal.answer);
      } else if (signal.candidate) {
        await pc.addIceCandidate(signal.candidate);
      }
    } catch (error) {
      console.error('WebRTC signaling error:', error);
    }
  }, [currentChannelId]);
  
  // Join voice channel
  const joinVoiceChannel = useCallback(async (channelId: number) => {
    if (!user) return;
    
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      streamRef.current = stream;
      setCurrentChannelId(channelId);
      
      // Connect WebSocket if not connected
      if (!isConnected) {
        connectWebSocket();
      }
      
      // Join channel via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'join-voice-channel',
          channelId,
          userId: user.id,
          userName: user.firstName || user.username || 'User'
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      return false;
    }
  }, [user, isConnected, connectWebSocket]);
  
  // Leave voice channel
  const leaveVoiceChannel = useCallback(() => {
    if (currentChannelId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave-voice-channel',
        channelId: currentChannelId,
        userId: user?.id
      }));
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    setCurrentChannelId(null);
    setVoiceUsers([]);
    setUserCount(0);
  }, [currentChannelId, user]);
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);
  
  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    setIsDeafened(!isDeafened);
    // Note: In a real implementation, this would control audio output
  }, [isDeafened]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      leaveVoiceChannel();
    };
  }, [connectWebSocket, leaveVoiceChannel]);
  
  return {
    isConnected,
    currentChannelId,
    voiceUsers,
    userCount,
    isMuted,
    isDeafened,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen
  };
}