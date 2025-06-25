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
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log(`Sending ICE candidate to ${userId}`);
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
      console.log(`🎵 Received audio track from ${userId}`, event.streams[0]);
      const remoteStream = event.streams[0];
      
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        console.log(`🔊 Creating audio element for ${userId}`);
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.playsInline = true;
        audio.volume = isDeafened ? 0 : 1;
        
        // Store audio element for cleanup
        const existingAudio = document.querySelector(`[data-user-id="${userId}"]`);
        if (existingAudio) {
          existingAudio.remove();
        }
        
        audio.setAttribute('data-user-id', userId);
        document.body.appendChild(audio);
        
        audio.play().then(() => {
          console.log(`✅ Audio playback started for ${userId}`);
        }).catch((error) => {
          console.error(`❌ Error playing audio for ${userId}:`, error);
          // Try to enable autoplay
          const playAudio = () => {
            audio.play().catch(console.error);
            document.removeEventListener('click', playAudio);
          };
          document.addEventListener('click', playAudio, { once: true });
        });
      } else {
        console.warn(`No audio tracks in stream from ${userId}`);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Clean up audio element
        const audioElement = document.querySelector(`[data-user-id="${userId}"]`);
        if (audioElement) {
          audioElement.remove();
        }
      }
    };

    pc.onicecandidateerror = (event) => {
      console.error(`ICE candidate error for ${userId}:`, event);
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
            if (localStream && localStream.getTracks().length > 0) {
              console.log(`Adding local tracks to peer connection for ${from}`);
              localStream.getTracks().forEach(track => {
                console.log(`Adding track:`, track.kind, track.enabled);
                pc!.addTrack(track, localStream);
              });
            } else {
              console.warn(`No local stream when handling offer from ${from}`);
              return; // Don't proceed without local stream
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
    if (peerConnectionsRef.current.has(userId)) {
      console.log(`Peer connection already exists for ${userId}`);
      return;
    }
    
    console.log(`Initiating connection with ${userId}`);
    
    const pc = createPeerConnection(userId);
    peerConnectionsRef.current.set(userId, pc);
    
    // Add local stream to peer connection
    if (localStream && localStream.getTracks().length > 0) {
      console.log(`Adding local stream tracks to peer connection for ${userId}`);
      localStream.getTracks().forEach(track => {
        console.log(`Adding track:`, track.kind, track.enabled, track.readyState);
        pc.addTrack(track, localStream);
      });
      
      // Create and send offer
      try {
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
      } catch (error) {
        console.error(`Error creating offer for ${userId}:`, error);
      }
    } else {
      console.warn(`No local stream available when creating peer connection for ${userId}`);
      // Remove the peer connection since we can't use it without a stream
      peerConnectionsRef.current.delete(userId);
    }
  }, [localStream, createPeerConnection]);

  const connect = async (channelId: number, channelName: string, userId: string, userName: string) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    currentUserIdRef.current = userId;
    
    try {
      // Get audio stream with better settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      
      console.log('🎤 Local audio stream acquired:', stream.getAudioTracks().map(t => ({
        id: t.id,
        kind: t.kind,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })));
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
            // Connect to existing users after ensuring we have local stream
            if (localStream && localStream.getTracks().length > 0) {
              data.users?.forEach((user: any) => {
                if (user.userId !== userId) {
                  setTimeout(() => initiatePeerConnection(user.userId), 200);
                }
              });
            }
            break;
            
          case 'channel-users':
            console.log('Channel users update:', data);
            setUserCount(data.userCount || data.count || 0);
            // Connect to existing users after ensuring we have local stream
            if (localStream && localStream.getTracks().length > 0) {
              data.users?.forEach((user: any) => {
                if (user.userId !== userId) {
                  setTimeout(() => initiatePeerConnection(user.userId), 200);
                }
              });
            }
            break;
            
          case 'user-joined-voice':
            if (data.userId !== userId) {
              // Ensure we have local stream before initiating connection
              if (localStream && localStream.getTracks().length > 0) {
                setTimeout(() => initiatePeerConnection(data.userId), 200);
              } else {
                console.warn(`Cannot initiate connection with ${data.userId}: no local stream`);
              }
            }
            break;
            
          case 'user-left-voice':
          case 'user-left':
            const pc = peerConnectionsRef.current.get(data.userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(data.userId);
            }
            // Clean up audio element
            const audioElement = document.querySelector(`[data-user-id="${data.userId}"]`);
            if (audioElement) {
              audioElement.remove();
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
    // Clean up all audio elements
    document.querySelectorAll('[data-user-id]').forEach(audio => audio.remove());
    
    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, userId) => {
      console.log(`Closing peer connection for ${userId}`);
      pc.close();
    });
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'leave-voice',
        channelId: connectedChannelIdRef.current,
        userId: currentUserIdRef.current
      }));
      wsRef.current.close();
    }
    
    // Stop local stream
    if (localStream) {
      console.log('🛑 Stopping local stream');
      localStream.getTracks().forEach(track => track.stop());
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
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // isMuted is current state, so we flip it
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