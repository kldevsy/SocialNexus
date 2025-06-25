import { useState, useRef, useCallback } from 'react';

export function useSimpleVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedChannelId, setConnectedChannelId] = useState<number | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef<string>('');
  const connectedChannelIdRef = useRef<number | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudiosRef = useRef(new Map<string, HTMLAudioElement>());

  const createPeerConnection = useCallback((userId: string) => {
    console.log(`Creating peer connection for ${userId}`);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc-signal',
          to: userId,
          from: currentUserIdRef.current,
          channelId: connectedChannelIdRef.current,
          signal: { type: 'ice', candidate: event.candidate.toJSON() }
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log(`🎵 Received audio track from ${userId}`, event.track.kind);
      const remoteStream = event.streams[0];
      
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        console.log(`🔊 Setting up audio playback for ${userId}`);
        
        // Create or get existing audio element
        let audio = remoteAudiosRef.current.get(userId);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          audio.controls = true; // Enable controls for debugging
          audio.volume = isDeafened ? 0 : 0.8;
          audio.muted = false;
          remoteAudiosRef.current.set(userId, audio);
          
          // Add to DOM visibly for debugging
          audio.id = `audio-${userId}`;
          audio.style.position = 'fixed';
          audio.style.top = '10px';
          audio.style.right = '10px';
          audio.style.zIndex = '9999';
          audio.style.background = 'white';
          audio.style.border = '2px solid red';
          document.body.appendChild(audio);
          
          console.log(`📺 Audio element created for ${userId}`);
        }
        
        audio.srcObject = remoteStream;
        
        // Force play with user interaction fallback
        const attemptPlay = async () => {
          try {
            await audio.play();
            console.log(`✅ Audio playing for ${userId}`);
          } catch (error) {
            console.error(`❌ Audio play failed for ${userId}:`, error);
            
            // Show click instruction
            const instruction = document.createElement('div');
            instruction.innerHTML = `Click to enable audio from ${userId}`;
            instruction.style.position = 'fixed';
            instruction.style.top = '50px';
            instruction.style.right = '10px';
            instruction.style.background = 'yellow';
            instruction.style.padding = '10px';
            instruction.style.cursor = 'pointer';
            instruction.style.zIndex = '10000';
            
            instruction.onclick = async () => {
              try {
                await audio.play();
                console.log(`✅ Audio enabled for ${userId} after user interaction`);
                instruction.remove();
              } catch (e) {
                console.error(`❌ Still failed to play audio:`, e);
              }
            };
            
            document.body.appendChild(instruction);
            setTimeout(() => instruction.remove(), 10000);
          }
        };
        
        attemptPlay();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}: ${pc.connectionState}`);
    };

    return pc;
  }, [isDeafened]);

  const handleSignal = useCallback(async (data: any) => {
    const { from, signal } = data;
    
    if (!from || from === currentUserIdRef.current) return;
    
    console.log(`Handling ${signal.type} from ${from}`);
    
    let pc = peerConnectionsRef.current.get(from);
    
    try {
      switch (signal.type) {
        case 'offer':
          if (!pc) {
            pc = createPeerConnection(from);
            peerConnectionsRef.current.set(from, pc);
          }
          
          // Add local stream
          const currentStream = localStreamRef.current;
          if (currentStream) {
            currentStream.getTracks().forEach(track => {
              pc!.addTrack(track, currentStream);
            });
          }
          
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          wsRef.current?.send(JSON.stringify({
            type: 'webrtc-signal',
            to: from,
            from: currentUserIdRef.current,
            channelId: connectedChannelIdRef.current,
            signal: { type: 'answer', answer: answer.toJSON() }
          }));
          break;

        case 'answer':
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          }
          break;

        case 'ice':
          if (pc && signal.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.warn(`ICE candidate error:`, e);
            }
          }
          break;
      }
    } catch (error) {
      console.error(`Error handling signal:`, error);
    }
  }, [createPeerConnection]);

  const connectToUser = useCallback(async (userId: string) => {
    if (peerConnectionsRef.current.has(userId)) return;
    
    const currentStream = localStreamRef.current;
    if (!currentStream) {
      console.warn(`No local stream for ${userId}`);
      return;
    }
    
    console.log(`Connecting to ${userId}`);
    
    const pc = createPeerConnection(userId);
    peerConnectionsRef.current.set(userId, pc);
    
    // Add local stream
    currentStream.getTracks().forEach(track => {
      pc.addTrack(track, currentStream);
    });
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'webrtc-signal',
        to: userId,
        from: currentUserIdRef.current,
        channelId: connectedChannelIdRef.current,
        signal: { type: 'offer', offer: offer.toJSON() }
      }));
    } catch (error) {
      console.error(`Error creating offer:`, error);
      peerConnectionsRef.current.delete(userId);
    }
  }, [createPeerConnection]);

  const connect = async (channelId: number, channelName: string, userId: string, userName: string) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    currentUserIdRef.current = userId;
    connectedChannelIdRef.current = channelId;
    
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      console.log('Audio stream acquired');
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Connect WebSocket
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${location.host}/ws`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          type: 'join-voice',
          channelId,
          userId,
          userName
        }));
        setIsConnected(true);
        setConnectedChannelId(channelId);
        setIsConnecting(false);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'voice-users':
          case 'channel-users':
            setUserCount(data.count || data.userCount || 0);
            
            // Connect to existing users with delay
            if (data.users && data.users.length > 0) {
              data.users.forEach((user: any) => {
                if (user.userId !== userId) {
                  setTimeout(() => connectToUser(user.userId), 2000);
                }
              });
            }
            break;
            
          case 'user-joined-voice':
          case 'user-joined':
            if (data.userId !== userId) {
              setTimeout(() => connectToUser(data.userId), 2000);
            }
            break;
            
          case 'user-left-voice':
          case 'user-left':
            const pc = peerConnectionsRef.current.get(data.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(data.userId);
            }
            
            const audio = remoteAudiosRef.current.get(data.userId);
            if (audio) {
              audio.remove();
              remoteAudiosRef.current.delete(data.userId);
            }
            break;
            
          case 'webrtc-signal':
            handleSignal(data);
            break;
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    console.log('Disconnecting from voice channel');
    
    // Close peer connections
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    
    // Remove audio elements
    remoteAudiosRef.current.forEach((audio) => {
      audio.remove();
    });
    remoteAudiosRef.current.clear();
    
    // Send leave message
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave-voice',
        channelId: connectedChannelIdRef.current,
        userId: currentUserIdRef.current
      }));
      wsRef.current.close();
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    setIsConnected(false);
    setConnectedChannelId(null);
    connectedChannelIdRef.current = null;
    setUserCount(0);
    setIsMuted(false);
    setIsDeafened(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        console.log(`Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
      }
    }
  };

  const toggleDeafen = () => {
    const newDeafenState = !isDeafened;
    setIsDeafened(newDeafenState);
    
    // Update volume of all remote audio elements
    remoteAudiosRef.current.forEach((audio) => {
      audio.volume = newDeafenState ? 0 : 1;
    });
    
    console.log(`Audio ${newDeafenState ? 'deafened' : 'undeafened'}`);
  };

  return {
    isConnected,
    isConnecting,
    connectedChannelId,
    userCount,
    localStream,
    isMuted,
    isDeafened,
    voiceLevel: 0,
    users: [],
    connect,
    disconnect,
    toggleMute,
    toggleDeafen
  };
}