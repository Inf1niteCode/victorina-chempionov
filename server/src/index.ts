import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

import authRouter from './routes/auth';
import gameRouter from './routes/game';
import themesRouter from './routes/themes';
import paymentsRouter from './routes/payments';
import { initSocket } from './socket';

const app = express();
const httpServer = http.createServer(app);

// ────────────────────────────────────────────
// Socket.io
// ────────────────────────────────────────────

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initSocket(io);

// ────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);
app.use('/api/themes', themesRouter);
app.use('/api/payments', paymentsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Клиентский билд в продакшне ──
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: `Маршрут ${req.method} ${req.path} не найден` });
  });
}

// ────────────────────────────────────────────
// Запуск
// ────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📡 Socket.io слушает на ws://localhost:${PORT}`);
  console.log(`🌍 Режим: ${process.env.NODE_ENV || 'development'}\n`);
});
