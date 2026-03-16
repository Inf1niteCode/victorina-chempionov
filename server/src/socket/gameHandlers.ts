import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma/client';
import { getRoom } from './roomStore';
import { startTimer, stopTimer } from './timerHandlers';
import { getPlayerList } from './roomHandlers';

export function registerGameHandlers(io: Server, socket: Socket): void {

  // ──────────────────────────────────────────
  // game:start — ведущий запускает игру
  // ──────────────────────────────────────────
  socket.on('game:start', async ({ code }: { code: string }) => {
    const room = getRoom(code);
    if (!room) return;
    if (room.hostSocketId !== socket.id) return;

    try {
      // Обновляем статус игры в БД
      await prisma.game.update({
        where: { code },
        data: { status: 'ACTIVE' },
      });

      room.status = 'ACTIVE';

      // Загружаем первый тур
      await emitTourStart(io, code, 1);
    } catch (err) {
      console.error('[game:start]', err);
      socket.emit('room:error', { message: 'Ошибка запуска игры' });
    }
  });

  // ──────────────────────────────────────────
  // question:open — ведущий открывает вопрос
  // ──────────────────────────────────────────
  socket.on(
    'question:open',
    async ({ code, questionId }: { code: string; questionId: string }) => {
      const room = getRoom(code);
      if (!room) return;
      if (room.hostSocketId !== socket.id) return;

      try {
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          include: { theme: { select: { name: true } } },
        });

        if (!question) {
          socket.emit('room:error', { message: 'Вопрос не найден' });
          return;
        }

        // Сбрасываем buzz и штрафы предыдущего вопроса
        room.buzzed = new Set();
        room.penalizedPlayers = new Set();

        // Сохраняем активный вопрос
        room.activeQuestion = {
          questionId,
          text: question.text,
          answer: question.answer,
          points: question.points,
          themeName: question.theme.name,
          timeLimit: room.timerSecs,
          startedAt: Date.now(),
          timerId: null,
          pausedAt: null,
          remainingMs: room.timerSecs * 1000,
        };

        // Ведущий получает полные данные (с ответом)
        io.to(`${code}:host`).emit('question:open', {
          questionId,
          text: question.text,
          answer: question.answer,
          points: question.points,
          themeName: question.theme.name,
          timeLimit: room.timerSecs,
        });

        // Игроки и дисплей — без ответа
        socket.to(code).emit('question:open', {
          questionId,
          text: question.text,
          answer: '',
          points: question.points,
          themeName: question.theme.name,
          timeLimit: room.timerSecs,
        });

        // Запускаем серверный таймер
        startTimer(io, code, () => {
          autoCloseQuestion(io, code);
        });

        console.log(`[question:open] "${question.text.slice(0, 40)}..." in room ${code}`);
      } catch (err) {
        console.error('[question:open]', err);
      }
    }
  );

  // ──────────────────────────────────────────
  // question:close — ведущий закрывает вопрос (✅ или ❌)
  // ──────────────────────────────────────────
  socket.on(
    'question:close',
    ({ code, questionId }: { code: string; questionId: string }) => {
      const room = getRoom(code);
      if (!room) return;
      if (room.hostSocketId !== socket.id) return;

      stopTimer(code);
      room.activeQuestion = null;
      room.buzzed = new Set();
      room.answeredQuestions.add(questionId);

      io.to(code).emit('question:close', { questionId });

      // Проверяем, закончился ли тур
      checkTourCompletion(io, code);
    }
  );

  // ──────────────────────────────────────────
  // score:correct — ведущий нажал ✅
  // ──────────────────────────────────────────
  socket.on(
    'score:correct',
    async ({ code, playerId, questionId }: { code: string; playerId: string; questionId: string }) => {
      const room = getRoom(code);
      if (!room) return;
      if (room.hostSocketId !== socket.id) return;

      try {
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          select: { points: true },
        });
        if (!question) return;

        // Обновляем счёт в памяти
        const player = room.players.get(playerId);
        if (player) player.score += question.points;

        // Обновляем счёт в БД
        await prisma.player.update({
          where: { id: playerId },
          data: { score: { increment: question.points } },
        });

        // Записываем раунд в БД
        await prisma.round.upsert({
          where: { gameId_questionId: { gameId: room.gameId, questionId } },
          create: {
            gameId: room.gameId,
            questionId,
            tourNumber: room.currentTour,
            winnerId: playerId,
            correct: true,
          },
          update: { winnerId: playerId, correct: true },
        });

        // Рассылаем обновлённый счёт
        io.to(code).emit('score:update', { players: getPlayerList(room) });

        console.log(`[score:correct] +${question.points} for player ${playerId} in room ${code}`);
      } catch (err) {
        console.error('[score:correct]', err);
      }
    }
  );

  // ──────────────────────────────────────────
  // score:wrong — ведущий нажал ❌
  // ──────────────────────────────────────────
  socket.on(
    'score:wrong',
    async ({ code, playerId, questionId }: { code: string; playerId: string; questionId: string }) => {
      const room = getRoom(code);
      if (!room) return;
      if (room.hostSocketId !== socket.id) return;

      try {
        // Защита от двойного списания: один игрок — один штраф за вопрос
        const penaltyKey = `${playerId}:${questionId}`;
        if (room.penalizedPlayers.has(penaltyKey)) return;
        room.penalizedPlayers.add(penaltyKey);

        const question = await prisma.question.findUnique({
          where: { id: questionId },
          select: { points: true },
        });
        if (!question) return;

        // Вычитаем очки
        const player = room.players.get(playerId);
        if (player) player.score -= question.points;

        await prisma.player.update({
          where: { id: playerId },
          data: { score: { decrement: question.points } },
        });

        await prisma.round.upsert({
          where: { gameId_questionId: { gameId: room.gameId, questionId } },
          create: {
            gameId: room.gameId, questionId,
            tourNumber: room.currentTour,
            winnerId: playerId, correct: false,
          },
          update: { winnerId: playerId, correct: false },
        });

        io.to(code).emit('score:update', { players: getPlayerList(room) });

        // Разблокируем buzz — другой игрок может нажать
        room.buzzed.delete(playerId);

        // Сообщаем всем клиентам что buzz снова открыт
        io.to(code).emit('buzz:reset');

        console.log(`[score:wrong] -${question.points} for player ${playerId} in room ${code}`);
      } catch (err) {
        console.error('[score:wrong]', err);
      }
    }
  );
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function autoCloseQuestion(io: Server, code: string): void {
  const room = getRoom(code);
  if (!room?.activeQuestion) return;
  const qId = room.activeQuestion.questionId;
  room.answeredQuestions.add(qId);
  room.activeQuestion = null;
  room.buzzed = new Set();
  io.to(code).emit('question:close', { questionId: qId });
  checkTourCompletion(io, code);
}

