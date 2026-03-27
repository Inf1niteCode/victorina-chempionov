import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

const router = Router();

// ────────────────────────────────────────────
// GET /api/themes — все темы (все доступны)
// ────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        questions: {
          orderBy: { points: 'asc' },
          select: { id: true, points: true, text: true },
        },
      },
    });

    const result = themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      category: theme.category,
      isPurchased: true,
      questions: theme.questions,
    }));

    res.json({ themes: result });
  } catch (err) {
    console.error('[themes/]', err);
    res.status(500).json({ error: 'Ошибка загрузки тем' });
  }
});

// ────────────────────────────────────────────
// GET /api/themes/my — все темы (все доступны)
// ────────────────────────────────────────────

router.get('/my', async (_req: Request, res: Response) => {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        questions: {
          orderBy: { points: 'asc' },
          select: { id: true, points: true, text: true },
        },
      },
    });

    res.json({ themes });
  } catch (err) {
    console.error('[themes/my]', err);
    res.status(500).json({ error: 'Ошибка загрузки тем' });
  }
});

export default router;
