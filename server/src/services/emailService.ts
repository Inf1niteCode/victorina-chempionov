import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.yandex.ru',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || `"Викторина Чемпионов" <${process.env.SMTP_USER}>`;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function baseLayout(content: string): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f1117;border-radius:16px;overflow:hidden;border:1px solid #1f2937">
      <div style="background:linear-gradient(135deg,#F59E0B,#f97316);padding:24px 32px;text-align:center">
        <span style="font-size:2rem">🏆</span>
        <h1 style="color:#07090F;margin:8px 0 0;font-size:1.3rem;font-weight:800">Викторина Чемпионов</h1>
      </div>
      <div style="padding:32px">
        ${content}
      </div>
      <div style="padding:16px 32px;text-align:center;border-top:1px solid #1f2937">
        <p style="color:#6b7280;font-size:0.75rem;margin:0">Если вы не совершали этого действия — просто проигнорируйте письмо.</p>
      </div>
    </div>
  `;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Подтвердите ваш email — Викторина Чемпионов',
    html: baseLayout(`
      <h2 style="color:#f9fafb;margin:0 0 12px">Подтвердите email</h2>
      <p style="color:#9ca3af;margin:0 0 24px">Нажмите кнопку ниже, чтобы активировать аккаунт. Ссылка действительна 24 часа.</p>
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#f97316);color:#07090F;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:1rem">
        Подтвердить email
      </a>
      <p style="color:#6b7280;font-size:0.8rem;margin:24px 0 0">Или скопируйте ссылку:<br><a href="${url}" style="color:#60a5fa;word-break:break-all">${url}</a></p>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${CLIENT_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Сброс пароля — Викторина Чемпионов',
    html: baseLayout(`
      <h2 style="color:#f9fafb;margin:0 0 12px">Сброс пароля</h2>
      <p style="color:#9ca3af;margin:0 0 24px">Нажмите кнопку ниже, чтобы задать новый пароль. Ссылка действительна <strong style="color:#f9fafb">1 час</strong>.</p>
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:1rem">
        Сбросить пароль
      </a>
      <p style="color:#6b7280;font-size:0.8rem;margin:24px 0 0">Или скопируйте ссылку:<br><a href="${url}" style="color:#60a5fa;word-break:break-all">${url}</a></p>
    `),
  });
}
