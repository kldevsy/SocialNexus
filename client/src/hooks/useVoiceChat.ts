import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceUser {
  userId: string;
  userName: string;
  isMuted: boolean;
  isDeafened: boolean;
}

export function useVoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedChannelId, setConnectedChannelId] = useState<number | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const currentUserId = useRef<string>('');
  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const remoteAudioElements = useRef(new Map<string, HTMLAudioElement>());

  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    console.log('🔗 Creating peer connection for user:', userId);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && ws?.readyState === WebSocket.OPEN) {
        console.log('🧊 Sending ICE candidate to user:', userId, 'candidate:', event.candidate.candidate);
        ws.send(JSON.stringify({
          type: 'voice-signal',
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate
          },
          targetUserId: userId,
          fromUserId: currentUserId.current,
          channelId: connectedChannelId
        }));
      } else if (!event.candidate) {
        console.log('🧊 ICE gathering complete for user:', userId);
      }
    };

    pc.ontrack = (event) => {
      console.log('🎵 Received remote audio track from user:', userId);
      const remoteStream = event.streams[0];
      
      // Create or reuse audio element for this user
      let audioElement = remoteAudioElements.current.get(userId);
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        audioElement.volume = isDeafened ? 0 : 1;
        remoteAudioElements.current.set(userId, audioElement);
        console.log('🔊 Created audio element for user:', userId);
      }
      
      audioElement.srcObject = remoteStream;
      audioElement.play().catch(error => {
        console.error('❌ Error playing remote audio for user', userId, ':', error);
        // Try to play again after user interaction
        document.addEventListener('click', () => {
          audioElement?.play().catch(console.error);
        }, { once: true });
      });
    };

    pc.onconnectionstatechange = () => {
      console.log('🔄 Connection state for user', userId, ':', pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.log('❌ Connection failed for user:', userId);
        pc.restartIce();
      }
    };

    pc.ondatachannel = (event) => {
      console.log('📡 Data channel received from user:', userId);
    };

    return pc;
  }, [ws, connectedChannelId, isDeafened]);

  const handleVoiceSignal = useCallback(async (message: any) => {
    const { signal, targetUserId, fromUserId } = message;
    
    // Only handle signals meant for us
    if (targetUserId !== currentUserId.current) return;
    if (!fromUserId) return;
    
    console.log('🔄 Handling voice signal:', signal.type, 'from user:', fromUserId);
    
    let pc = peerConnections.current.get(fromUserId);
    
    try {
      switch (signal.type) {
        case 'offer':
          console.log('📥 Received offer from:', fromUserId);
          if (!pc) {
            pc = createPeerConnection(fromUserId);
            peerConnections.current.set(fromUserId, pc);
          }

          // Add local stream tracks to peer connection
          if (localStream) {
            localStream.getTracks().forEach(track => {
              console.log('📤 Adding local track to peer connection for user:', fromUserId);
              pc!.addTrack(track, localStream);
            });
          }
          
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          console.log('✅ Set remote description (offer)');
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('📤 Created and set local description (answer)');
          
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'voice-signal',
              signal: {
                type: 'answer',
                answer: answer
              },
              targetUserId: fromUserId,
              fromUserId: currentUserId.current,
              channelId: connectedChannelId
            }));
            console.log('📤 Sent answer to:', fromUserId);
          }
          break;
          
        case 'answer':
          console.log('📥 Received answer from:', fromUserId);
          if (pc && signal.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
            console.log('✅ Set remote description (answer)');
          }
          break;
          
        case 'ice-candidate':
          console.log('🧊 Received ICE candidate from:', fromUserId);
          if (pc && signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            console.log('✅ Added ICE candidate');
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error handling voice signal:', error);
    }
  }, [createPeerConnection, ws, connectedChannelId, localStream]);

  const connect = async (channelId: number, channelName: string, userId: string, userName: string) => {
    if (isConnecting || isConnected) return;
    
    console.log('🎤 Starting voice chat connection for channel:', channelId);
    setIsConnecting(true);
    currentUserId.current = userId;
    
    try {
      // Get user media first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });
      setLocalStream(stream);
      console.log('🎯 Got local media stream');
      
      // Setup audio analysis
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);
      
      // Voice level monitoring
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
      const checkVoiceLevel = () => {
        if (analyser.current && !isMuted) {
          analyser.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVoiceLevel(average);
        } else {
          setVoiceLevel(0);
        }
        if (isConnected) {
          requestAnimationFrame(checkVoiceLevel);
        }
      };
      checkVoiceLevel();
      
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const websocket = new WebSocket(`${protocol}//${window.location.host}/ws`);
      
      websocket.onopen = () => {
        console.log('🔌 Voice chat WebSocket connected');
        setWs(websocket);
        
        // Join the voice channel
        websocket.send(JSON.stringify({
          type: 'join-voice-channel',
          channelId,
          userId,
          userName
        }));
        
        setIsConnected(true);
        setConnectedChannelId(channelId);
        setIsConnecting(false);
      };
      
      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Received WebSocket message:', message.type);
        
        switch (message.type) {
          case 'channel-users':
            console.log('👥 Updated user count:', message.userCount);
            setUserCount(message.userCount);
            
            // If we have a list of current users, initiate connections with them
            if (message.users && Array.isArray(message.users)) {
              console.log('👥 Initiating connections with existing users:', message.users);
              message.users.forEach((user: any) => {
                if (user.userId !== currentUserId.current && !peerConnections.current.has(user.userId)) {
                  console.log('🤝 Creating peer connection with existing user:', user.userId);
                  const pc = createPeerConnection(user.userId);
                  peerConnections.current.set(user.userId, pc);

                  // Add local stream tracks
                  if (localStream) {
                    localStream.getTracks().forEach(track => {
                      console.log('📤 Adding local track to peer connection for existing user:', user.userId);
                      pc.addTrack(track, localStream);
                    });
                  }
                  
                  // Create and send offer
                  pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: false
                  }).then(offer => {
                    console.log('📤 Setting local description and sending offer to existing user:', user.userId);
                    return pc.setLocalDescription(offer);
                  }).then(() => {
                    if (ws?.readyState === WebSocket.OPEN) {
                      console.log('📤 Sending offer to existing user:', user.userId);
                      const offerMessage = {
                        type: 'voice-signal',
                        signal: {
                          type: 'offer',
                          offer: pc.localDescription
                        },
                        targetUserId: user.userId,
                        fromUserId: currentUserId.current,
                        channelId: connectedChannelId
                      };
                      console.log('📤 Offer message:', JSON.stringify(offerMessage, null, 2));
                      ws.send(JSON.stringify(offerMessage));
                    }
                  }).catch(error => {
                    console.error('❌ Error creating offer for existing user:', error);
                  });
                }
              });
            }
            break;
            
          case 'user-joined':
            console.log('👤 User joined voice channel:', message.userId);
            setUsers(prev => [...prev.filter(u => u.userId !== message.userId), {
              userId: message.userId,
              userName: message.userName,
              isMuted: false,
              isDeafened: false
            }]);
            
            // Create peer connection for new user (only if it's not ourselves)
            if (message.userId !== currentUserId.current && !peerConnections.current.has(message.userId)) {
              console.log('🤝 Initiating peer connection with new user:', message.userId);
              const pc = createPeerConnection(message.userId);
              peerConnections.current.set(message.userId, pc);

              // Add local stream tracks
              if (localStream) {
                localStream.getTracks().forEach(track => {
                  console.log('📤 Adding local track to peer connection for new user:', message.userId);
                  pc.addTrack(track, localStream);
                });
              }
              
              // Create and send offer
              pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
              }).then(offer => {
                console.log('📤 Setting local description and sending offer to new user:', message.userId);
                return pc.setLocalDescription(offer);
              }).then(() => {
                if (ws?.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'voice-signal',
                    signal: {
                      type: 'offer',
                      offer: pc.localDescription
                    },
                    targetUserId: message.userId,
                    fromUserId: currentUserId.current,
                    channelId: connectedChannelId
                  }));
                }
              }).catch(error => {
                console.error('❌ Error creating offer for new user:', error);
              });
            }
            break;
            
          case 'user-left':
            console.log('👋 User left voice channel:', message.userId);
            setUsers(prev => prev.filter(u => u.userId !== message.userId));
            
            // Clean up peer connection
            const pc = peerConnections.current.get(message.userId);
            if (pc) {
              pc.close();
              peerConnections.current.delete(message.userId);
            }

            // Clean up audio element
            const audioElement = remoteAudioElements.current.get(message.userId);
            if (audioElement) {
              audioElement.pause();
              audioElement.srcObject = null;
              remoteAudioElements.current.delete(message.userId);
            }
            break;
            
          case 'voice-signal':
            console.log('📨 Received voice signal:', message);
            handleVoiceSignal(message);
            break;
        }
      };
      
      websocket.onclose = () => {
        console.log('🔌 Voice chat WebSocket disconnected');
        setIsConnected(false);
        setWs(null);
      };
      
      websocket.onerror = (error) => {
        console.error('❌ Voice chat WebSocket error:', error);
        setIsConnecting(false);
      };
      
    } catch (error) {
      console.error('❌ Error connecting to voice chat:', error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting from voice chat');
    
    if (ws) {
      if (connectedChannelId) {
        ws.send(JSON.stringify({
          type: 'leave-voice-channel',
          channelId: connectedChannelId,
          userId: currentUserId.current
        }));
      }
      ws.close();
    }

    // Clean up peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Clean up audio elements
    remoteAudioElements.current.forEach(audioElement => {
      audioElement.pause();
      audioElement.srcObject = null;
    });
    remoteAudioElements.current.clear();

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Stop audio analysis
    if (analyser.current) {
      analyser.current = null;
    }
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close();
      audioContext.current = null;
    }

    setIsConnected(false);
    setConnectedChannelId(null);
    setUserCount(0);
    setUsers([]);
    setWs(null);
    setVoiceLevel(0);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Will be opposite after state update
      });
    }
  };

  const toggleDeafen = () => {
    setIsDeafened(prev => !prev);
  };

  const startVoiceMonitoring = async () => {
    if (isMonitoring) {
      stopVoiceMonitoring();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });
      
      setLocalStream(stream);
      setIsMonitoring(true);
      
      // Setup audio analysis
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);
      
      // Voice level monitoring
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
      const checkVoiceLevel = () => {
        if (analyser.current && isMonitoring) {
          analyser.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVoiceLevel(average);
          requestAnimationFrame(checkVoiceLevel);
        }
      };
      checkVoiceLevel();
      
      console.log('🎯 Voice monitoring started');
    } catch (error) {
      console.error('❌ Error starting voice monitoring:', error);
    }
  };

  const stopVoiceMonitoring = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (analyser.current) {
      analyser.current = null;
    }
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close();
      audioContext.current = null;
    }
    
    setIsMonitoring(false);
    setVoiceLevel(0);
    console.log('🔇 Voice monitoring stopped');
  };

  // Effect to update audio when mute state changes
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Effect to update remote audio volume when deafen state changes
  useEffect(() => {
    remoteAudioElements.current.forEach(audioElement => {
      audioElement.volume = isDeafened ? 0 : 1;
    });
  }, [isDeafened]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    connectedChannelId,
    userCount,
    users,
    isMuted,
    isDeafened,
    voiceLevel,
    localStream,
    isMonitoring,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen,
    startVoiceMonitoring,
    stopVoiceMonitoring
  };
}