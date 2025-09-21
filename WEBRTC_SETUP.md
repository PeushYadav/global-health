# WebRTC Video Calling App Setup Guide

## Overview
This is a complete WebRTC video calling application with real-time text chat, built with Next.js and Node.js.

## Files Created
1. **`signaling-server.js`** - Node.js Express + Socket.IO signaling server
2. **`src/pages/call.jsx`** - Next.js React component for video calling
3. **`server-package.json`** - Package configuration for the signaling server

## Setup Instructions

### 1. Install Dependencies

#### For the Signaling Server:
```bash
# Create a separate directory for the signaling server
mkdir webrtc-server
cd webrtc-server

# Copy the server files
cp ../signaling-server.js .
cp ../server-package.json ./package.json

# Install server dependencies
npm install
```

#### For the Next.js App:
```bash
# Socket.IO client is already installed
# The call.jsx page is ready to use
```

### 2. Start the Signaling Server
```bash
# In the webrtc-server directory
npm start
# Or for development with auto-reload:
npm run dev
```
The server will start on `http://localhost:4000`

### 3. Start the Next.js App
```bash
# In your main Next.js directory
npm run dev
```
The Next.js app will start on `http://localhost:3003` (or your configured port)

### 4. Test the Video Calling

1. **Open the call page**: Navigate to `http://localhost:3003/call`
2. **Check connection**: You should see "Status: connected" 
3. **Create a room**: Enter a room ID (e.g., "room123") and click "Join Room"
4. **Test with multiple users**: Open the same URL in another browser tab/window
5. **Join the same room**: Use the same room ID in the second tab
6. **Start video call**: The call should automatically start when both users are in the room
7. **Test chat**: Use the chat panel to send text messages

## Features

### Video Calling Features:
- ✅ One-to-one video and audio calls
- ✅ Camera and microphone toggle controls  
- ✅ Automatic call initiation when two users join a room
- ✅ High-quality video with adaptive resolution
- ✅ Echo cancellation and noise suppression
- ✅ Connection state monitoring

### Chat Features:
- ✅ Real-time text chat via WebRTC DataChannel
- ✅ Fallback to Socket.IO for chat when DataChannel unavailable
- ✅ Message history with timestamps
- ✅ Visual indicators for message sender
- ✅ Connection status indicators

### Technical Features:
- ✅ WebRTC peer-to-peer connection
- ✅ ICE candidate exchange with STUN servers
- ✅ Room-based connection management
- ✅ Graceful disconnection handling
- ✅ Connection state monitoring and recovery
- ✅ Cross-browser compatibility

## Configuration

### STUN/TURN Servers
The app uses Google's free STUN servers by default:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production, add TURN servers in `call.jsx`:
```javascript
const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ]
};
```

### Signaling Server URL
Update the signaling server URL in `call.jsx` if needed:
```javascript
const SIGNALING_SERVER_URL = 'http://localhost:4000';
```

## Troubleshooting

### Common Issues:

1. **"Not connected to signaling server"**
   - Make sure the signaling server is running on port 4000
   - Check for CORS issues in browser console

2. **"Could not access camera/microphone"**
   - Grant camera/microphone permissions in your browser
   - Ensure HTTPS in production (required for getUserMedia)

3. **Video not showing**
   - Check browser console for WebRTC errors
   - Verify STUN/TURN server connectivity
   - Test with different browsers

4. **Chat not working**
   - DataChannel may not be established yet
   - Messages should still work via Socket.IO fallback

### Debug Information
The call page includes a debug panel at the bottom showing:
- Socket connection status
- Room membership status  
- Call activity status
- DataChannel state
- Peer connection state

## Production Deployment

### Security Considerations:
1. Use HTTPS for the Next.js app (required for getUserMedia)
2. Use WSS for Socket.IO connections
3. Configure proper CORS origins
4. Add rate limiting to prevent abuse
5. Implement user authentication

### Scaling:
1. Add Redis adapter for Socket.IO to support multiple server instances
2. Implement room capacity limits
3. Add connection monitoring and cleanup
4. Consider using a managed TURN service

### Performance:
1. Configure video resolution limits
2. Implement bandwidth adaptation
3. Add connection quality monitoring
4. Optimize for mobile devices

## Extending the App

### Add Multiple Participants:
1. Modify room capacity in `signaling-server.js`
2. Update WebRTC logic to handle multiple peer connections
3. Implement video grid layout
4. Add participant management UI

### Add Screen Sharing:
1. Use `getDisplayMedia()` API
2. Replace video track in existing peer connection
3. Add screen sharing controls to UI

### Add Recording:
1. Use MediaRecorder API
2. Implement server-side recording storage
3. Add recording controls and permissions

## API Reference

### Socket.IO Events (Signaling Server)

#### Client → Server:
- `join-room` - Join a room for calling
- `leave-room` - Leave the current room  
- `offer` - Send WebRTC offer to peer
- `answer` - Send WebRTC answer to peer
- `ice-candidate` - Send ICE candidate to peer
- `chat-message` - Send text chat message

#### Server → Client:
- `joined-room` - Confirmation of room join
- `left-room` - Confirmation of room leave
- `user-joined` - Notification of new user in room
- `user-left` - Notification of user leaving room
- `existing-users` - List of users already in room
- `offer` - Received WebRTC offer from peer
- `answer` - Received WebRTC answer from peer  
- `ice-candidate` - Received ICE candidate from peer
- `chat-message` - Received text chat message
- `error` - Error message

### REST API (Signaling Server)
- `GET /health` - Server health check with statistics

## Status: ✅ Ready for Testing!

The WebRTC video calling application is now complete and ready for testing. Both the signaling server and Next.js frontend are fully functional.