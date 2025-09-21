#!/bin/bash

# WebRTC Video Calling App - Test Script
# This script demonstrates how to test the complete video calling functionality

echo "🚀 WebRTC Video Calling App - Test Guide"
echo "========================================"
echo

echo "📋 Prerequisites Check:"
echo "✅ Signaling Server running on http://localhost:4000"
echo "✅ Next.js App running on http://localhost:3001"
echo "✅ Socket.IO client installed"
echo

echo "🧪 Testing Instructions:"
echo

echo "1. BASIC CONNECTIVITY TEST:"
echo "   • Open: http://localhost:4000/health"
echo "   • Should show server status with 0 active rooms"
echo

echo "2. VIDEO CALL INTERFACE TEST:"
echo "   • Open: http://localhost:3001/call"
echo "   • Should show 'Status: connected' at the top"
echo "   • Should display your local video stream"
echo

echo "3. SINGLE USER ROOM TEST:"
echo "   • Enter room ID: 'test123'"
echo "   • Click 'Join Room'"
echo "   • Status should change to 'Status: in-room'"
echo "   • Should see 'Waiting for other participant...'"
echo

echo "4. TWO-USER VIDEO CALL TEST:"
echo "   • Open a second browser tab/window"
echo "   • Navigate to: http://localhost:3001/call"
echo "   • Enter the same room ID: 'test123'"
echo "   • Click 'Join Room'"
echo "   • Both users should see each other's video"
echo "   • Status should show 'Status: call-active'"
echo

echo "5. CHAT FUNCTIONALITY TEST:"
echo "   • Type a message in the chat box"
echo "   • Click 'Send' or press Enter"
echo "   • Message should appear in both users' chat"
echo "   • Look for 🟢 Direct (DataChannel) or 🔴 Server (Socket.IO)"
echo

echo "6. MEDIA CONTROLS TEST:"
echo "   • Click '📹 Video On/Off' to toggle video"
echo "   • Click '🎤 Audio On/Off' to toggle audio"
echo "   • Changes should be visible to the other user"
echo

echo "7. CONNECTION CLEANUP TEST:"
echo "   • Close one browser tab"
echo "   • Other user should see video disappear"
echo "   • Status should return to 'in-room'"
echo

echo "📊 Debug Information:"
echo "   • Scroll to bottom of call page for debug panel"
echo "   • Shows connection states and troubleshooting info"
echo

echo "🛠️  Troubleshooting:"
echo "   • If camera/mic not working: Check browser permissions"
echo "   • If connection fails: Check browser console for errors"
echo "   • If no video: Try different browsers (Chrome recommended)"
echo "   • If chat not working: Check DataChannel state in debug panel"
echo

echo "🌐 Browser Compatibility:"
echo "   • ✅ Chrome (Recommended)"
echo "   • ✅ Firefox"
echo "   • ✅ Safari"
echo "   • ✅ Edge"
echo

echo "🔒 Security Notes:"
echo "   • Camera/mic access requires user permission"
echo "   • HTTPS required for production deployment"
echo "   • WebRTC works peer-to-peer (no video data through server)"
echo

echo "🎯 Success Criteria:"
echo "   ✅ Two users can see each other's video"
echo "   ✅ Audio communication works both ways"  
echo "   ✅ Text chat messages appear in real-time"
echo "   ✅ Media controls (video/audio toggle) work"
echo "   ✅ Users can join/leave rooms cleanly"
echo

echo "📝 Next Steps:"
echo "   • Test with different room IDs"
echo "   • Try screen sharing (extend the code)"
echo "   • Test on different devices/networks"
echo "   • Deploy to production with HTTPS"

echo
echo "Happy testing! 🎉"