import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceChatFixed() {
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

  // Create peer connection with proper audio handling
  const createPeerConnection = useCallback((userId: string) => {
    console.log(`🔗 Creating peer connection for ${userId}`);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log(`🧊 Sending ICE candidate to ${userId}`);
        wsRef.current.send(JSON.stringify({
          type: 'webrtc-signal',
          to: userId,
          from: currentUserIdRef.current,
          channelId: connectedChannelIdRef.current,
          signal: { type: 'ice', candidate: event.candidate }
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log(`🎵 Received audio track from ${userId}`);
      const remoteStream = event.streams[0];
      
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        // Create audio element for playback
        let audio = document.querySelector(`[data-user-id="${userId}"]`) as HTMLAudioElement;
        if (!audio) {
          audio = new Audio();
          audio.setAttribute('data-user-id', userId);
          audio.autoplay = true;
          audio.playsInline = true;
          document.body.appendChild(audio);
        }
        
        audio.srcObject = remoteStream;
        audio.volume = isDeafened ? 0 : 1;
        
        audio.play().then(() => {
          console.log(`✅ Audio playback started for ${userId}`);
        }).catch((error) => {
          console.error(`❌ Audio playback error for ${userId}:`, error);
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔄 Connection state for ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Clean up audio element
        const audioElement = document.querySelector(`[data-user-id="${userId}"]`);
        if (audioElement) {
          audioElement.remove();
        }
      }
    };

    return pc;
  }, [isDeafened]);

  // Handle WebRTC signaling
  const handleSignal = useCallback(async (data: any) => {
    const { from, signal } = data;
    
    if (!from || from === currentUserIdRef.current) return;
    
    console.log(`📨 Handling ${signal.type} signal from ${from}`);
    
    let pc = peerConnectionsRef.current.get(from);
    
    try {
      switch (signal.type) {
        case 'offer':
          if (!pc) {
            pc = createPeerConnection(from);
            peerConnectionsRef.current.set(from, pc);
          }
          
          // Add local stream if available
          const currentStream = localStreamRef.current;
          if (currentStream && currentStream.getTracks().length > 0) {
            console.log(`🎤 Adding local stream to connection with ${from}`);
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
            signal: { type: 'answer', answer }
          }));
          break;

        case 'answer':
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          }
          break;

        case 'ice':
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Error handling signal from ${from}:`, error);
    }
  }, [createPeerConnection]);

  // Initialize connection to a user
  const connectToUser = useCallback(async (userId: string) => {
    if (peerConnectionsRef.current.has(userId)) return;
    
    const currentStream = localStreamRef.current;
    if (!currentStream || currentStream.getTracks().length === 0) {
      console.warn(`⚠️ Cannot connect to ${userId}: no local stream`);
      return;
    }
    
    console.log(`🚀 Connecting to user ${userId}`);
    
    const pc = createPeerConnection(userId);
    peerConnectionsRef.current.set(userId, pc);
    
    // Add local stream
    currentStream.getTracks().forEach(track => {
      console.log(`🎵 Adding local track: ${track.kind}`);
      pc.addTrack(track, currentStream);
    });
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log(`📤 Sending offer to ${userId}`);
      wsRef.current?.send(JSON.stringify({
        type: 'webrtc-signal',
        to: userId,
        from: currentUserIdRef.current,
        channelId: connectedChannelIdRef.current,
        signal: { type: 'offer', offer }
      }));
    } catch (error) {
      console.error(`❌ Error creating offer for ${userId}:`, error);
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
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('🎤 Audio stream acquired successfully');
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Connect WebSocket
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${location.host}/ws`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected to voice channel');
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
        console.log('📩 WebSocket message:', data.type);
        
        switch (data.type) {
          case 'voice-users':
          case 'channel-users':
            setUserCount(data.count || data.userCount || 0);
            
            // Connect to existing users
            if (data.users && data.users.length > 0) {
              console.log(`👥 Found ${data.users.length} existing users`);
              data.users.forEach((user: any) => {
                if (user.userId !== userId) {
                  setTimeout(() => connectToUser(user.userId), 1000);
                }
              });
            }
            break;
            
          case 'user-joined-voice':
          case 'user-joined':
            if (data.userId !== userId) {
              console.log(`👋 User ${data.userId} joined, connecting...`);
              setTimeout(() => connectToUser(data.userId), 1000);
            }
            break;
            
          case 'user-left-voice':
          case 'user-left':
            const pc = peerConnectionsRef.current.get(data.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(data.userId);
            }
            const audioElement = document.querySelector(`[data-user-id="${data.userId}"]`);
            if (audioElement) {
              audioElement.remove();
            }
            break;
            
          case 'webrtc-signal':
            handleSignal(data);
            break;
        }
      };
      
      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
      };
      
    } catch (error) {
      console.error('❌ Failed to connect to voice channel:', error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting from voice channel');
    
    // Clean up audio elements
    document.querySelectorAll('[data-user-id]').forEach(audio => audio.remove());
    
    // Close peer connections
    peerConnectionsRef.current.forEach((pc, userId) => {
      console.log(`Closing connection to ${userId}`);
      pc.close();
    });
    peerConnectionsRef.current.clear();
    
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
        console.log(`🎤 Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
      }
    }
  };

  const toggleDeafen = () => {
    const newDeafenState = !isDeafened;
    setIsDeafened(newDeafenState);
    
    // Update volume of all remote audio elements
    document.querySelectorAll('[data-user-id]').forEach((audio: any) => {
      audio.volume = newDeafenState ? 0 : 1;
    });
    
    console.log(`🔇 Audio ${newDeafenState ? 'deafened' : 'undeafened'}`);
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