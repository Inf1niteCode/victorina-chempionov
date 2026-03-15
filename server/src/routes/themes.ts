import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

// ────────────────────────────────────────────
// GET /api/themes — все темы с флагом доступа
// ────────────────────────────────────────────

router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const themes = await prisma.theme.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        questions: {
          orderBy: { points: 'asc' },
          select: { id: true, points: true, text: true },
        },
        purchases: userId
          ? { where: { userId }, select: { id: true } }
          : false,
      },
    });

    const result = themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      category: theme.category,
      isFree: theme.isFree,
      isPurchased: theme.isFree || (userId ? theme.purchases.length > 0 : false),
      questions: theme.questions,
    }));

    res.json({ themes: result });
  } catch (err) {
    console.error('[themes/]', err);
    res.status(500).json({ error: 'Ошибка загрузки тем' });
  }
});

// ────────────────────────────────────────────
// GET /api/themes/my — только купленные + бесплатные
// ────────────────────────────────────────────

router.get('/my', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const themes = await prisma.theme.findMany({
      where: {
        OR: [
          { isFree: true },
          { purchases: { some: { userId } } },
        ],
      },
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