async function checkTourCompletion(io: Server, code: string): Promise<void> {
  const room = getRoom(code);
  if (!room) return;

  // Загружаем вопросы текущего тура
  try {
    const game = await prisma.game.findUnique({
      where: { code },
      include: {
        tours: {
          where: { tourNumber: room.currentTour },
          include: {
            themes: {
              include: { theme: { include: { questions: { select: { id: true } } } } },
            },
          },
        },
      },
    });

    if (!game) return;

    const currentTourData = game.tours[0];
    if (!currentTourData) return;

    const allQIds = currentTourData.themes.flatMap((tt) =>
      tt.theme.questions.map((q) => q.id)
    );

    const allAnswered = allQIds.every((id) => room.answeredQuestions.has(id));

    if (allAnswered) {
      const scores = Array.from(room.players.values()).map((p) => ({
        id: p.id, name: p.name, score: p.score,
      }));

      io.to(code).emit('tour:end', {
        scores,
        tourNumber: room.currentTour,
        isLastTour: room.currentTour >= room.totalTours,
      });

      // Обновляем статус тура в БД
      await prisma.gameTour.updateMany({
        where: { gameId: room.gameId, tourNumber: room.currentTour },
        data: { status: 'FINISHED' },
      });
    }
  } catch (err) {
    console.error('[checkTourCompletion]', err);
  }
}

export async function emitTourStart(io: Server, code: string, tourNumber: number): Promise<void> {
  const room = getRoom(code);
  if (!room) return;

  try {
    const game = await prisma.game.findUnique({
      where: { code },
      include: {
        tours: {
          where: { tourNumber },
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

    if (!game) return;

    const tour = game.tours[0];
    if (!tour) return;

    // Обновляем статус тура
    await prisma.gameTour.update({
      where: { id: tour.id },
      data: { status: 'ACTIVE' },
    });

    room.currentTour = tourNumber;
    room.answeredQuestions = new Set();

    const themes = tour.themes.map((tt) => ({
      themeId: tt.theme.id,
      themeName: tt.theme.name,
      position: tt.position,
      cells: tt.theme.questions.map((q) => ({
        questionId: q.id,
        points: q.points,
        answered: false,
      })),
    }));

    io.to(code).emit('tour:start', {
      tourNumber,
      totalTours: room.totalTours,
      themes,
    });

    console.log(`[tour:start] Tour ${tourNumber} in room ${code}`);
  } catch (err) {
    console.error('[emitTourStart]', err);
  }
}
