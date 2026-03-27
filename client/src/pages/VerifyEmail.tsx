import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../api/auth';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Токен не указан'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const msg = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
        setErrorMsg(msg || 'Недействительная или устаревшая ссылка');
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-deep)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--text-muted)' }}>Подтверждаем email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Email подтверждён!
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Теперь вы можете войти в аккаунт.
            </p>
            <Link to="/auth"
              className="inline-block px-8 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'var(--accent-gold)', color: '#07090F' }}>
              Войти
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Ошибка подтверждения
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--accent-red)' }}>{errorMsg}</p>
            <Link to="/auth"
              className="text-sm hover:underline" style={{ color: 'var(--accent-blue)' }}>
              Вернуться на страницу входа
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
