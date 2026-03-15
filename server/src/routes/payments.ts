import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const THEME_PRICE = parseInt(process.env.STRIPE_PRICE_THEME || '10000', 10); // 100 руб

// ────────────────────────────────────────────
// POST /api/payments/checkout
// Создаём Stripe Checkout Session для покупки темы
// ────────────────────────────────────────────

router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { themeId } = req.body as { themeId: string };
    const userId = req.user!.userId;

    if (!themeId) {
      res.status(400).json({ error: 'themeId обязателен' });
      return;
    }

    // Проверяем тему
    const theme = await prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) {
      res.status(404).json({ error: 'Тема не найдена' });
      return;
    }
    if (theme.isFree) {
      res.status(400).json({ error: 'Эта тема бесплатная' });
      return;
    }

    // Проверяем, не куплена ли уже
    const existing = await prisma.purchase.findUnique({
      where: { userId_themeId: { userId, themeId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Тема уже куплена' });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'rub',
      line_items: [
        {
          price_data: {
            currency: 'rub',
            unit_amount: THEME_PRICE,
            product_data: {
              name: `Тема «${theme.name}»`,
              description: `Категория: ${theme.category} · 5 вопросов`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { userId, themeId },
      success_url: `${clientUrl}/store?success=1&theme=${themeId}`,
      cancel_url: `${clientUrl}/store?cancelled=1`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[payments/checkout]', err);
    res.status(500).json({ error: 'Ошибка создания платежа' });
  }
});

// ────────────────────────────────────────────
// POST /api/payments/webhook
// Stripe вызывает этот URL после оплаты
// ВАЖНО: raw body, монтируется ДО express.json()
// ────────────────────────────────────────────

router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    res.status(400).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, themeId } = session.metadata || {};

    if (!userId || !themeId) {
      console.error('[webhook] Missing metadata');
      res.json({ received: true });
      return;
    }

    try {
      // Идемпотентно — upsert чтобы не дублировать
      await prisma.purchase.upsert({
        where: { userId_themeId: { userId, themeId } },
        create: {
          userId,
          themeId,
          stripeId: session.id,
        },
        update: {
          stripeId: session.id,
        },
      });

      console.log(`[webhook] Purchase recorded: user=${userId} theme=${themeId}`);
    } catch (err) {
      console.error('[webhook] DB error:', err);
      res.status(500).json({ error: 'DB error' });
      return;
    }
  }

  res.json({ received: true });
});

// ────────────────────────────────────────────
// GET /api/payments/purchases — мои покупки
// ────────────────────────────────────────────

router.get('/purchases', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      select: { themeId: true, createdAt: true },
    });
    res.json({ purchases });
  } catch (err) {
    console.error('[payments/purchases]', err);
    res.status(500).json({ error: 'Ошибка загрузки покупок' });
  }
});

export default router;
