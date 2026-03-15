import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../services/jwtService';

export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!adminEmail && email === adminEmail;
}

// Расширяем тип Request, чтобы хранить данные пользователя
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Проверяем httpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.token;
    if (!token) { res.status(401).json({ error: 'Не авторизован' }); return; }
    const payload = verifyToken(token);
    req.user = payload;
    if (!isAdminEmail(payload.email)) {
      res.status(403).json({ error: 'Доступ запрещён' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

// Опциональная авторизация — не блокирует, но прикрепляет user если есть токен
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.token;
    if (token) {
      req.user = verifyToken(token);
    }
  } catch {
    // Игнорируем невалидный токен
  }
  next();
}
