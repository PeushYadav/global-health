/**
 * Video Call Page - Next.js React Component
 * 
 * A complete WebRTC video calling interface with text chat support
 * Features:
 * - One-to-one video/audio calling
 * - WebRTC DataChannel for real-time text chat
 * - Room-based connections
 * - Local and remote video streams
 * - Chat message history
 * - Connection status indicators
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// WebRTC Configuration
const webrtcConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302' // Free Google STUN server
    },
    {
      urls: 'stun:stun1.l.google.com:19302'
    },
    // Add TURN servers for production use (behind NAT/firewalls)
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-turn-username',
    //   credential: 'your-turn-password'
    // }
  ]
};

// Signaling server URL - adjust for your setup
const SIGNALING_SERVER_URL = 'http://localhost:4000';

export default function VideoCallPage() {
  // Socket.IO connection
  const socketRef = useRef(null);
  
  // WebRTC peer connection
  const peerConnectionRef = useRef(null);
  
  // Video element refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Local media stream
  const localStreamRef = useRef(null);
  
  // Data channel for text chat
  const dataChannelRef = useRef(null);
  
  // Current room ID ref (for reliable access in callbacks)
  const currentRoomRef = useRef(null);
  
  // Component state
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Media state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  /**
   * Initialize Socket.IO connection and event handlers
   */
  useEffect(() => {
    // Connect to signaling server
    socketRef.current = io(SIGNALING_SERVER_URL, {
      transports: ['websocket', 'polling']
    });
    
    const socket = socketRef.current;
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to signaling server:', socket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from signaling server:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      cleanupCall();
    });
    
    // Room event handlers
    socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
      setIsInRoom(true);
      setConnectionStatus('in-room');
      // Update current room ref for reliable access in callbacks
      currentRoomRef.current = data.roomId;
    });
    
    socket.on('left-room', (data) => {
      console.log('Left room:', data);
      setIsInRoom(false);
      setRemoteSocketId(null);
      setConnectionStatus('connected');
      currentRoomRef.current = null;
      cleanupCall();
    });
    
    socket.on('user-joined', (data) => {
      console.log('User joined room:', data);
      setRemoteSocketId(data.socketId);
      // Initiate call as the existing user
      initiateCall(data.socketId);
    });
    
    socket.on('user-left', (data) => {
      console.log('User left room:', data);
      setRemoteSocketId(null);
      cleanupCall();
    });
    
    socket.on('existing-users', (data) => {
      console.log('Existing users in room:', data);
      if (data.users.length > 0) {
        // There's already someone in the room
        setRemoteSocketId(data.users[0].socketId);
      }
    });
    
    // WebRTC signaling handlers
    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleReceiveAnswer);
    socket.on('ice-candidate', handleReceiveIceCandidate);
    
    // Chat handlers (fallback - mainly using DataChannel)
    socket.on('chat-message', (data) => {
      addMessage(data.message, 'remote', data.timestamp);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      console.log('Current room state:', {
        roomId: roomId,
        currentRoomRef: currentRoomRef.current,
        isInRoom: isInRoom
      });
      alert('Connection error: ' + error.message);
    });
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
      cleanupCall();
    };
  }, []);
  
  /**
   * Initialize local media (camera and microphone)
   */
  const initializeLocalMedia = useCallback(async () => {
    try {
      console.log('Requesting local media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
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
      
      console.log('Local media initialized successfully');
      return stream;
    } catch (error) {
      console.error('Error accessing local media:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      throw error;
    }
  }, []);
  
  /**
   * Create WebRTC peer connection
   */
  const createPeerConnection = useCallback((targetSocketId) => {
    console.log('Creating peer connection for:', targetSocketId);
    
    const peerConnection = new RTCPeerConnection(webrtcConfig);
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && currentRoomRef.current) {
        console.log('Sending ICE candidate');
        socketRef.current.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
          roomId: currentRoomRef.current
        });
      }
    };
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsCallActive(true);
        setConnectionStatus('call-active');
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        console.log('Connection failed, attempting to restart ICE');
        peerConnection.restartIce();
      }
    };
    
    // Create data channel for text chat
    if (!dataChannelRef.current) {
      const dataChannel = peerConnection.createDataChannel('chat', {
        ordered: true
      });
      
      dataChannel.onopen = () => {
        console.log('Data channel opened');
        dataChannelRef.current = dataChannel;
      };
      
      dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(data.message, 'remote', data.timestamp);
        } catch (error) {
          console.error('Error parsing chat message:', error);
        }
      };
      
      dataChannel.onclose = () => {
        console.log('Data channel closed');
        dataChannelRef.current = null;
      };
    }
    
    // Handle incoming data channel
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      console.log('Received data channel:', channel.label);
      
      channel.onopen = () => {
        console.log('Incoming data channel opened');
        if (!dataChannelRef.current) {
          dataChannelRef.current = channel;
        }
      };
      
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(data.message, 'remote', data.timestamp);
        } catch (error) {
          console.error('Error parsing chat message:', error);
        }
      };
    };
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }
    
    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [roomId]);
  
  /**
   * Initiate call (create offer)
   */
  const initiateCall = useCallback(async (targetSocketId) => {
    try {
      console.log('Initiating call to:', targetSocketId);
      console.log('Current room state:', {
        roomId: roomId,
        currentRoomRef: currentRoomRef.current,
        isInRoom: isInRoom
      });
      
      // Get local media if not already available
      if (!localStreamRef.current) {
        await initializeLocalMedia();
      }
      
      // Create peer connection
      const peerConnection = createPeerConnection(targetSocketId);
      
      // Create and send offer
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
      
      console.log('Offer sent successfully');
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to initiate call: ' + error.message);
    }
  }, [roomId, initializeLocalMedia, createPeerConnection]);
  
  /**
   * Handle received offer
   */
  const handleReceiveOffer = useCallback(async (data) => {
    try {
      console.log('Received offer from:', data.fromSocketId);
      
      // Get local media if not already available
      if (!localStreamRef.current) {
        await initializeLocalMedia();
      }
      
      // Create peer connection
      const peerConnection = createPeerConnection(data.fromSocketId);
      
      // Set remote description
      await peerConnection.setRemoteDescription(data.offer);
      
      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (socketRef.current && currentRoomRef.current) {
        socketRef.current.emit('answer', {
          targetSocketId: data.fromSocketId,
          answer,
          roomId: currentRoomRef.current
        });
      }
      
      setRemoteSocketId(data.fromSocketId);
      console.log('Answer sent successfully');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [roomId, initializeLocalMedia, createPeerConnection]);
  
  /**
   * Handle received answer
   */
  const handleReceiveAnswer = useCallback(async (data) => {
    try {
      console.log('Received answer from:', data.fromSocketId);
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.answer);
        console.log('Remote description set successfully');
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);
  
  /**
   * Handle received ICE candidate
   */
  const handleReceiveIceCandidate = useCallback(async (data) => {
    try {
      console.log('Received ICE candidate from:', data.fromSocketId);
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);
  
  /**
   * Join a room
   */
  const joinRoom = useCallback(async () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    
    if (!socketRef.current) {
      alert('Not connected to signaling server');
      return;
    }
    
    try {
      // Initialize local media before joining
      await initializeLocalMedia();
      
      // Update current room ref
      currentRoomRef.current = roomId.trim();
      
      socketRef.current.emit('join-room', {
        roomId: roomId.trim(),
        userInfo: {
          joinedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room: ' + error.message);
    }
  }, [roomId, initializeLocalMedia]);
  
  /**
   * Leave room
   */
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
    }
    currentRoomRef.current = null;
    cleanupCall();
  }, []);
  
  /**
   * Clean up call resources
   */
  const cleanupCall = useCallback(() => {
    console.log('Cleaning up call resources');
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setIsCallActive(false);
    setIsScreenSharing(false);
    setConnectionStatus(isInRoom ? 'in-room' : 'connected');
  }, [isInRoom]);
  
  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);
  
  /**
   * Toggle audio on/off
   */
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);
  
  /**
   * Chat message functions
   */
  const addMessage = useCallback((message, sender, timestamp) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      sender,
      timestamp: timestamp || new Date().toISOString()
    }]);
  }, []);
  
  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    
    const messageData = {
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Try to send via data channel first
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(messageData));
    } else if (socketRef.current && isInRoom && currentRoomRef.current) {
      // Fallback to signaling server
      socketRef.current.emit('chat-message', {
        ...messageData,
        roomId: currentRoomRef.current
      });
    }
    
    // Add to local messages
    addMessage(messageData.message, 'local', messageData.timestamp);
    setNewMessage('');
  }, [newMessage, roomId, isInRoom, addMessage]);
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
  
  /**
   * Render component
   */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          WebRTC Video Call
        </h1>
        
        {/* Connection Status */}
        <div className="mb-6 text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'in-room' ? 'bg-blue-100 text-blue-800' :
            connectionStatus === 'call-active' ? 'bg-purple-100 text-purple-800' :
            'bg-red-100 text-red-800'
          }`}>
            Status: {connectionStatus}
          </span>
          {isConnected && (
            <span className="ml-2 text-sm text-gray-600">
              Socket ID: {socketRef.current?.id}
            </span>
          )}
        </div>
        
        {/* Room Controls */}
        {!isInRoom ? (
          <div className="mb-8 flex justify-center items-center space-x-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              onClick={joinRoom}
              disabled={!isConnected || !roomId.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <span className="text-lg font-medium text-gray-700 mr-4">
              Room: {roomId}
            </span>
            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Leave Room
            </button>
          </div>
        )}
        
        {/* Video Container */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Videos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Remote Video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!isCallActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                  {isInRoom ? 'Waiting for other participant...' : 'Join a room to start calling'}
                </div>
              )}
              {remoteSocketId && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  Remote: {remoteSocketId}
                </div>
              )}
            </div>
            
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', height: '200px' }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You
              </div>
            </div>
            
            {/* Media Controls */}
            {isInRoom && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={toggleVideo}
                  className={`px-4 py-2 rounded-md font-medium ${
                    isVideoEnabled 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isVideoEnabled ? '📹 Video On' : '📹 Video Off'}
                </button>
                
                <button
                  onClick={toggleAudio}
                  className={`px-4 py-2 rounded-md font-medium ${
                    isAudioEnabled 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isAudioEnabled ? '🎤 Audio On' : '🎤 Audio Off'}
                </button>
              </div>
            )}
          </div>
          
          {/* Chat Panel */}
          {isInRoom && (
            <div className="bg-white rounded-lg shadow-md flex flex-col h-96">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Chat</h3>
                <span className="text-sm text-gray-500">
                  {dataChannelRef.current?.readyState === 'open' ? '🟢 Direct' : '🔴 Server'}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm">
                    No messages yet. Start a conversation!
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
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 text-white p-4 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">Debug Information</h4>
          <div className="space-y-1">
            <div>Signaling Server: {SIGNALING_SERVER_URL}</div>
            <div>Socket Connected: {isConnected ? '✅' : '❌'}</div>
            <div>In Room: {isInRoom ? '✅' : '❌'}</div>
            <div>Call Active: {isCallActive ? '✅' : '❌'}</div>
            <div>Data Channel: {dataChannelRef.current?.readyState || 'none'}</div>
            <div>Peer Connection: {peerConnectionRef.current?.connectionState || 'none'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}