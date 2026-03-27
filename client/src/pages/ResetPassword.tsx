import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../api/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    if (!token) { setError('Недействительная ссылка'); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/auth?reset=1'), 2500);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : null;
      setError(msg || 'Ошибка. Попробуйте запросить новую ссылку.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="mb-4" style={{ color: 'var(--accent-red)' }}>Недействительная ссылка</p>
          <Link to="/forgot-password" className="underline text-sm" style={{ color: 'var(--accent-blue)' }}>
            Запросить новую
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-deep)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold" style={{ color: 'var(--accent-gold)' }}>🏆 Викторина</span>
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}> Чемпионов</span>
          </Link>
        </div>

        <div className="rounded-2xl p-6 sm:p-8 shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2 space-y-4">
                <div className="text-5xl">✅</div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Пароль изменён!</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Переходим на страницу входа...
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Новый пароль</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Придумайте надёжный пароль</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Новый пароль
                    </label>
                    <input type="password" value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Минимум 6 символов" required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Подтвердите пароль
                    </label>
                    <input type="password" value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                      placeholder="Повторите пароль" required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--accent-blue)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as unknown as React.FormEvent)}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-sm px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {error}
                        {error.includes('ссылку') && (
                          <span> <Link to="/forgot-password" className="underline" style={{ color: 'var(--accent-blue)' }}>Запросить</Link></span>
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                    style={{
                      background: loading ? 'var(--bg-surface)' : 'linear-gradient(135deg, var(--accent-blue) 0%, #6366f1 100%)',
                      color: loading ? 'var(--text-muted)' : '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Сохраняем...
                      </span>
                    ) : 'Сохранить пароль'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/auth" className="hover:underline" style={{ color: 'var(--accent-blue)' }}>← Вернуться к входу</Link>
        </p>
      </motion.div>
    </div>
  );
}
