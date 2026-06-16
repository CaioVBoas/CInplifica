import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './services/prisma';
import listingRoutes from './routes/listing.routes';
import authRoutes from './routes/auth.routes';
import conversationRoutes from './routes/conversation.routes';
import reportRoutes from './routes/report.routes';
import moderationRoutes from './routes/moderation.routes';
import auditLogRoutes from './routes/audit-log.routes';
import reviewRoutes from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
import interestRoutes from './routes/interest.routes';
import conversationService from './services/conversation.service';
import { env } from './config/env';

type Participant = {
  id: string;
  name: string;
  email: string;
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

const PORT = env.port;

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: '7mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadRoot)));

// Routes
app.use('/api/listings', listingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interests', interestRoutes);

// Basic health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, env.jwtSecret) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, status: true },
    });

    if (!user || user.status === 'SUSPENDED') {
      return next(new Error('Unauthorized'));
    }

    socket.data.user = user;
    return next();
  } catch (error) {
    return next(new Error('Unauthorized'));
  }
});

// WebSocket logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.join(`user:${socket.data.user.id}`);

  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('send_message', async (data: { conversationId: string; senderId: string; text: string }) => {
    try {
      const message = await conversationService.sendMessage(
        data.conversationId,
        socket.data.user.id,
        data.text
      );
      
      // Broadcast to all users in the conversation room
      io.to(data.conversationId).emit('new_message', message);

      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { users: { select: { id: true } } },
      });

      if (conversation) {
        await Promise.all(
          conversation.users
            .filter((participant: { id: string }) => participant.id !== socket.data.user.id)
            .map(async (participant: { id: string }) => {
              const count = await conversationService.getTotalUnreadCount(participant.id);
              io.to(`user:${participant.id}`).emit('unread_count_updated', { count });
            })
        );
      }
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
