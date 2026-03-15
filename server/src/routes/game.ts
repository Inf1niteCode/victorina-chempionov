import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ────────────────────────────────────────────
// Генерация уникального 6-символьного кода
// ────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без O,0,I,1 — читаемее
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueCode(): Promise<string> {
  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.game.findUnique({ where: { code } });
    if (!existing) return code;
    code = generateCode();
    attempts++;
  }
  throw new Error('Не удалось сгенерировать уникальный код');
}

// ────────────────────────────────────────────
// Схемы
// ────────────────────────────────────────────

const createGameSchema = z.object({
  timerSecs: z.number().int().min(10).max(120).default(30),
  totalTours: z.number().int().min(1).max(3),
  tours: z.array(
    z.object({
      tourNumber: z.number().int().min(1).max(3),
      themeIds: z.array(z.string().cuid()).length(5),
    })
  ).min(1).max(3),
});

// ────────────────────────────────────────────
// GET /api/game/my — история игр ведущего
// ────────────────────────────────────────────

router.get('/my', requireAuth, async (req: Request, res: Response) => {
  try {
    const hostId = req.user!.userId;
    const games = await prisma.game.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, code: true, status: true,
        totalTours: true, timerSecs: true, createdAt: true,
        _count: { select: { players: true, rounds: true } },
        players: {
          orderBy: { score: 'desc' },
          select: { id: true, name: true, score: true },
        },
      },
    });
    res.json({ games });
  } catch (err) {
    console.error('[game/my]', err);
    res.status(500).json({ error: 'Ошибка загрузки истории' });
  }
});

// ────────────────────────────────────────────
// POST /api/game/create
// ────────────────────────────────────────────

router.post('/create', requireAuth, validate(createGameSchema), async (req: Request, res: Response) => {
  try {
    const { timerSecs, totalTours, tours } = req.body as z.infer<typeof createGameSchema>;
    const hostId = req.user!.userId;

    // Проверяем доступ к темам
    const allThemeIds = tours.flatMap((t) => t.themeIds);
    const uniqueThemeIds = [...new Set(allThemeIds)];

    // Одна тема не может быть в двух турах
    if (uniqueThemeIds.length !== allThemeIds.length) {
      res.status(400).json({ error: 'Одна тема не может быть в двух турах' });
      return;
    }

    // Проверяем, что у ведущего есть доступ ко всем темам
    const themes = await prisma.theme.findMany({
      where: { id: { in: uniqueThemeIds } },
      include: {
        purchases: { where: { userId: hostId } },
      },
    });

    if (themes.length !== uniqueThemeIds.length) {
      res.status(400).json({ error: 'Одна или несколько тем не найдены' });
      return;
    }

    for (const theme of themes) {
      if (!theme.isFree && theme.purchases.length === 0) {
        res.status(403).json({
          error: `Тема "${theme.name}" не куплена. Приобретите её в магазине.`,
        });
        return;
      }
    }

    const code = await uniqueCode();

    // Транзакция: создаём Game + GameTour + GameTourTheme
    const game = await prisma.$transaction(async (tx) => {
      const newGame = await tx.game.create({
        data: {
          code,
          hostId,
          timerSecs,
          totalTours,
          status: 'LOBBY',
        },
      });

      for (const tourData of tours) {
        const gameTour = await tx.gameTour.create({
          data: {
            gameId: newGame.id,
            tourNumber: tourData.tourNumber,
            status: 'PENDING',
          },
        });

        for (let pos = 0; pos < tourData.themeIds.length; pos++) {
          await tx.gameTourTheme.create({
            data: {
              tourId: gameTour.id,
              themeId: tourData.themeIds[pos],
              position: pos + 1,
            },
          });
        }
      }

      return newGame;
    });

    res.status(201).json({
      game: {
        id: game.id,
        code: game.code,
        timerSecs: game.timerSecs,
        totalTours: game.totalTours,
        status: game.status,
      },
    });
  } catch (err) {
    console.error('[game/create]', err);
    res.status(500).json({ error: 'Ошибка создания игры' });
  }
});

// ────────────────────────────────────────────
// DELETE /api/game/:code — отмена игры в лобби
// ────────────────────────────────────────────

router.delete('/:code', requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const hostId = req.user!.userId;

    const game = await prisma.game.findUnique({ where: { code: code.toUpperCase() } });

    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }
    if (game.hostId !== hostId) {
      res.status(403).json({ error: 'Нет доступа' });
      return;
    }
    if (game.status === 'ACTIVE') {
      res.status(400).json({ error: 'Нельзя удалить активную игру' });
      return;
    }

    // Удаляем в порядке зависимостей (нет каскада в схеме)
    await prisma.$transaction([
      prisma.round.deleteMany({ where: { gameId: game.id } }),
      prisma.player.deleteMany({ where: { gameId: game.id } }),
      prisma.gameTourTheme.deleteMany({ where: { tour: { gameId: game.id } } }),
      prisma.gameTour.deleteMany({ where: { gameId: game.id } }),
      prisma.game.delete({ where: { id: game.id } }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('[game/delete]', err);
    res.status(500).json({ error: 'Ошибка удаления игры' });
  }
});

// ────────────────────────────────────────────
// GET /api/game/:code — публичные данные игры
// (нужно для /display и /play)
// ────────────────────────────────────────────

router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const game = await prisma.game.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        host: { select: { id: true, name: true } },
        tours: {
          orderBy: { tourNumber: 'asc' },
          include: {
            themes: {
              orderBy: { position: 'asc' },
              include: {
                theme: {
                  include: {
                    questions: {
                      orderBy: { points: 'asc' },
                      select: { id: true, points: true, text: true },
                    },
                  },
                },
              },
            },
          },
        },
        players: {
          orderBy: { score: 'desc' },
          select: { id: true, name: true, score: true },
        },
      },
    });

    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }

    res.json({ game });
  } catch (err) {
    console.error('[game/:code]', err);
    res.status(500).json({ error: 'Ошибка получения игры' });
  }
});

// ────────────────────────────────────────────
// GET /api/game/:code/host — приватные данные
// (только для ведущего, с ответами)
// ────────────────────────────────────────────

router.get('/:code/host', requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const hostId = req.user!.userId;

    const game = await prisma.game.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        tours: {
          orderBy: { tourNumber: 'asc' },
          include: {
            themes: {
              orderBy: { position: 'asc' },
              include: {
                theme: {
                  include: {
                    // Полные вопросы с ответами — только для ведущего
                    questions: { orderBy: { points: 'asc' } },
                  },
                },
              },
            },
          },
        },
        players: {
          orderBy: { score: 'desc' },
          select: { id: true, name: true, score: true },
        },
        rounds: true,
      },
    });

    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }

    if (game.hostId !== hostId) {
      res.status(403).json({ error: 'Нет доступа' });
      return;
    }

    res.json({ game });
  } catch (err) {
    console.error('[game/:code/host]', err);
    res.status(500).json({ error: 'Ошибка получения данных игры' });
  }
});

export default router;
