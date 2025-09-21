'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';

// WebRTC Configuration
const webrtcConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302' // Free Google STUN server
    }
  ]
};

export default function DoctorVideoCall() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || searchParams.get('id') || `doctor_call_${Date.now()}`;
  
  // States
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [participantName, setParticipantName] = useState('Patient');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState('');

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize video call
  const initializeCall = useCallback(async () => {
    try {
      setConnectionStatus('Connecting to call...');

      // Connect to signaling server
      socketRef.current = io('http://localhost:4000', {
        transports: ['websocket']
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to signaling server');
        setIsConnected(true);
        setConnectionStatus('Connected - Waiting for patient...');
        
        // Join the room
        socketRef.current.emit('join-room', roomId);
      });

      // Handle incoming signaling messages
      socketRef.current.on('offer', handleOffer);
      socketRef.current.on('answer', handleAnswer);
      socketRef.current.on('ice-candidate', handleIceCandidate);
      socketRef.current.on('user-joined', handleUserJoined);
      socketRef.current.on('user-left', handleUserLeft);
      
      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to signaling server');
        setConnectionStatus('Connection failed');
      });

      // Get user media
      await getLocalStream();

    } catch (error) {
      console.error('Failed to initialize call:', error);
      setError('Failed to initialize call');
      setConnectionStatus('Failed to connect');
    }
  }, [roomId]);

  // Get local video/audio stream
  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('Local stream obtained');
    } catch (error) {
      console.error('Error getting local stream:', error);
      setError('Failed to access camera/microphone');
    }
  };

  // Create peer connection
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(webrtcConfig);
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsCallActive(true);
      setConnectionStatus('Call active');
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', event.candidate, roomId);
      }
    };

    // Create data channel for chat
    const dataChannel = peerConnection.createDataChannel('chat');
    setupDataChannel(dataChannel);

    // Handle incoming data channel
    peerConnection.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  // Setup data channel for chat
  const setupDataChannel = (channel) => {
    dataChannelRef.current = channel;
    
    channel.onopen = () => {
      console.log('Data channel opened');
    };
    
    channel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    };
  };

  // Handle user joined
  const handleUserJoined = async () => {
    console.log('Patient joined, creating offer...');
    setConnectionStatus('Patient connected - Starting call...');
    
    const peerConnection = createPeerConnection();
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current.emit('offer', offer, roomId);
    } catch (error) {
      console.error('Error creating offer:', error);
      setError('Failed to create call offer');
    }
  };

  // Handle incoming offer
  const handleOffer = async (offer) => {
    console.log('Received offer');
    const peerConnection = createPeerConnection();
    
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socketRef.current.emit('answer', answer, roomId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (answer) => {
    console.log('Received answer');
    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (candidate) => {
    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  // Handle user left
  const handleUserLeft = () => {
    console.log('Patient left the call');
    setConnectionStatus('Patient disconnected');
    setIsCallActive(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (messageInput.trim() && dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      const message = {
        text: messageInput.trim(),
        sender: 'Doctor',
        timestamp: new Date().toLocaleTimeString()
      };
      
      dataChannelRef.current.send(JSON.stringify(message));
      setMessages(prev => [...prev, message]);
      setMessageInput('');
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // End call
  const endCall = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Redirect back to doctor dashboard
    window.location.href = '/doctor';
  };

  // Initialize call on component mount
  useEffect(() => {
    initializeCall();
    
    return () => {
      // Cleanup on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeCall]);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Starting Video Call</div>
          <p className="text-gray-600 mb-4">Preparing your video call...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Doctor Video Call</h1>
            <p className="text-gray-300 text-sm">Room: {roomId}</p>
            <p className="text-gray-300 text-sm">Status: {connectionStatus}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              End Call
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 text-center">
          {error}
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Area */}
        <div className="flex-1 p-4 relative">
          {/* Remote Video (Main) */}
          <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isCallActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">👨‍⚕️</div>
                  <p className="text-lg text-gray-300">Waiting for patient to join...</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-8 right-8 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
              You (Doctor)
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80 transition-all`}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80 transition-all`}
            >
              {isVideoOff ? '📹' : '🎥'}
            </button>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold">Chat with Patient</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center text-sm">No messages yet</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`${msg.sender === 'Doctor' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[80%] p-2 rounded-lg ${
                    msg.sender === 'Doctor' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 text-white'
                  }`}>
                    <div className="text-sm">{msg.text}</div>
                    <div className="text-xs opacity-75 mt-1">{msg.timestamp}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}