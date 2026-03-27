import { Server, Socket } from 'socket.io';
import { getRoom } from './roomStore';

// Серверный таймер — единственный источник истины для всех клиентов
export function startTimer(
  io: Server,
  code: string,
  onExpire: () => void
): void {
  const room = getRoom(code);
  if (!room?.activeQuestion) return;

  const aq = room.activeQuestion;
  aq.startedAt = Date.now();
  aq.pausedAt = null;
  aq.remainingMs = aq.timeLimit * 1000;

  // Сбрасываем состояние паузы у клиентов и эмитируем первый тик
  io.to(code).emit('timer:reset');
  io.to(code).emit('timer:tick', { secondsLeft: aq.timeLimit });

  const interval = setInterval(() => {
    const r = getRoom(code);
    if (!r?.activeQuestion) { clearInterval(interval); return; }
    const a = r.activeQuestion;
    if (a.pausedAt !== null) return; // пауза — не тикаем

    const elapsed = Date.now() - a.startedAt;
    const remaining = Math.max(0, a.remainingMs - elapsed);
    const secondsLeft = Math.ceil(remaining / 1000);

    io.to(code).emit('timer:tick', { secondsLeft });

    if (remaining <= 0) {
      clearInterval(interval);
      a.timerId = null;
      io.to(code).emit('timer:end');
      onExpire();
    }
  }, 500);

  aq.timerId = interval as unknown as ReturnType<typeof setTimeout>;
}

export function stopTimer(code: string): void {
  const room = getRoom(code);
  if (!room?.activeQuestion) return;
  const aq = room.activeQuestion;
  if (aq.timerId) {
    clearInterval(aq.timerId as unknown as ReturnType<typeof setInterval>);
    aq.timerId = null;
  }
}

export function registerTimerHandlers(io: Server, socket: Socket): void {
  // timer:pause
  socket.on('timer:pause', ({ code }: { code: string }) => {
    const room = getRoom(code);
    if (!room?.activeQuestion) return;
    if (room.hostSocketId !== socket.id) return;

    const aq = room.activeQuestion;
    if (aq.pausedAt === null) {
      // Ставим на паузу
      const elapsed = Date.now() - aq.startedAt;
      aq.remainingMs = Math.max(0, aq.remainingMs - elapsed);
      aq.pausedAt = Date.now();
      io.to(code).emit('timer:paused');
    } else {
      // Снимаем с паузы
      aq.startedAt = Date.now();
      aq.pausedAt = null;
      io.to(code).emit('timer:reset');
    }
  });

  // timer:reset
  socket.on('timer:reset', ({ code }: { code: string }) => {
    const room = getRoom(code);
    if (!room?.activeQuestion) return;
    if (room.hostSocketId !== socket.id) return;

    stopTimer(code);

    const aq = room.activeQuestion;
    aq.remainingMs = aq.timeLimit * 1000;
    aq.startedAt = Date.now();
    aq.pausedAt = null;

    io.to(code).emit('timer:tick', { secondsLeft: aq.timeLimit });
    io.to(code).emit('timer:reset');

    startTimer(io, code, () => {
      // Таймер истёк после сброса — вопрос остаётся открытым, ведущий закрывает вручную
    });
  });
}

