// Simple test server for video call testing
// This is a minimal Socket.IO server for testing the video call functionality

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const connectedUsers = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Store user connection
  connectedUsers.set(socket.id, {
    id: socket.id,
    socket: socket,
    rooms: []
  });

  // Send session info to client
  socket.emit('session-created', {
    sessionId: socket.id,
    username: `User_${socket.id.slice(0, 6)}`
  });

  // Handle simple-peer signaling
  socket.on('simple-peer-signal', (data) => {
    console.log('Simple Peer signal:', data);
    const { to, signal, roomId } = data;
    
    if (to && connectedUsers.has(to)) {
      connectedUsers.get(to).socket.emit('simple-peer-signal', {
        from: socket.id,
        signal: signal,
        roomId: roomId
      });
    }
  });

  // Handle call requests
  socket.on('simple-peer-call-request', (data) => {
    console.log('Call request:', data);
    const { to, callerName, roomId } = data;
    
    if (to && connectedUsers.has(to)) {
      connectedUsers.get(to).socket.emit('simple-peer-call-request', {
        from: socket.id,
        callerName: callerName,
        roomId: roomId
      });
    }
  });

  // Handle call ending
  socket.on('simple-peer-call-end', (data) => {
    console.log('Call ended:', data);
    const { roomId } = data;
    
    // Broadcast to all users in the room
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.users.forEach(userId => {
        if (userId !== socket.id && connectedUsers.has(userId)) {
          connectedUsers.get(userId).socket.emit('simple-peer-call-end', {
            from: socket.id,
            roomId: roomId
          });
        }
      });
    }
  });

  // Handle room joining
  socket.on('join-simple-peer-room', (data) => {
    console.log('Join room:', data);
    const { roomId, userId } = data;
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: [] });
    }
    
    const room = rooms.get(roomId);
    if (!room.users.includes(userId)) {
      room.users.push(userId);
    }
    
    socket.join(roomId);
    
    // Notify other users in the room
    socket.to(roomId).emit('user-joined', { userId: userId });
  });

  // Handle room leaving
  socket.on('leave-simple-peer-room', (data) => {
    console.log('Leave room:', data);
    const { roomId, userId } = data;
    
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.users = room.users.filter(id => id !== userId);
      
      if (room.users.length === 0) {
        rooms.delete(roomId);
      } else {
        socket.to(roomId).emit('user-left', { userId: userId });
      }
    }
    
    socket.leave(roomId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up rooms
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.rooms.forEach(roomId => {
        if (rooms.has(roomId)) {
          const room = rooms.get(roomId);
          room.users = room.users.filter(id => id !== socket.id);
          
          if (room.users.length === 0) {
            rooms.delete(roomId);
          } else {
            socket.to(roomId).emit('user-left', { userId: socket.id });
          }
        }
      });
    }
    
    connectedUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- Socket.IO connection: ws://localhost:' + PORT);
  console.log('- Simple Peer signaling supported');
  console.log('- Room management supported');
});