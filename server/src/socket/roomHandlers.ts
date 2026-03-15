import { Server, Socket } from 'socket.io';
import { prisma } from '../prisma/client';
import {
  createRoom,
  getRoom,
  registerSocket,
  RoomState,
  RoomPlayer,
} from './roomStore';

// ────────────────────────────────────────────
// Хелпер: список игроков для эмита
// ────────────────────────────────────────────

export function getPlayerList(room: RoomState) {
  return Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
  }));
}

// ────────────────────────────────────────────
// room:create — ведущий создаёт комнату
// ────────────────────────────────────────────

export function registerRoomHandlers(io: Server, socket: Socket): void {

  socket.on(
    'room:create',
    async (data: {
      code: string;
      gameId: string;
      timerSecs: number;
      totalTours: number;
    }) => {
      try {
        const { code, gameId, timerSecs, totalTours } = data;

        // Проверяем, что такая игра существует в БД
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          select: { id: true, code: true, status: true },
        });

        if (!game) {
          socket.emit('room:error', { message: 'Игра не найдена' });
          return;
        }

        if (game.code !== code) {
          socket.emit('room:error', { message: 'Неверный код игры' });
          return;
        }

        // Если комната уже существует — ведущий переподключился
        const existing = getRoom(code);
        if (existing) {
          existing.hostSocketId = socket.id;
          registerSocket(socket.id, code);
          socket.join(code);
          socket.join(`${code}:host`);

          socket.emit('room:playerList', { players: getPlayerList(existing) });
          console.log(`[room:create] Host reconnected to room ${code}`);
          return;
        }

        // Создаём новую комнату
        const roomState: RoomState = {
          code,
          hostSocketId: socket.id,
          gameId,
          timerSecs,
          totalTours,
          currentTour: 1,
          players: new Map(),
          answeredQuestions: new Set(),
          activeQuestion: null,
          buzzed: new Set(),
          penalizedPlayers: new Set(),
          status: 'LOBBY',
        };

        createRoom(roomState);
        registerSocket(socket.id, code);

        // Ведущий присоединяется к двум комнатам:
        // code      — общая (все участники)
        // code:host — только ведущий (для приватных событий)
        socket.join(code);
        socket.join(`${code}:host`);

        socket.emit('room:playerList', { players: [] });
        console.log(`[room:create] Room ${code} created by socket ${socket.id}`);
      } catch (err) {
        console.error('[room:create]', err);
        socket.emit('room:error', { message: 'Ошибка создания комнаты' });
      }
    }
  );

  // ────────────────────────────────────────────
  // room:join — игрок подключается по коду
  // ────────────────────────────────────────────

  socket.on(
    'room:join',
    async (data: { code: string; playerName: string }) => {
      try {
        const { code, playerName } = data;

        const room = getRoom(code);
        if (!room) {
          socket.emit('room:error', { message: 'Комната не найдена. Проверьте код.' });
          return;
        }

        if (room.status === 'FINISHED') {
          socket.emit('room:error', { message: 'Игра уже завершена' });
          return;
        }

        const trimmedName = playerName.trim();
        if (!trimmedName || trimmedName.length < 1) {
          socket.emit('room:error', { message: 'Введите имя' });
          return;
        }

        if (trimmedName.length > 20) {
          socket.emit('room:error', { message: 'Имя слишком длинное (макс. 20 символов)' });
          return;
        }

        // Проверяем, не занято ли имя
        const nameTaken = Array.from(room.players.values()).some(
          (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (nameTaken) {
          socket.emit('room:error', { message: 'Игрок с таким именем уже в комнате' });
          return;
        }

        // Создаём игрока в БД
        const player = await prisma.player.create({
          data: {
            name: trimmedName,
            score: 0,
            gameId: room.gameId,
          },
        });

        // Добавляем в оперативное состояние
        const roomPlayer: RoomPlayer = {
          id: player.id,
          name: player.name,
          score: 0,
          socketId: socket.id,
        };

        room.players.set(player.id, roomPlayer);

        // socketId → code для быстрого поиска
        const { registerSocket } = await import('./roomStore');
        registerSocket(socket.id, code);

        // Присоединяем к Socket.io комнате
        socket.join(code);

        // Сообщаем всем об обновлённом списке
        io.to(code).emit('room:playerList', { players: getPlayerList(room) });

        // Уведомляем остальных о новом игроке
        socket.to(code).emit('room:playerJoined', { playerName: trimmedName });

        // Новому игроку — подтверждение с его ID и текущим состоянием
        socket.emit('room:joined', {
          playerId: player.id,
          playerName: player.name,
          gameStatus: room.status,
          currentTour: room.currentTour,
          totalTours: room.totalTours,
        });

        console.log(`[room:join] "${trimmedName}" joined room ${code} (playerId: ${player.id})`);
      } catch (err) {
        console.error('[room:join]', err);
        socket.emit('room:error', { message: 'Ошибка подключения к комнате' });
      }
    }
  );

  // ────────────────────────────────────────────
  // room:getPlayers — запрос текущего списка
  // ────────────────────────────────────────────

  socket.on('room:getPlayers', (data: { code: string }) => {
    const room = getRoom(data.code);
    if (!room) return;
    socket.emit('room:playerList', { players: getPlayerList(room) });
  });

  // ────────────────────────────────────────────
  // room:joinDisplay — дисплей подключается к комнате
  // ────────────────────────────────────────────

  socket.on('room:joinDisplay', async (data: { code: string }) => {
    const { code } = data;
    const room = getRoom(code);

    if (!room) {
      socket.emit('room:error', { message: 'Комната не найдена' });
      return;
    }

    // Присоединяем дисплей к общей комнате чтобы получать все broadcast-события
    socket.join(code);
    registerSocket(socket.id, code);

    // Отправляем текущий список игроков
    socket.emit('room:playerList', { players: getPlayerList(room) });

    // Если игра уже активна — синхронизируем состояние
    if (room.status === 'ACTIVE') {
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

        if (game && game.tours[0]) {
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

          socket.emit('tour:start', {
            tourNumber: room.currentTour,
            totalTours: room.totalTours,
            themes,
          });
        }

        // Если прямо сейчас идёт вопрос — отправляем его (без ответа)
        if (room.activeQuestion) {
          const aq = room.activeQuestion;
          socket.emit('question:open', {
            questionId: aq.questionId,
            text: aq.text,
            answer: '',
            points: aq.points,
            themeName: aq.themeName,
            timeLimit: aq.timeLimit,
          });
        }
      } catch (err) {
        console.error('[room:joinDisplay]', err);
      }
    }

    console.log(`[room:joinDisplay] Display joined room ${code}`);
  });
}
