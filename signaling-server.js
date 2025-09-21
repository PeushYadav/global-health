/**
 * WebRTC Signaling Server
 * 
 * A Node.js Express server with Socket.IO that handles WebRTC signaling
 * for one-to-one video calls with text chat support.
 * 
 * Features:
 * - Room-based connection management
 * - WebRTC offer/answer/ICE candidate relaying
 * - User join/leave handling
 * - Clean disconnection handling
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS for Next.js development
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Enable CORS for REST API if needed
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
  credentials: true
}));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WebRTC Signaling Server is running',
    timestamp: new Date().toISOString(),
    activeRooms: Object.keys(rooms).length,
    connectedClients: io.engine.clientsCount
  });
});

// In-memory storage for room management
const rooms = {};

/**
 * Room Management Helper Functions
 */

// Add user to room
function addUserToRoom(roomId, socketId, userInfo = {}) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      id: roomId,
      users: [],
      createdAt: new Date().toISOString(),
      maxUsers: 2 // For one-to-one calls
    };
  }
  
  // Check if room is full
  if (rooms[roomId].users.length >= rooms[roomId].maxUsers) {
    return { success: false, error: 'Room is full' };
  }
  
  // Check if user already in room
  const existingUser = rooms[roomId].users.find(user => user.socketId === socketId);
  if (existingUser) {
    return { success: false, error: 'User already in room' };
  }
  
  rooms[roomId].users.push({
    socketId,
    joinedAt: new Date().toISOString(),
    ...userInfo
  });
  
  console.log(`User ${socketId} joined room ${roomId}. Room now has ${rooms[roomId].users.length} users.`);
  return { success: true, room: rooms[roomId] };
}

// Remove user from room
function removeUserFromRoom(roomId, socketId) {
  if (!rooms[roomId]) return { success: false, error: 'Room not found' };
  
  const userIndex = rooms[roomId].users.findIndex(user => user.socketId === socketId);
  if (userIndex === -1) {
    return { success: false, error: 'User not in room' };
  }
  
  rooms[roomId].users.splice(userIndex, 1);
  console.log(`User ${socketId} left room ${roomId}. Room now has ${rooms[roomId].users.length} users.`);
  
  // Clean up empty rooms
  if (rooms[roomId].users.length === 0) {
    delete rooms[roomId];
    console.log(`Room ${roomId} deleted (empty)`);
  }
  
  return { success: true };
}

// Get other users in room (excluding current user)
function getOtherUsersInRoom(roomId, currentSocketId) {
  if (!rooms[roomId]) return [];
  return rooms[roomId].users.filter(user => user.socketId !== currentSocketId);
}

/**
 * Socket.IO Connection Handling
 */
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Store current room for cleanup on disconnect
  let currentRoom = null;
  
  /**
   * JOIN ROOM
   * Client requests to join a specific room for video calling
   */
  socket.on('join-room', (data) => {
    const { roomId, userInfo = {} } = data;
    
    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }
    
    // Leave current room if in one
    if (currentRoom) {
      socket.leave(currentRoom);
      removeUserFromRoom(currentRoom, socket.id);
      socket.to(currentRoom).emit('user-left', { socketId: socket.id });
    }
    
    // Join new room
    const result = addUserToRoom(roomId, socket.id, userInfo);
    
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    
    // Join the Socket.IO room
    socket.join(roomId);
    currentRoom = roomId;
    
    // Notify the client they successfully joined
    socket.emit('joined-room', {
      roomId,
      room: result.room,
      yourSocketId: socket.id
    });
    
    // Get other users in the room
    const otherUsers = getOtherUsersInRoom(roomId, socket.id);
    
    // Notify other users about the new user
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userInfo,
      room: result.room
    });
    
    // Send existing users to the new user
    if (otherUsers.length > 0) {
      socket.emit('existing-users', { users: otherUsers });
    }
    
    console.log(`Room ${roomId} status:`, result.room);
  });
  
  /**
   * LEAVE ROOM
   * Client requests to leave their current room
   */
  socket.on('leave-room', () => {
    if (currentRoom) {
      socket.leave(currentRoom);
      removeUserFromRoom(currentRoom, socket.id);
      socket.to(currentRoom).emit('user-left', { socketId: socket.id });
      
      socket.emit('left-room', { roomId: currentRoom });
      currentRoom = null;
    }
  });
  
  /**
   * WEBRTC SIGNALING MESSAGES
   * Relay WebRTC signaling messages between peers
   */
  
  // WebRTC Offer
  socket.on('offer', (data) => {
    const { targetSocketId, offer, roomId } = data;
    
    if (!currentRoom || currentRoom !== roomId) {
      socket.emit('error', { message: 'Not in the specified room' });
      return;
    }
    
    console.log(`Relaying offer from ${socket.id} to ${targetSocketId} in room ${roomId}`);
    socket.to(targetSocketId).emit('offer', {
      offer,
      fromSocketId: socket.id,
      roomId
    });
  });
  
  // WebRTC Answer
  socket.on('answer', (data) => {
    const { targetSocketId, answer, roomId } = data;
    
    if (!currentRoom || currentRoom !== roomId) {
      socket.emit('error', { message: 'Not in the specified room' });
      return;
    }
    
    console.log(`Relaying answer from ${socket.id} to ${targetSocketId} in room ${roomId}`);
    socket.to(targetSocketId).emit('answer', {
      answer,
      fromSocketId: socket.id,
      roomId
    });
  });
  
  // ICE Candidate
  socket.on('ice-candidate', (data) => {
    const { targetSocketId, candidate, roomId } = data;
    
    if (!currentRoom || currentRoom !== roomId) {
      socket.emit('error', { message: 'Not in the specified room' });
      return;
    }
    
    console.log(`Relaying ICE candidate from ${socket.id} to ${targetSocketId} in room ${roomId}`);
    socket.to(targetSocketId).emit('ice-candidate', {
      candidate,
      fromSocketId: socket.id,
      roomId
    });
  });
  
  /**
   * CHAT MESSAGES (Optional - can also be handled via DataChannel)
   * For fallback text chat through the signaling server
   */
  socket.on('chat-message', (data) => {
    const { message, roomId, timestamp } = data;
    
    if (!currentRoom || currentRoom !== roomId) {
      socket.emit('error', { message: 'Not in the specified room' });
      return;
    }
    
    // Broadcast message to other users in the room
    socket.to(roomId).emit('chat-message', {
      message,
      fromSocketId: socket.id,
      timestamp: timestamp || new Date().toISOString(),
      roomId
    });
  });
  
  /**
   * CONNECTION STATUS
   * Handle disconnection and cleanup
   */
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    // Clean up room membership
    if (currentRoom) {
      removeUserFromRoom(currentRoom, socket.id);
      socket.to(currentRoom).emit('user-left', { 
        socketId: socket.id,
        reason: 'disconnected'
      });
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error from ${socket.id}:`, error);
  });
});

// Error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 WebRTC Signaling Server running on port ${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔗 Socket.IO endpoint: http://localhost:${PORT}`);
  console.log(`📱 Ready for Next.js clients on ports 3000-3003`);
});

// Export for testing
module.exports = { app, server, io };