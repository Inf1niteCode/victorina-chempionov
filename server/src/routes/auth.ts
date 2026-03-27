import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { signToken } from '../services/jwtService';
import { requireAuth, isAdminEmail } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

const router = Router();

// ────────────────────────────────────────────
// Схемы валидации
// ────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов').max(100, 'Пароль слишком длинный'),
  name: z.string().min(2, 'Имя минимум 2 символа').max(50, 'Имя слишком длинное').trim(),
});

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

// ────────────────────────────────────────────
// Хелперы
// ────────────────────────────────────────────

function setTokenCookie(res: Response, token: string): void {
  const isHttps = process.env.CLIENT_URL?.startsWith('https');
  res.cookie('token', token, {
    httpOnly: true,
    secure: isHttps || false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function genToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as z.infer<typeof registerSchema>;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerificationToken = genToken();

    await prisma.user.create({
      data: { email, passwordHash, name, emailVerified: false, emailVerificationToken },
    });

    // Отправляем письмо (не блокируем ответ если SMTP не настроен)
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (mailErr) {
      console.error('[auth/register] email send failed:', mailErr);
    }

    res.status(201).json({
      message: 'Регистрация успешна. Проверьте почту для подтверждения email.',
      emailSent: true,
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        error: 'Email не подтверждён. Проверьте почту и перейдите по ссылке из письма.',
        emailNotVerified: true,
      });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    setTokenCookie(res, token);

    res.json({
      message: 'Вход выполнен',
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// GET /api/auth/verify-email?token=...
// ────────────────────────────────────────────

router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query as { token?: string };

    if (!token) {
      res.status(400).json({ error: 'Токен не указан' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } });
    if (!user) {
      res.status(400).json({ error: 'Недействительная или устаревшая ссылка' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });

    res.json({ message: 'Email успешно подтверждён' });
  } catch (err) {
    console.error('[auth/verify-email]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// POST /api/auth/forgot-password
// ────────────────────────────────────────────

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    // Всегда один ответ — не раскрываем наличие аккаунта
    const genericResponse = () =>
      res.json({ message: 'Если этот email зарегистрирован, вы получите письмо со ссылкой для сброса пароля.' });

    if (!email || typeof email !== 'string') return genericResponse();

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return genericResponse();

    const resetToken = genToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpires: expires },
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (mailErr) {
      console.error('[auth/forgot-password] email send failed:', mailErr);
    }

    return genericResponse();
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// POST /api/auth/reset-password
// ────────────────────────────────────────────

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password) {
      res.status(400).json({ error: 'Токен и пароль обязательны' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Пароль минимум 6 символов' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      res.status(400).json({ error: 'Ссылка недействительна или истекла. Запросите новую.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
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
// GET /api/auth/me
// ────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { games: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ user: { ...user, isAdmin: isAdminEmail(user.email) } });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// PATCH /api/auth/password — смена пароля
// ────────────────────────────────────────────

router.patch('/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Укажите текущий и новый пароль' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Новый пароль минимум 6 символов' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Неверный текущий пароль' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('[auth/password]', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ────────────────────────────────────────────
// GET /api/auth/check
// ────────────────────────────────────────────

router.get('/check', requireAuth, (req: Request, res: Response) => {
  res.json({ authenticated: true, userId: req.user!.userId });
});

export default router;
