import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { signToken } from '../services/jwtService';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ────────────────────────────────────────────
// Схемы валидации
// ────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(6, 'Пароль минимум 6 символов')
    .max(100, 'Пароль слишком длинный'),
  name: z
    .string()
    .min(2, 'Имя минимум 2 символа')
    .max(50, 'Имя слишком длинное')
    .trim(),
});

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

// ────────────────────────────────────────────
// Хелпер: установить httpOnly cookie с токеном
// ────────────────────────────────────────────

function setTokenCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    path: '/',
  });
}

// ────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as z.infer<typeof registerSchema>;

    // Проверяем, не занят ли email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 12);

    // Создаём пользователя
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // Выдаём токен
    const token = signToken({ userId: user.id, email: user.email });
    setTokenCookie(res, token);

    res.status(201).json({
      message: 'Регистрация успешна',
      user,
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    // Ищем пользователя
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    // Проверяем пароль
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    // Выдаём токен
    const token = signToken({ userId: user.id, email: user.email });
    setTokenCookie(res, token);

    res.json({
      message: 'Вход выполнен',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Выход выполнен' });
});

// ────────────────────────────────────────────
// GET /api/auth/me — получить текущего пользователя
// ────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        purchases: {
          select: {
            themeId: true,
            createdAt: true,
          },
        },
        _count: {
          select: { games: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// GET /api/auth/check — быстрая проверка токена
// ────────────────────────────────────────────

router.get('/check', requireAuth, (req: Request, res: Response) => {
  res.json({ authenticated: true, userId: req.user!.userId });
});

export default router;
