import { useState, useRef, useCallback } from 'react';

interface VoiceUser {
  userId: string;
  userName: string;
  isMuted: boolean;
  isDeafened: boolean;
}

export function useSimpleVoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedChannelId, setConnectedChannelId] = useState<number | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef<string>('');
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const remoteAudiosRef = useRef(new Map<string, HTMLAudioElement>());

  const createPeerConnection = useCallback((targetUserId: string) => {
    console.log('Creating peer connection for:', targetUserId);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Sending ICE candidate to:', targetUserId);
        wsRef.current.send(JSON.stringify({
          type: 'voice-signal',
          signal: { type: 'ice-candidate', candidate: event.candidate },
          targetUserId,
          fromUserId: currentUserIdRef.current,
          channelId: connectedChannelId
        }));
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', targetUserId);
      const remoteStream = event.streams[0];
      
      let audio = remoteAudiosRef.current.get(targetUserId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudiosRef.current.set(targetUserId, audio);
      }
      
      audio.srcObject = remoteStream;
      audio.volume = isDeafened ? 0 : 1;
      audio.play().catch(console.error);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state for', targetUserId, ':', pc.connectionState);
    };

    return pc;
  }, [connectedChannelId, isDeafened]);

  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    console.log('WebSocket message:', message.type, message);

    switch (message.type) {
      case 'channel-users':
        setUserCount(message.userCount);
        break;

      case 'user-joined':
        if (message.userId !== currentUserIdRef.current) {
          console.log('User joined, creating peer connection:', message.userId);
          setUsers(prev => [...prev.filter(u => u.userId !== message.userId), {
            userId: message.userId,
            userName: message.userName,
            isMuted: false,
            isDeafened: false
          }]);

          // Create peer connection and send offer
          const pc = createPeerConnection(message.userId);
          peerConnectionsRef.current.set(message.userId, pc);

          // Add local stream
          if (localStream) {
            localStream.getTracks().forEach(track => {
              pc.addTrack(track, localStream);
            });
          }

          // Create offer
          try {
            const offer = await pc.createOffer({ offerToReceiveAudio: true });
            await pc.setLocalDescription(offer);
            
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'voice-signal',
                signal: { type: 'offer', offer },
                targetUserId: message.userId,
                fromUserId: currentUserIdRef.current,
                channelId: connectedChannelId
              }));
              console.log('Sent offer to:', message.userId);
            }
          } catch (error) {
            console.error('Error creating offer:', error);
          }
        }
        break;

      case 'user-left':
        console.log('User left:', message.userId);
        setUsers(prev => prev.filter(u => u.userId !== message.userId));
        
        const pc = peerConnectionsRef.current.get(message.userId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(message.userId);
        }
        
        const audio = remoteAudiosRef.current.get(message.userId);
        if (audio) {
          audio.pause();
          audio.srcObject = null;
          remoteAudiosRef.current.delete(message.userId);
        }
        break;

      case 'voice-signal':
        await handleVoiceSignal(message);
        break;
    }
  }, [localStream, connectedChannelId, createPeerConnection]);

  const handleVoiceSignal = useCallback(async (message: any) => {
    const { signal, fromUserId, targetUserId } = message;
    
    if (targetUserId !== currentUserIdRef.current) return;
    
    console.log('Handling voice signal:', signal.type, 'from:', fromUserId);
    
    let pc = peerConnectionsRef.current.get(fromUserId);
    
    try {
      switch (signal.type) {
        case 'offer':
          if (!pc) {
            pc = createPeerConnection(fromUserId);
            peerConnectionsRef.current.set(fromUserId, pc);
            
            // Add local stream
            if (localStream) {
              localStream.getTracks().forEach(track => {
                pc!.addTrack(track, localStream);
              });
            }
          }
          
          await pc.setRemoteDescription(signal.offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'voice-signal',
              signal: { type: 'answer', answer },
              targetUserId: fromUserId,
              fromUserId: currentUserIdRef.current,
              channelId: connectedChannelId
            }));
            console.log('Sent answer to:', fromUserId);
          }
          break;

        case 'answer':
          if (pc) {
            await pc.setRemoteDescription(signal.answer);
            console.log('Set remote description (answer) for:', fromUserId);
          }
          break;

        case 'ice-candidate':
          if (pc && signal.candidate) {
            await pc.addIceCandidate(signal.candidate);
            console.log('Added ICE candidate from:', fromUserId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling voice signal:', error);
    }
  }, [localStream, connectedChannelId, createPeerConnection]);

  const connect = async (channelId: number, channelName: string, userId: string, userName: string) => {
    if (isConnecting || isConnected) return;
    
    console.log('Connecting to voice channel:', channelId);
    setIsConnecting(true);
    currentUserIdRef.current = userId;

    try {
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      setLocalStream(stream);
      console.log('Got local media stream');

      // Create WebSocket
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          type: 'join-voice-channel',
          channelId,
          userId,
          userName
        }));
        setIsConnected(true);
        setConnectedChannelId(channelId);
        setIsConnecting(false);
      };

      ws.onmessage = handleWebSocketMessage;
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('Error connecting to voice chat:', error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    console.log('Disconnecting from voice chat');
    
    if (wsRef.current) {
      if (connectedChannelId) {
        wsRef.current.send(JSON.stringify({
          type: 'leave-voice-channel',
          channelId: connectedChannelId,
          userId: currentUserIdRef.current
        }));
      }
      wsRef.current.close();
    }

    // Clean up peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Clean up audio elements
    remoteAudiosRef.current.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    remoteAudiosRef.current.clear();

    // Clean up local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setIsConnected(false);
    setConnectedChannelId(null);
    setUserCount(0);
    setUsers([]);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    
    remoteAudiosRef.current.forEach(audio => {
      audio.volume = newDeafened ? 0 : 1;
    });
  };

  return {
    isConnected,
    isConnecting,
    connectedChannelId,
    userCount,
    users,
    localStream,
    isMuted,
    isDeafened,
    voiceLevel,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen
  };
}