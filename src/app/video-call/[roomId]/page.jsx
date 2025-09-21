/**
 * Enhanced Video Call Page - Next.js React Component
 * 
 * Improved WebRTC video calling interface with appointment context
 * Features:
 * - Appointment-based calls with context
 * - Better UI with modern design
 * - Working chat system with multiple fallbacks
 * - Enhanced connection management
 * - Real-time notifications
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client';

// WebRTC Configuration
const webrtcConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'stun:stun1.l.google.com:19302'
    }
    // Add TURN servers for production
  ]
};

const SIGNALING_SERVER_URL = 'http://localhost:4000';

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId;

  // Refs
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const currentRoomRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);

  // Call session info
  const [callSession, setCallSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);

  // Media state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState('');

  /**
   * Initialize call session and fetch appointment context
   */
  useEffect(() => {
    if (roomId) {
      fetchCallSessionInfo();
    }
  }, [roomId]);

  const fetchCallSessionInfo = async () => {
    try {
      // Extract appointment ID from room ID if it's an appointment-based call
      const appointmentMatch = roomId.match(/^call_(.+)_\d+_/);
      if (appointmentMatch && appointmentMatch[1] !== 'direct') {
        const appointmentId = appointmentMatch[1];
        
        // Fetch appointment details
        const response = await fetch(`/api/doctor/appointments?id=${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.appointment) {
            setCallSession({
              roomId,
              appointment: data.appointment,
              // Will be updated when socket connects
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch call session info:', error);
    }
  };

  /**
   * Initialize Socket.IO connection
   */
  useEffect(() => {
    if (!roomId) return;

    const socket = io(SIGNALING_SERVER_URL, {
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Connected to signaling server:', socket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      // Auto-join room
      joinRoom();
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      cleanupCall();
    });

    // Room handlers
    socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
      setIsInRoom(true);
      setConnectionStatus('waiting');
      currentRoomRef.current = data.roomId;
    });

    socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      setRemoteSocketId(data.socketId);
      setRemoteUser(data.userInfo);
      initiateCall(data.socketId);
    });

    socket.on('user-left', (data) => {
      console.log('User left:', data);
      setRemoteSocketId(null);
      setRemoteUser(null);
      cleanupCall();
    });

    socket.on('existing-users', (data) => {
      if (data.users.length > 0) {
        setRemoteSocketId(data.users[0].socketId);
        setRemoteUser(data.users[0]);
      }
    });

    // WebRTC signaling
    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleReceiveAnswer);
    socket.on('ice-candidate', handleReceiveIceCandidate);

    // Chat fallback
    socket.on('chat-message', (data) => {
      addMessage(data.message, 'remote', data.timestamp, data.senderName);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      cleanupCall();
    };
  }, [roomId]);

  /**
   * Call duration timer
   */
  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  /**
   * Auto-hide controls
   */
  useEffect(() => {
    let timeout;
    if (isCallActive) {
      timeout = setTimeout(() => setShowControls(false), 5000);
    }
    return () => clearTimeout(timeout);
  }, [isCallActive, showControls]);

  /**
   * Scroll chat to bottom
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Initialize local media
   */
  const initializeLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media:', error);
      setError('Could not access camera/microphone. Please check permissions.');
      throw error;
    }
  }, []);

  /**
   * Create peer connection
   */
  const createPeerConnection = useCallback((targetSocketId) => {
    const peerConnection = new RTCPeerConnection(webrtcConfig);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && currentRoomRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
          roomId: currentRoomRef.current
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsCallActive(true);
        setConnectionStatus('connected');
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Peer connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setIsCallActive(true);
        setConnectionStatus('connected');
      } else if (peerConnection.connectionState === 'failed') {
        setError('Connection failed. Attempting to reconnect...');
        peerConnection.restartIce();
      }
    };

    // Create data channel for chat
    const dataChannel = peerConnection.createDataChannel('chat', { ordered: true });
    
    dataChannel.onopen = () => {
      console.log('Data channel opened');
      dataChannelRef.current = dataChannel;
    };

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(data.message, 'remote', data.timestamp, data.senderName);
      } catch (error) {
        console.error('Error parsing chat message:', error);
      }
    };

    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onopen = () => {
        if (!dataChannelRef.current) {
          dataChannelRef.current = channel;
        }
      };
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(data.message, 'remote', data.timestamp, data.senderName);
        } catch (error) {
          console.error('Error parsing chat message:', error);
        }
      };
    };

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, []);

  /**
   * Join room automatically
   */
  const joinRoom = useCallback(async () => {
    if (!socketRef.current || !roomId) return;

    try {
      await initializeLocalMedia();
      
      socketRef.current.emit('join-room', {
        roomId,
        userInfo: {
          name: currentUser?.name || 'User',
          role: currentUser?.role || 'user'
        }
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      setError('Failed to join video call');
    }
  }, [roomId, initializeLocalMedia, currentUser]);

  /**
   * WebRTC call handlers
   */
  const initiateCall = useCallback(async (targetSocketId) => {
    try {
      if (!localStreamRef.current) {
        await initializeLocalMedia();
      }

      const peerConnection = createPeerConnection(targetSocketId);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerConnection.setLocalDescription(offer);

      if (socketRef.current && currentRoomRef.current) {
        socketRef.current.emit('offer', {
          targetSocketId,
          offer,
          roomId: currentRoomRef.current
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      setError('Failed to initiate call');
    }
  }, [initializeLocalMedia, createPeerConnection]);

  const handleReceiveOffer = useCallback(async (data) => {
    try {
      if (!localStreamRef.current) {
        await initializeLocalMedia();
      }

      const peerConnection = createPeerConnection(data.fromSocketId);
      await peerConnection.setRemoteDescription(data.offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit('answer', {
          targetSocketId: data.fromSocketId,
          answer,
          roomId: data.roomId
        });
      }

      setRemoteSocketId(data.fromSocketId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [initializeLocalMedia, createPeerConnection]);

  const handleReceiveAnswer = useCallback(async (data) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.answer);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleReceiveIceCandidate = useCallback(async (data) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  /**
   * Media controls
   */
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  /**
   * Chat functions
   */
  const addMessage = useCallback((message, sender, timestamp, senderName) => {
    const newMsg = {
      id: Date.now() + Math.random(),
      message,
      sender,
      timestamp: timestamp || new Date().toISOString(),
      senderName
    };
    
    setMessages(prev => [...prev, newMsg]);
    
    if (sender === 'remote' && isChatMinimized) {
      setUnreadMessages(prev => prev + 1);
    }
  }, [isChatMinimized]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const messageData = {
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      senderName: currentUser?.name || 'You'
    };

    // Try DataChannel first
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(messageData));
    } else if (socketRef.current && isInRoom) {
      // Fallback to Socket.IO
      socketRef.current.emit('chat-message', {
        ...messageData,
        roomId
      });
    }

    addMessage(messageData.message, 'local', messageData.timestamp, messageData.senderName);
    setNewMessage('');
  }, [newMessage, currentUser, isInRoom, roomId, addMessage]);

  /**
   * Call controls
   */
  const endCall = async () => {
    try {
      // Call API to end the call
      await fetch('/api/video-call/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId,
          duration: callDuration 
        }),
      });

      cleanupCall();
      router.push('/doctor'); // Redirect back to dashboard
    } catch (error) {
      console.error('Error ending call:', error);
      cleanupCall();
      router.push('/doctor');
    }
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setIsCallActive(false);
    setCallDuration(0);
  };

  /**
   * Format duration
   */
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Render
   */
  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Call Link</h1>
          <p className="text-gray-300">This video call link is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">
              {callSession?.appointment ? `Appointment: ${callSession.appointment.reason}` : 'Video Call'}
            </h1>
            {isCallActive && (
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs ${
              connectionStatus === 'connected' && isCallActive ? 'bg-green-600' :
              connectionStatus === 'waiting' ? 'bg-yellow-600' :
              connectionStatus === 'connecting' ? 'bg-blue-600' :
              'bg-red-600'
            }`}>
              {connectionStatus === 'connected' && isCallActive ? 'Connected' :
               connectionStatus === 'waiting' ? 'Waiting for participant' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="relative h-screen" onClick={() => setShowControls(!showControls)}>
        {/* Remote video (main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Waiting state */}
        {!isCallActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Waiting for participant'}
              </h2>
              <p className="text-gray-400">
                {callSession?.appointment ? 
                  `Appointment with ${remoteUser?.name || 'participant'}` :
                  'Share this link to start the call'
                }
              </p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            You
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0017 14V6a2 2 0 00-2-2h-3.586l-.707-.707A1 1 0 0010 3H6a2 2 0 00-2 2v.586L3.707 2.293zM6 5h.586L15 13.414V6h-4a1 1 0 01-.707-.293L9.586 5H6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 to-transparent p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d={isVideoEnabled ? 
                "M4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM6 6v8h8V6H6z" :
                "M.293 2.293a1 1 0 011.414 0L4 4.586V6a2 2 0 002 2h8c.35 0 .687-.06 1-.17v.17a2 2 0 01-2 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414L6.586 10H6a2 2 0 01-2-2V4.414L.293 3.707a1 1 0 010-1.414z"
              } />
            </svg>
          </button>

          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d={isAudioEnabled ?
                "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" :
                "M10 2a4 4 0 00-4 4v4a4 4 0 008 0V6a4 4 0 00-4-4zM6 8a4 4 0 018 0v2h2a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 012-2h2V8z"
              } />
            </svg>
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414L8.586 11l-3.293 3.293a1 1 0 101.414 1.414L10 12.414l3.293 3.293a1 1 0 001.414-1.414L11.414 11l3.293-3.293z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => {
              setIsChatMinimized(!isChatMinimized);
              if (!isChatMinimized) setUnreadMessages(0);
            }}
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors relative"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100-2h3a1 1 0 100 2h-3z" />
            </svg>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Chat panel */}
      {!isChatMinimized && (
        <div className="fixed right-4 top-4 bottom-20 w-80 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 flex flex-col">
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Chat</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {dataChannelRef.current?.readyState === 'open' ? '🟢 Direct' : '🔴 Server'}
                </span>
                <button
                  onClick={() => setIsChatMinimized(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'local' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs rounded-lg px-3 py-2 ${
                    msg.sender === 'local' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/20 text-white'
                  }`}>
                    <div className="text-sm">{msg.message}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/20">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-30">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="text-white/80 hover:text-white"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}