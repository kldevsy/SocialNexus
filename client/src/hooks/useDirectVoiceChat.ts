import { useState, useRef, useCallback, useEffect } from 'react';

export function useDirectVoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedChannelId, setConnectedChannelId] = useState<number | null>(null);
  const connectedChannelIdRef = useRef<number | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef<string>('');
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidate[]>());

  // Simple peer connection factory  
  const createPeerConnection = useCallback((userId: string) => {
    console.log(`Creating peer connection for ${userId}`);
    
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log(`Sending ICE candidate to ${userId}`);
        wsRef.current.send(JSON.stringify({
          type: 'webrtc-signal',
          to: userId,
          from: currentUserIdRef.current,
          channelId: connectedChannelId,
          signal: { type: 'ice', candidate: event.candidate }
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log(`🎵 Received audio from ${userId}`);
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audio.volume = isDeafened ? 0 : 1;
      audio.play().then(() => {
        console.log(`✅ Audio playback started for ${userId}`);
      }).catch((error) => {
        console.error(`❌ Error playing audio for ${userId}:`, error);
        // Try to play again after user interaction
        document.addEventListener('click', () => {
          audio.play().catch(console.error);
        }, { once: true });
      });
    };

    return pc;
  }, [isDeafened]);

  // Handle WebRTC signaling
  const handleSignal = useCallback(async (data: any) => {
    const { from, signal } = data;
    
    if (!from || from === currentUserIdRef.current) return;
    
    let pc = peerConnectionsRef.current.get(from);
    
    try {
      switch (signal.type) {
        case 'offer':
          if (!pc) {
            pc = createPeerConnection(from);
            peerConnectionsRef.current.set(from, pc);
            
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
          
          wsRef.current?.send(JSON.stringify({
            type: 'webrtc-signal',
            to: from,
            from: currentUserIdRef.current,
            channelId: connectedChannelIdRef.current,
            signal: { type: 'answer', answer }
          }));
          
          // Process pending candidates
          const pending = pendingCandidatesRef.current.get(from) || [];
          for (const candidate of pending) {
            await pc.addIceCandidate(candidate);
          }
          pendingCandidatesRef.current.delete(from);
          break;

        case 'answer':
          if (pc) {
            await pc.setRemoteDescription(signal.answer);
          }
          break;

        case 'ice':
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(signal.candidate);
          } else {
            // Store candidate for later
            const pending = pendingCandidatesRef.current.get(from) || [];
            pending.push(signal.candidate);
            pendingCandidatesRef.current.set(from, pending);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }, [localStream, createPeerConnection]);

  // Initialize peer connection with a user
  const initiatePeerConnection = useCallback(async (userId: string) => {
    if (peerConnectionsRef.current.has(userId)) return;
    
    console.log(`Initiating connection with ${userId}`);
    
    const pc = createPeerConnection(userId);
    peerConnectionsRef.current.set(userId, pc);
    
    // Add local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    console.log(`Sending offer to ${userId} in channel ${connectedChannelIdRef.current}`);
    wsRef.current?.send(JSON.stringify({
      type: 'webrtc-signal',
      to: userId,
      from: currentUserIdRef.current,
      channelId: connectedChannelIdRef.current,
      signal: { type: 'offer', offer }
    }));
  }, [localStream, createPeerConnection]);

  const connect = async (channelId: number, channelName: string, userId: string, userName: string) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    currentUserIdRef.current = userId;
    
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      setLocalStream(stream);
      
      // Connect WebSocket
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${location.host}/ws`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Connected to voice channel');
        ws.send(JSON.stringify({
          type: 'join-voice',
          channelId,
          userId,
          userName
        }));
        setIsConnected(true);
        setConnectedChannelId(channelId);
        connectedChannelIdRef.current = channelId;
        setIsConnecting(false);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'voice-users':
            console.log('Voice users update:', data);
            setUserCount(data.count || data.userCount || 0);
            // Connect to existing users
            data.users?.forEach((user: any) => {
              if (user.userId !== userId) {
                setTimeout(() => initiatePeerConnection(user.userId), 100);
              }
            });
            break;
            
          case 'channel-users':
            console.log('Channel users update:', data);
            setUserCount(data.userCount || data.count || 0);
            // Connect to existing users
            data.users?.forEach((user: any) => {
              if (user.userId !== userId) {
                setTimeout(() => initiatePeerConnection(user.userId), 100);
              }
            });
            break;
            
          case 'user-joined-voice':
            if (data.userId !== userId) {
              setTimeout(() => initiatePeerConnection(data.userId), 100);
            }
            break;
            
          case 'user-left-voice':
            const pc = peerConnectionsRef.current.get(data.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(data.userId);
            }
            break;
            
          case 'webrtc-signal':
            console.log('Received WebRTC signal:', data.signal?.type, 'from:', data.from);
            handleSignal(data);
            break;
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'leave-voice',
        channelId: connectedChannelIdRef.current,
        userId: currentUserIdRef.current
      }));
      wsRef.current.close();
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    
    // Stop local stream
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    
    setIsConnected(false);
    setConnectedChannelId(null);
    connectedChannelIdRef.current = null;
    setUserCount(0);
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
    setIsDeafened(!isDeafened);
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