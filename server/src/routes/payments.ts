import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../prisma/client";
import { requireAuth } from "../middleware/auth";
import { getSettings } from "../services/settings";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// ────────────────────────────────────────────
// POST /api/payments/checkout
// Создаём Stripe Checkout Session для покупки темы
// ────────────────────────────────────────────

router.post("/checkout", requireAuth, async (req: Request, res: Response) => {
  try {
    const { themeId } = req.body as { themeId: string };
    const userId = req.user!.userId;

    if (!themeId) {
      res.status(400).json({ error: "themeId обязателен" });
      return;
    }

    // Проверяем тему
    const theme = await prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) {
      res.status(404).json({ error: "Тема не найдена" });
      return;
    }
    if (theme.isFree) {
      res.status(400).json({ error: "Эта тема бесплатная" });
      return;
    }

    // Проверяем, не куплена ли уже
    const existing = await prisma.purchase.findUnique({
      where: { userId_themeId: { userId, themeId } },
    });
    if (existing) {
      res.status(409).json({ error: "Тема уже куплена" });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "rub",
      line_items: [
        {
          price_data: {
            currency: "rub",
            unit_amount: getSettings().themePrice,
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
    console.error("[payments/checkout]", err);
    res.status(500).json({ error: "Ошибка создания платежа" });
  }
});

// ────────────────────────────────────────────
// POST /api/payments/webhook
// Stripe вызывает этот URL после оплаты
// ВАЖНО: raw body, монтируется ДО express.json()
// ────────────────────────────────────────────

router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    res.status(400).json({ error: "Webhook secret not configured" });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, themeId, themeIds } =
      session.metadata || {};

    if (!userId) {
      console.error("[webhook] Missing userId in metadata");
      res.json({ received: true });
      return;
    }

    try {
      if (themeId) {
        // Одиночная покупка темы
        await prisma.purchase.upsert({
          where: { userId_themeId: { userId, themeId } },
          create: { userId, themeId, stripeId: session.id },
          update: { stripeId: session.id },
        });
        console.log(
          `[webhook] Purchase recorded: user=${userId} theme=${themeId}`,
        );
      } else if (themeIds) {
        // Покупка набора или корзины — создаём записи для каждой темы
        const ids = themeIds.split(",").filter(Boolean);
        for (const tid of ids) {
          await prisma.purchase.upsert({
            where: { userId_themeId: { userId, themeId: tid } },
            create: { userId, themeId: tid, stripeId: session.id },
            update: { stripeId: session.id },
          });
        }
        console.log(
          `[webhook] Multi-purchase recorded: user=${userId} themes=${ids.length}`,
        );
      } else {
        console.error(
          "[webhook] Missing themeId or themeIds in metadata",
        );
      }
    } catch (err) {
      console.error("[webhook] DB error:", err);
      res.status(500).json({ error: "DB error" });
      return;
    }
  }

  res.json({ received: true });
});

// ────────────────────────────────────────────
// POST /api/payments/checkout-bundle
// Покупка набора — все платные темы категории со скидкой 20%
// ────────────────────────────────────────────

