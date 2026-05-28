import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma from './services/prisma';
import listingRoutes from './routes/listing.routes';
import authRoutes from './routes/auth.routes';
import conversationRoutes from './routes/conversation.routes';
import conversationService from './services/conversation.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3011;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/listings', listingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('send_message', async (data: { conversationId: string; senderId: string; text: string }) => {
    try {
      const message = await conversationService.sendMessage(
        data.conversationId,
        data.senderId,
        data.text
      );
      
      // Broadcast to all users in the conversation room
      io.to(data.conversationId).emit('new_message', message);
    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});
