import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// ─── GET /api/admin/themes ───────────────────
router.get('/themes', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const themes = await prisma.theme.findMany({
      include: { questions: { orderBy: { points: 'asc' } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ themes });
  } catch (err) {
    console.error('[admin/themes GET]', err);
    res.status(500).json({ error: 'Ошибка загрузки тем' });
  }
});

// ─── POST /api/admin/themes ──────────────────
router.post('/themes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body as {
      name: string; category: string;
    };
    if (!name?.trim() || !category?.trim()) {
      res.status(400).json({ error: 'name и category обязательны' });
      return;
    }
    const theme = await prisma.theme.create({
      data: { name: name.trim(), category: category.trim().toUpperCase() },
      include: { questions: true },
    });
    res.json({ theme });
  } catch (err) {
    console.error('[admin/themes POST]', err);
    res.status(500).json({ error: 'Ошибка создания темы' });
  }
});

// ─── PATCH /api/admin/themes/:id ─────────────
router.patch('/themes/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body as {
      name?: string; category?: string;
    };
    const theme = await prisma.theme.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category: category.trim().toUpperCase() }),
      },
      include: { questions: { orderBy: { points: 'asc' } } },
    });
    res.json({ theme });
  } catch (err) {
    console.error('[admin/themes PATCH]', err);
    res.status(500).json({ error: 'Ошибка обновления темы' });
  }
});

// ─── DELETE /api/admin/themes/:id ────────────
router.delete('/themes/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.question.deleteMany({ where: { themeId: req.params.id } });
    await prisma.theme.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/themes DELETE]', err);
    res.status(500).json({ error: 'Ошибка удаления темы' });
  }
});

// ─── POST /api/admin/themes/:id/questions ────
router.post('/themes/:id/questions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { text, answer, points, questionType, mediaUrl } = req.body as {
      text: string; answer: string; points: number;
      questionType?: string; mediaUrl?: string;
    };
    if (!text?.trim() || !answer?.trim() || !points) {
      res.status(400).json({ error: 'text, answer и points обязательны' });
      return;
    }
    const valid = [100, 200, 300, 400, 500];
    if (!valid.includes(Number(points))) {
      res.status(400).json({ error: 'points должен быть 100|200|300|400|500' });
      return;
    }
    const validTypes = ['TEXT', 'IMAGE', 'AUDIO', 'VIDEO'];
    const qType = questionType && validTypes.includes(questionType) ? questionType : 'TEXT';
    const question = await prisma.question.create({
      data: {
        text: text.trim(),
        answer: answer.trim(),
        points: Number(points),
        themeId: req.params.id,
        questionType: qType as 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO',
        mediaUrl: mediaUrl?.trim() || null,
      },
    });
    res.json({ question });
  } catch (err) {
    console.error('[admin/questions POST]', err);
    res.status(500).json({ error: 'Ошибка создания вопроса' });
  }
});

// ─── PATCH /api/admin/questions/:id ──────────
router.patch('/questions/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { text, answer, points, questionType, mediaUrl } = req.body as {
      text?: string; answer?: string; points?: number;
      questionType?: string; mediaUrl?: string;
    };
    if (points !== undefined && ![100, 200, 300, 400, 500].includes(Number(points))) {
      res.status(400).json({ error: 'points должен быть 100|200|300|400|500' });
      return;
    }
    const validTypes = ['TEXT', 'IMAGE', 'AUDIO', 'VIDEO'];
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        ...(text !== undefined && { text: text.trim() }),
        ...(answer !== undefined && { answer: answer.trim() }),
        ...(points !== undefined && { points: Number(points) }),
        ...(questionType !== undefined && validTypes.includes(questionType) && {
          questionType: questionType as 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO',
        }),
        ...(mediaUrl !== undefined && { mediaUrl: mediaUrl.trim() || null }),
      },
    });
    res.json({ question });
  } catch (err) {
    console.error('[admin/questions PATCH]', err);
    res.status(500).json({ error: 'Ошибка обновления вопроса' });
  }
});

// ─── DELETE /api/admin/questions/:id ─────────
router.delete('/questions/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/questions DELETE]', err);
    res.status(500).json({ error: 'Ошибка удаления вопроса' });
  }
});

export default router;
