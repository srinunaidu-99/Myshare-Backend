const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production for security
    methods: ["GET", "POST"]
  }
});

// Endpoint to generate QR Code for a room ID
app.get('/generate-qr/:roomId', async (req, res) => {
  try {
    const url = await QRCode.toDataURL(req.params.roomId);
    res.send({ qrCode: url });
  } catch (err) {
    res.status(500).send("Error generating QR code");
  }
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Handle text messages
  socket.on('send-message', (data) => {
    socket.to(data.roomId).emit('receive-message', data.message);
  });

  // Handle file sharing (base64)
  socket.on('send-file', (data) => {
    socket.to(data.roomId).emit('receive-file', {
      fileName: data.fileName,
      fileData: data.fileData,
      fileType: data.fileType
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