router.post(
  "/checkout-bundle",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { themeIds } = req.body as { themeIds: string[] };
      const userId = req.user!.userId;

      if (!themeIds || !Array.isArray(themeIds) || themeIds.length === 0) {
        res.status(400).json({ error: "themeIds обязателен" });
        return;
      }

      if (themeIds.length < 3 || themeIds.length > 5) {
        res.status(400).json({ error: "Набор должен содержать от 3 до 5 тем" });
        return;
      }

      // Проверяем что все темы существуют и платные
      const themes = await prisma.theme.findMany({
        where: { id: { in: themeIds }, isFree: false },
        select: { id: true, name: true, category: true },
      });

      if (themes.length !== themeIds.length) {
        res.status(400).json({ error: "Некоторые темы не найдены или являются бесплатными" });
        return;
      }

      // Проверяем, не куплены ли уже
      const alreadyPurchased = await prisma.purchase.findMany({
        where: { userId, themeId: { in: themeIds } },
        select: { themeId: true },
      });
      if (alreadyPurchased.length > 0) {
        res.status(409).json({ error: "Некоторые темы из набора уже куплены" });
        return;
      }

      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const bundleCategory = themes[0].category;
      const { themePrice, bundleDiscount } = getSettings();
      const bundlePricePerTheme = Math.round(themePrice * (1 - bundleDiscount / 100));
      const totalPrice = bundlePricePerTheme * themeIds.length;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        currency: "rub",
        line_items: [
          {
            price_data: {
              currency: "rub",
              unit_amount: totalPrice,
              product_data: {
                name: `Набор: ${themeIds.length} тем`,
                description: themes.map((t) => t.name).join(", "),
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          bundleCategory,
          themeIds: themeIds.join(","),
        },
        success_url: `${clientUrl}/store?success=1&bundle=${encodeURIComponent(bundleCategory)}`,
        cancel_url: `${clientUrl}/store?cancelled=1`,
      });

      res.json({ url: session.url });
    } catch (err) {
      console.error("[payments/checkout-bundle]", err);
      res.status(500).json({ error: "Ошибка создания платежа" });
    }
  },
);

// ────────────────────────────────────────────
// GET /api/payments/purchases — мои покупки
// ────────────────────────────────────────────

router.get("/purchases", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      select: { themeId: true, createdAt: true },
    });
    res.json({ purchases });
  } catch (err) {
    console.error("[payments/purchases]", err);
    res.status(500).json({ error: "Ошибка загрузки покупок" });
  }
});

// ────────────────────────────────────────────
// POST /api/payments/checkout-cart
// Оплата корзины — произвольный набор тем по 100 ₽
// ────────────────────────────────────────────

router.post("/checkout-cart", requireAuth, async (req: Request, res: Response) => {
  try {
    const { items } = req.body as {
      items: Array<{ type: "theme" | "bundle"; themeIds: string[] }>;
    };
    const userId = req.user!.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "items обязателен" });
      return;
    }

    // Собираем все ID тем из корзины
    const allThemeIds = items.flatMap((i) => i.themeIds);
    if (allThemeIds.length === 0) {
      res.status(400).json({ error: "Корзина пуста" });
      return;
    }

    // Уникальные ID (на случай дублей)
    const uniqueIds = [...new Set(allThemeIds)];

    // Проверяем что все темы существуют и платные
    const dbThemes = await prisma.theme.findMany({
      where: { id: { in: uniqueIds }, isFree: false },
      select: { id: true, name: true },
    });
    if (dbThemes.length !== uniqueIds.length) {
      res.status(400).json({ error: "Некоторые темы не найдены или бесплатные" });
      return;
    }

    // Проверяем уже купленные
    const alreadyPurchased = await prisma.purchase.findMany({
      where: { userId, themeId: { in: uniqueIds } },
      select: { themeId: true },
    });
    if (alreadyPurchased.length > 0) {
      res.status(409).json({ error: "Некоторые темы уже куплены" });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // Строим line_items: каждый item корзины — отдельная строка
    const lineItems = items.map((item) => {
      const { themePrice: tp, bundleDiscount: bd } = getSettings();
      const pricePerTheme = item.type === "bundle" ? Math.round(tp * (1 - bd / 100)) : tp;
      const names = item.themeIds
        .map((id) => dbThemes.find((t) => t.id === id)?.name ?? id)
        .join(", ");
      const label =
        item.type === "bundle"
          ? `Набор: ${item.themeIds.length} тем (−20%)`
          : item.themeIds.length === 1
          ? names
          : `Темы: ${names}`;
      return {
        price_data: {
          currency: "rub",
          unit_amount: pricePerTheme * item.themeIds.length,
          product_data: { name: label, description: names },
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "rub",
      line_items: lineItems,
      metadata: {
        userId,
        themeIds: uniqueIds.join(","),
      },
      success_url: `${clientUrl}/store?success=1&cart=1`,
      cancel_url: `${clientUrl}/store?cancelled=1`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[payments/checkout-cart]", err);
    res.status(500).json({ error: "Ошибка создания платежа" });
  }
});

export default router;
