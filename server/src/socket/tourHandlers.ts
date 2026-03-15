import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma/client';
import { getRoom } from './roomStore';
import { emitTourStart } from './gameHandlers';
import { getPlayerList } from './roomHandlers';

export function registerTourHandlers(io: Server, socket: Socket): void {

  // tour:rejoin — ведущий переподключился, синхронизируем состояние
  socket.on('tour:rejoin', async ({ code }: { code: string }) => {
    const room = getRoom(code);
    if (!room) return;

    try {
      const game = await prisma.game.findUnique({
        where: { code },
        include: {
          tours: {
            where: { tourNumber: room.currentTour },
            include: {
              themes: {
                orderBy: { position: 'asc' },
                include: {
                  theme: {
                    include: { questions: { orderBy: { points: 'asc' } } },
                  },
                },
              },
            },
          },
        },
      });

      if (!game || !game.tours[0]) return;

      const tour = game.tours[0];
      const themes = tour.themes.map((tt) => ({
        themeId: tt.theme.id,
        themeName: tt.theme.name,
        position: tt.position,
        cells: tt.theme.questions.map((q) => ({
          questionId: q.id,
          points: q.points,
          answered: room.answeredQuestions.has(q.id),
        })),
      }));

      // Отправляем текущий тур и поле
      socket.emit('tour:start', {
        tourNumber: room.currentTour,
        totalTours: room.totalTours,
        themes,
      });

      // Список игроков
      socket.emit('room:playerList', { players: getPlayerList(room) });

      // Если открыт вопрос — отправляем его с ответом (ведущий)
      if (room.activeQuestion) {
        const aq = room.activeQuestion;
        socket.emit('question:open', {
          questionId: aq.questionId,
          text: aq.text,
          answer: aq.answer,
          points: aq.points,
          themeName: aq.themeName,
          timeLimit: aq.timeLimit,
        });
      }

      console.log(`[tour:rejoin] Host rejoined room ${code}, tour ${room.currentTour}`);
    } catch (err) {
      console.error('[tour:rejoin]', err);
    }
  });

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
