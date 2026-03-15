import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma/client';
import { getRoom } from './roomStore';
import { emitTourStart } from './gameHandlers';
import { getPlayerList } from './roomHandlers';

export function registerTourHandlers(io: Server, socket: Socket): void {

  // tour:next — ведущий нажал «Начать следующий тур»
  socket.on('tour:next', async ({ code }: { code: string }) => {
    const room = getRoom(code);
    if (!room) return;
    if (room.hostSocketId !== socket.id) return;

    const nextTour = room.currentTour + 1;

    if (nextTour > room.totalTours) {
      // Финал
      await endGame(io, code);
      return;
    }

    await emitTourStart(io, code, nextTour);
  });

  // game:end — ведущий принудительно завершает игру
  socket.on('game:end', async ({ code }: { code: string }) => {
    const room = getRoom(code);
    if (!room) return;
    if (room.hostSocketId !== socket.id) return;
    await endGame(io, code);
  });
}

async function endGame(io: Server, code: string): Promise<void> {
  const room = getRoom(code);
  if (!room) return;

  try {
    await prisma.game.update({
      where: { code },
      data: { status: 'FINISHED' },
    });

    room.status = 'FINISHED';

    const scores = getPlayerList(room);
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const winner = sorted[0] ?? { id: '', name: 'Нет победителя', score: 0 };

    io.to(code).emit('game:end', {
      winner,
      finalScores: sorted,
    });

    console.log(`[game:end] Room ${code} finished. Winner: ${winner.name}`);
  } catch (err) {
    console.error('[endGame]', err);
  }
}
